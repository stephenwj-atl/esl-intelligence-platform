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
  seismicRisk: number | null;
  coralReefRisk: number | null;
  soilRisk: number | null;
  populationExposure: number | null;
  healthVulnerability: number | null;
  developmentVulnerability: number | null;
  heritageRisk: number | null;
  infrastructureVulnerability: number | null;
  compositeFloodRisk: number | null;
  seaLevelRiseRisk: number | null;
  watershedFloodRisk: number | null;
  housingVulnerability: number | null;
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
    protectedAreaConflict: latest("Protected Area Conflict Risk") ?? latest("Protected Area Conflict"),
    seismicRisk: latest("Seismic Risk Score"),
    coralReefRisk: latest("Coral Reef Risk Score"),
    soilRisk: latest("Geotechnical Risk Score"),
    populationExposure: latest("Population Exposure Score"),
    healthVulnerability: latest("Health Vulnerability Score"),
    developmentVulnerability: latest("Development Vulnerability Score"),
    heritageRisk: latest("Heritage Risk Score"),
    infrastructureVulnerability: latest("Infrastructure Vulnerability Score"),
    compositeFloodRisk: latest("Composite Flood Risk Score"),
    seaLevelRiseRisk: latest("Sea Level Rise Risk Score"),
    watershedFloodRisk: latest("Watershed Flood Risk Score"),
    housingVulnerability: latest("Housing Vulnerability Score"),
  };
}

function computeEnvironmentalScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.hurricaneExposure, weight: 0.22 },
    { value: scores.compositeFloodRisk ?? scores.floodRisk, weight: 0.18 },
    { value: scores.seaLevelRiseRisk, weight: 0.12 },
    { value: scores.watershedFloodRisk, weight: 0.10 },
    { value: scores.contaminationRisk, weight: 0.12 },
    { value: scores.seismicRisk, weight: 0.12 },
    { value: scores.coralReefRisk, weight: 0.07 },
    { value: scores.soilRisk, weight: 0.07 },
  ]);
}

function computeInfrastructureScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.waterStress, weight: 0.35 },
    { value: scores.infrastructureVulnerability, weight: 0.35 },
    { value: scores.developmentVulnerability, weight: 0.30 },
  ]);
}

function computeCommunityScore(scores: DatasetScores): number | null {
  const densityInverse = scores.healthFacilityDensity !== null
    ? clamp(100 - scores.healthFacilityDensity, 0, 100)
    : null;
  return weightedAverage([
    { value: densityInverse, weight: 0.15 },
    { value: scores.populationExposure, weight: 0.20 },
    { value: scores.healthVulnerability, weight: 0.40 },
    { value: scores.housingVulnerability, weight: 0.25 },
  ]);
}

function computeRegulatoryScore(scores: DatasetScores): number | null {
  return weightedAverage([
    { value: scores.protectedAreaConflict, weight: 0.60 },
    { value: scores.heritageRisk, weight: 0.40 },
  ]);
}

function computeConfidence(scores: DatasetScores, freshnessSources: Array<{ confidence: number }>): number {
  const floodSignal = scores.compositeFloodRisk ?? scores.floodRisk;
  const availableComponents = [
    scores.waterStress,
    scores.hurricaneExposure,
    scores.healthFacilityDensity,
    floodSignal,
    scores.contaminationRisk,
    scores.protectedAreaConflict,
    scores.seismicRisk,
    scores.coralReefRisk,
    scores.soilRisk,
    scores.populationExposure,
    scores.healthVulnerability,
    scores.developmentVulnerability,
    scores.heritageRisk,
    scores.infrastructureVulnerability,
    scores.seaLevelRiseRisk,
    scores.watershedFloodRisk,
    scores.housingVulnerability,
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
    if (scores.protectedAreaConflict !== null) sources.push("wdpa");
    if (scores.seismicRisk !== null) sources.push("usgs-earthquake");
    if (scores.coralReefRisk !== null) sources.push("noaa-crw");
    if (scores.soilRisk !== null) sources.push("isric-soilgrids");
    if (scores.populationExposure !== null) sources.push("worldpop");
    if (scores.healthVulnerability !== null) sources.push("who-gho");
    if (scores.developmentVulnerability !== null) sources.push("world-bank");
    if (scores.heritageRisk !== null) sources.push("unesco-whc");
    if (scores.infrastructureVulnerability !== null) sources.push("osm-infrastructure");
    if (scores.compositeFloodRisk !== null) sources.push("jrc-flood");
    if (scores.seaLevelRiseRisk !== null) sources.push("noaa-slr");
    if (scores.watershedFloodRisk !== null) sources.push("hydrosheds");
    if (scores.housingVulnerability !== null) sources.push("open-buildings");

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
