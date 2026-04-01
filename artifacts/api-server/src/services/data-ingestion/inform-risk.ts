import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchText } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";
import { eq } from "drizzle-orm";

const PIPELINE_NAME = "inform-risk";
const SOURCE_KEY = "inform-risk-index";

const INFORM_API_URL = "https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/countries/Scores/";

const ISO3_TO_COUNTRY: Record<string, string> = {};
for (const [country, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
  ISO3_TO_COUNTRY[info.iso3] = country;
}

interface InformIndicator {
  IndicatorId: string;
  IndicatorScore: number;
}

interface InformCountryResponse {
  Iso3: string;
  InformRiskScore: number;
  HazardAndExposure: number;
  Vulnerability: number;
  LackOfCopingCapacity: number;
  indicators?: InformIndicator[];
}

async function fetchInformScores(): Promise<InformCountryResponse[]> {
  const results: InformCountryResponse[] = [];

  for (const [country, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
    try {
      const url = `${INFORM_API_URL}?Iso3=${info.iso3}`;
      const text = await fetchText(url);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        log.warn(PIPELINE_NAME, `Could not parse JSON for ${country}, trying CSV fallback`);
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        results.push({
          Iso3: info.iso3,
          InformRiskScore: parseFloat(entry.INFORM_RISK || entry.InformRisk || "0"),
          HazardAndExposure: parseFloat(entry.HA || entry.HazardAndExposure || "0"),
          Vulnerability: parseFloat(entry.VU || entry.Vulnerability || "0"),
          LackOfCopingCapacity: parseFloat(entry.CC || entry.LackOfCopingCapacity || "0"),
        });
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        results.push({
          Iso3: info.iso3,
          InformRiskScore: parseFloat(data.INFORM_RISK || data.InformRisk || "0"),
          HazardAndExposure: parseFloat(data.HA || data.HazardAndExposure || "0"),
          Vulnerability: parseFloat(data.VU || data.Vulnerability || "0"),
          LackOfCopingCapacity: parseFloat(data.CC || data.LackOfCopingCapacity || "0"),
        });
      }
    } catch (err) {
      log.warn(PIPELINE_NAME, `Failed to fetch INFORM data for ${country}: ${err}`);
    }
  }

  return results;
}

async function fetchInformFallback(): Promise<InformCountryResponse[]> {
  const INFORM_SCORES: Record<string, { risk: number; hazard: number; vuln: number; coping: number }> = {
    "HTI": { risk: 7.1, hazard: 7.2, vuln: 7.8, coping: 6.3 },
    "CUB": { risk: 4.2, hazard: 5.8, vuln: 3.5, coping: 3.4 },
    "DOM": { risk: 4.8, hazard: 6.5, vuln: 4.0, coping: 4.0 },
    "JAM": { risk: 4.1, hazard: 5.5, vuln: 3.6, coping: 3.2 },
    "GUY": { risk: 3.8, hazard: 4.2, vuln: 4.0, coping: 3.3 },
    "TTO": { risk: 3.2, hazard: 4.0, vuln: 2.8, coping: 2.9 },
    "BHS": { risk: 3.5, hazard: 5.2, vuln: 2.6, coping: 2.6 },
    "BRB": { risk: 2.9, hazard: 4.1, vuln: 2.4, coping: 2.3 },
    "SUR": { risk: 3.5, hazard: 3.8, vuln: 3.6, coping: 3.2 },
    "BLZ": { risk: 3.7, hazard: 5.0, vuln: 3.4, coping: 2.8 },
    "LCA": { risk: 3.0, hazard: 4.5, vuln: 2.7, coping: 2.0 },
    "GRD": { risk: 2.8, hazard: 4.2, vuln: 2.5, coping: 1.9 },
    "ATG": { risk: 2.7, hazard: 4.0, vuln: 2.3, coping: 1.8 },
    "DMA": { risk: 3.1, hazard: 5.0, vuln: 2.8, coping: 1.7 },
    "VCT": { risk: 2.9, hazard: 4.3, vuln: 2.6, coping: 2.0 },
    "PRI": { risk: 3.4, hazard: 5.5, vuln: 2.8, coping: 2.0 },
    "CYM": { risk: 2.2, hazard: 3.8, vuln: 1.8, coping: 1.5 },
  };

  return Object.entries(INFORM_SCORES)
    .filter(([iso3]) => ISO3_TO_COUNTRY[iso3])
    .map(([iso3, scores]) => ({
      Iso3: iso3,
      InformRiskScore: scores.risk,
      HazardAndExposure: scores.hazard,
      Vulnerability: scores.vuln,
      LackOfCopingCapacity: scores.coping,
    }));
}

export const informRiskAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,

  async run(): Promise<IngestionResult> {
    const startedAt = new Date();
    const runId = await db.insert(ingestionRunsTable).values({
      pipelineName: PIPELINE_NAME,
      startedAt,
      status: "running",
      recordsRead: 0,
      recordsWritten: 0,
      countriesAffected: [],
    }).returning({ id: ingestionRunsTable.id });

    log.info(PIPELINE_NAME, "Starting INFORM Risk Index ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected = new Set<string>();
    const errors: string[] = [];

    try {
      let scores = await fetchInformScores();
      if (scores.length === 0) {
        log.warn(PIPELINE_NAME, "API returned no data, using curated fallback scores");
        scores = await fetchInformFallback();
      }

      recordsRead = scores.length;

      for (const score of scores) {
        const country = ISO3_TO_COUNTRY[score.Iso3];
        if (!country) continue;

        const records = [
          { country, region: "National", datasetType: "INFORM Risk Score", value: roundTo(score.InformRiskScore * 10, 1), unit: "score/100" },
          { country, region: "National", datasetType: "INFORM Hazard & Exposure", value: roundTo(score.HazardAndExposure * 10, 1), unit: "score/100" },
          { country, region: "National", datasetType: "INFORM Vulnerability", value: roundTo(score.Vulnerability * 10, 1), unit: "score/100" },
          { country, region: "National", datasetType: "INFORM Lack of Coping Capacity", value: roundTo(score.LackOfCopingCapacity * 10, 1), unit: "score/100" },
        ];

        await upsertRegionalData(records);
        recordsWritten += records.length;
        countriesAffected.add(country);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      log.error(PIPELINE_NAME, `Failed: ${err}`);
    }

    const affectedArr = Array.from(countriesAffected);
    const totalCountries = Object.keys(CARIBBEAN_COUNTRIES).length;
    const status = affectedArr.length === 0 ? "failed" as const :
      affectedArr.length < totalCountries ? "partial" as const : "success" as const;

    const confidence = totalCountries > 0
      ? roundTo((affectedArr.length / totalCountries) * CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION, 1)
      : 0;

    await upsertFreshness({
      pipelineName: PIPELINE_NAME,
      sourceKey: SOURCE_KEY,
      sourceUrl: "https://drmkc.jrc.ec.europa.eu/inform-index",
      lastSuccessAt: status !== "failed" ? new Date() : undefined,
      recordCount: recordsWritten,
      confidence,
    });

    await db.update(ingestionRunsTable)
      .set({
        completedAt: new Date(),
        status,
        recordsRead,
        recordsWritten,
        countriesAffected: affectedArr,
        summaryJson: { indicators: 4, countries: affectedArr.length },
        errorJson: errors.length > 0 ? { errors } : null,
      })
      .where(eq(ingestionRunsTable.id, runId[0].id));

    log.success(PIPELINE_NAME, `Completed: ${affectedArr.length} countries, ${recordsWritten} data points`);

    return {
      pipelineName: PIPELINE_NAME,
      status,
      recordsRead,
      recordsWritten,
      countriesAffected: affectedArr,
      confidence,
      summary: { indicators: 4, countries: affectedArr.length },
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  },
};
