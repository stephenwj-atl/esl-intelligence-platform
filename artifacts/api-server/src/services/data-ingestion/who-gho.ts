import { db, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "who-gho";
const SOURCE_KEY = "who-gho-health";

const GHO_API = "https://ghoapi.azureedge.net/api";

const HEALTH_INDICATORS = [
  { code: "WHOSIS_000001", name: "Life Expectancy at Birth", unit: "years", riskWeight: -1 },
  { code: "MDG_0000000007", name: "Under-5 Mortality Rate", unit: "per_1000", riskWeight: 1 },
  { code: "WHS4_100", name: "Physician Density", unit: "per_10000", riskWeight: -1 },
  { code: "WHS6_102", name: "Hospital Bed Density", unit: "per_10000", riskWeight: -1 },
  { code: "SA_0000001688", name: "Current Health Expenditure Per Capita", unit: "usd", riskWeight: -1 },
  { code: "WHS7_104", name: "Access to Basic Drinking Water", unit: "percent", riskWeight: -1 },
  { code: "WSH_SANITATION_SAFELY_MANAGED", name: "Safely Managed Sanitation", unit: "percent", riskWeight: -1 },
];

interface GHOResponse {
  value: Array<{
    SpatialDim: string;
    TimeDim: string;
    NumericValue: number | null;
    Value: string;
  }>;
}

async function fetchGHOIndicator(indicatorCode: string, iso3Codes: string[]): Promise<Array<{ iso3: string; value: number; year: string }>> {
  const filter = iso3Codes.map(c => `SpatialDim eq '${c}'`).join(" or ");
  const url = `${GHO_API}/${indicatorCode}?$filter=(${filter})&$orderby=TimeDim desc`;
  try {
    const data = await fetchJson<GHOResponse>(url, { timeoutMs: 20000 });
    if (!data?.value) return [];

    const latestByCountry: Record<string, { value: number; year: string }> = {};
    for (const row of data.value) {
      if (row.NumericValue === null) continue;
      if (!latestByCountry[row.SpatialDim] || row.TimeDim > latestByCountry[row.SpatialDim].year) {
        latestByCountry[row.SpatialDim] = { value: row.NumericValue, year: row.TimeDim };
      }
    }

    return Object.entries(latestByCountry).map(([iso3, d]) => ({ iso3, ...d }));
  } catch (err) {
    log.warn(PIPELINE_NAME, `Failed to fetch GHO indicator ${indicatorCode}`, { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

function computeHealthVulnerabilityScore(indicators: Record<string, number>): number {
  let score = 50;
  let factors = 0;

  const lifeExp = indicators["Life Expectancy at Birth"];
  if (lifeExp !== undefined) {
    score += lifeExp < 65 ? 20 : lifeExp < 70 ? 10 : lifeExp < 75 ? 0 : -10;
    factors++;
  }

  const u5mortality = indicators["Under-5 Mortality Rate"];
  if (u5mortality !== undefined) {
    score += u5mortality > 30 ? 20 : u5mortality > 15 ? 10 : u5mortality > 8 ? 5 : 0;
    factors++;
  }

  const physicians = indicators["Physician Density"];
  if (physicians !== undefined) {
    score += physicians < 5 ? 15 : physicians < 10 ? 5 : -5;
    factors++;
  }

  const beds = indicators["Hospital Bed Density"];
  if (beds !== undefined) {
    score += beds < 10 ? 15 : beds < 20 ? 5 : -5;
    factors++;
  }

  if (factors === 0) return 50;
  return roundTo(clamp(score, 0, 100));
}

export const whoGhoAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting WHO Global Health Observatory ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];

    try {
      const iso3Codes = Object.values(CARIBBEAN_COUNTRIES).map(c => c.iso3);
      const iso3ToCountry: Record<string, string> = {};
      for (const [name, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        iso3ToCountry[meta.iso3] = name;
      }

      const allData: Record<string, Record<string, number>> = {};

      for (const indicator of HEALTH_INDICATORS) {
        log.info(PIPELINE_NAME, `Fetching ${indicator.name}...`);
        const results = await fetchGHOIndicator(indicator.code, iso3Codes);
        recordsRead += results.length;

        for (const r of results) {
          const country = iso3ToCountry[r.iso3];
          if (!country) continue;
          if (!allData[country]) allData[country] = {};
          allData[country][indicator.name] = r.value;
        }
      }

      for (const [country, indicators] of Object.entries(allData)) {
        const rows: Array<{ country: string; region: string; datasetType: string; value: number; unit: string; timestamp: Date }> = [];

        for (const ind of HEALTH_INDICATORS) {
          const val = indicators[ind.name];
          if (val !== undefined) {
            rows.push({
              country, region: "Caribbean", datasetType: ind.name, value: roundTo(val, 2), unit: ind.unit, timestamp: new Date(),
            });
          }
        }

        const vulnScore = computeHealthVulnerabilityScore(indicators);
        rows.push({ country, region: "Caribbean", datasetType: "Health Vulnerability Score", value: vulnScore, unit: "score", timestamp: new Date() });

        if (rows.length > 0) {
          await db.insert(regionalDataTable).values(rows);
          recordsWritten += rows.length;
          countriesAffected.push(country);
        }
      }

      const confidence = recordsRead > 30 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : recordsRead > 10 ? CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL : CONFIDENCE_THRESHOLDS.PROXY;
      const status = recordsRead > 10 ? "success" : recordsRead > 0 ? "partial" : "failed";

      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status, confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status, startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points from ${HEALTH_INDICATORS.length} indicators`);
      return { pipelineName: PIPELINE_NAME, status, recordsRead, recordsWritten, countriesAffected, confidence, summary: { indicators: HEALTH_INDICATORS.length } };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "failed", confidence: 0, recordsLoaded: 0, errorMessage: error });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "failed", startedAt, completedAt: new Date(),
        recordsRead: 0, recordsWritten: 0, errorJson: JSON.stringify({ message: error }),
      });
      return { pipelineName: PIPELINE_NAME, status: "failed", recordsRead: 0, recordsWritten: 0, countriesAffected: [], confidence: 0, summary: {}, error };
    }
  },
};
