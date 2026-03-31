import { db, regionalIndicesTable, regionalDataTable, dataSourceFreshnessTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { roundTo, weightedAverage, clamp } from "./utils/normalize";
import { ingestionLogger as log } from "./utils/logger";
import { SCORING_WEIGHTS, CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";
import type { CountryRiskComponents } from "./types";

const PIPELINE_NAME = "scoring";

interface DatasetScores {
  waterStress: number | null;
  hurricaneExposure: number | null;
  healthFacilityDensity: number | null;
  floodRisk: number | null;
  contaminationRisk: number | null;
  protectedAreaConflict: number | null;
}

async function getDatasetScores(country: string): Promise<DatasetScores> {
  const data = await db.select()
    .from(regionalDataTable)
    .where(eq(regionalDataTable.country, country));

  const latest = (type: string) => {
    const matches = data
      .filter(d => d.datasetType === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return matches[0]?.value ?? null;
  };

  return {
    waterStress: latest("Water Stress - Baseline Water Stress"),
    hurricaneExposure: latest("Hurricane Exposure"),
    healthFacilityDensity: latest("Health Facility Density"),
    floodRisk: latest("Flood Risk"),
    contaminationRisk: latest("Contamination Risk"),
    protectedAreaConflict: latest("Protected Area Conflict"),
  };
}

function computeEnvironmentalScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.hurricaneExposure, weight: 0.40 },
    { value: scores.floodRisk, weight: 0.30 },
    { value: scores.contaminationRisk, weight: 0.30 },
  ]);
}

function computeInfrastructureScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.waterStress, weight: 1.0 },
  ]);
}

function computeCommunityScore(scores: DatasetScores): number | null {
  const densityInverse = scores.healthFacilityDensity !== null
    ? clamp(100 - scores.healthFacilityDensity, 0, 100)
    : null;
  return weightedAverage([
    { value: densityInverse, weight: 1.0 },
  ]);
}

function computeRegulatoryScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.protectedAreaConflict, weight: 1.0 },
  ]);
}

function computeConfidence(scores: DatasetScores, freshnessSources: Array<{ confidence: number }>): number {
  const availableComponents = [
    scores.waterStress,
    scores.hurricaneExposure,
    scores.healthFacilityDensity,
    scores.floodRisk,
    scores.contaminationRisk,
    scores.protectedAreaConflict,
  ];

  const totalPossible = availableComponents.length;
  const available = availableComponents.filter(v => v !== null).length;
  const coverageRatio = available / totalPossible;

  const sourceConfidence = freshnessSources.length > 0
    ? freshnessSources.reduce((sum, s) => sum + s.confidence, 0) / freshnessSources.length
    : CONFIDENCE_THRESHOLDS.MISSING;

  return roundTo(clamp(coverageRatio * sourceConfidence, 0, 100));
}

export async function computeCountryScores(): Promise<CountryRiskComponents[]> {
  log.info(PIPELINE_NAME, "Computing country risk scores from ingested data");

  const freshnessSources = await db.select().from(dataSourceFreshnessTable);
  const successfulSources = freshnessSources.filter(s => s.status === "success");

  const results: CountryRiskComponents[] = [];

  for (const country of Object.keys(CARIBBEAN_COUNTRIES)) {
    const scores = await getDatasetScores(country);

    const environmental = computeEnvironmentalScore(scores);
    const infrastructure = computeInfrastructureScore(scores);
    const community = computeCommunityScore(scores);
    const regulatory = computeRegulatoryScore(scores);

    const overallRisk = weightedAverage([
      { value: environmental, weight: SCORING_WEIGHTS.ENVIRONMENTAL },
      { value: infrastructure, weight: SCORING_WEIGHTS.INFRASTRUCTURE },
      { value: community, weight: SCORING_WEIGHTS.COMMUNITY },
      { value: regulatory, weight: SCORING_WEIGHTS.REGULATORY },
    ]);

    const confidence = computeConfidence(scores, successfulSources);

    const sources: string[] = [];
    if (scores.waterStress !== null) sources.push("wri-aqueduct");
    if (scores.hurricaneExposure !== null) sources.push("noaa-ibtracs");
    if (scores.healthFacilityDensity !== null) sources.push("jamaica-opendata");
    if (scores.floodRisk !== null) sources.push("arcgis-jamaica-flood");
    if (scores.contaminationRisk !== null) sources.push("arcgis-jamaica-prtr");
    if (scores.protectedAreaConflict !== null) sources.push("arcgis-jamaica-protected");

    results.push({
      country,
      environmental,
      infrastructure,
      community,
      regulatory,
      overallRisk: overallRisk !== null ? roundTo(clamp(overallRisk, 0, 100)) : null,
      confidence,
      sources,
    });
  }

  return results;
}

export async function writeScoresToDB(scores: CountryRiskComponents[]): Promise<number> {
  const currentYear = new Date().getFullYear();
  let written = 0;

  for (const score of scores) {
    if (score.overallRisk === null && score.confidence === 0) continue;

    const [existing] = await db.select()
      .from(regionalIndicesTable)
      .where(and(
        eq(regionalIndicesTable.country, score.country),
        eq(regionalIndicesTable.year, currentYear)
      ));

    const riskScore = score.overallRisk ?? (existing?.riskScore ?? 0);
    const infraScore = score.infrastructure ?? (existing?.infrastructureScore ?? 0);
    const waterScore = existing?.waterStressScore ?? 0;

    if (existing) {
      await db.update(regionalIndicesTable)
        .set({
          riskScore,
          infrastructureScore: infraScore,
          confidence: score.confidence,
        })
        .where(eq(regionalIndicesTable.id, existing.id));
    } else {
      await db.insert(regionalIndicesTable).values({
        country: score.country,
        riskScore,
        infrastructureScore: infraScore,
        waterStressScore: waterScore,
        confidence: score.confidence,
        year: currentYear,
      });
    }
    written++;
  }

  log.success(PIPELINE_NAME, `Updated ${written} country scores for ${currentYear}`);
  return written;
}
