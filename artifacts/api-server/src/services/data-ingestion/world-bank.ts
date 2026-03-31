import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "world-bank";
const SOURCE_KEY = "world-bank-indicators";

const WB_API = "https://api.worldbank.org/v2";

const INDICATORS = [
  { code: "NY.GDP.PCAP.CD", name: "GDP Per Capita", unit: "usd" },
  { code: "SP.POP.TOTL", name: "Total Population (WB)", unit: "count" },
  { code: "EG.ELC.ACCS.ZS", name: "Electricity Access", unit: "percent" },
  { code: "SH.STA.BASS.ZS", name: "Basic Sanitation Access", unit: "percent" },
  { code: "SH.H2O.BASW.ZS", name: "Basic Water Access", unit: "percent" },
  { code: "EN.ATM.CO2E.PC", name: "CO2 Emissions Per Capita", unit: "metric_tons" },
  { code: "AG.LND.FRST.ZS", name: "Forest Area Pct", unit: "percent" },
  { code: "SL.UEM.TOTL.ZS", name: "Unemployment Rate", unit: "percent" },
  { code: "SI.POV.NAHC", name: "Poverty Headcount Ratio", unit: "percent" },
  { code: "VC.IHR.PSRC.P5", name: "Intentional Homicides Per 100K", unit: "per_100k" },
];

interface WBAPIResponse {
  0: { page: number; pages: number; total: number };
  1: Array<{
    country: { id: string; value: string };
    indicator: { id: string; value: string };
    date: string;
    value: number | null;
  }> | null;
}

async function fetchIndicator(iso2Codes: string, indicatorCode: string): Promise<Array<{ iso2: string; value: number; year: string }>> {
  const url = `${WB_API}/country/${iso2Codes}/indicator/${indicatorCode}?format=json&per_page=500&date=2018:2025&mrv=1`;
  try {
    const data = await fetchJson<WBAPIResponse>(url, { timeoutMs: 15000 });
    if (!data?.[1]) return [];
    return data[1]
      .filter(d => d.value !== null)
      .map(d => ({ iso2: d.country.id, value: d.value!, year: d.date }));
  } catch (err) {
    log.warn(PIPELINE_NAME, `Failed to fetch indicator ${indicatorCode}`, { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

function computeDevelopmentVulnerabilityScore(
  gdpPerCapita: number | null,
  electricityAccess: number | null,
  waterAccess: number | null,
  sanitationAccess: number | null,
  unemployment: number | null
): number {
  let score = 50;
  let factors = 0;

  if (gdpPerCapita !== null) {
    score += gdpPerCapita < 5000 ? 20 : gdpPerCapita < 10000 ? 10 : gdpPerCapita < 20000 ? 0 : -10;
    factors++;
  }
  if (electricityAccess !== null) {
    score += (100 - electricityAccess) * 0.3;
    factors++;
  }
  if (waterAccess !== null) {
    score += (100 - waterAccess) * 0.3;
    factors++;
  }
  if (sanitationAccess !== null) {
    score += (100 - sanitationAccess) * 0.3;
    factors++;
  }
  if (unemployment !== null) {
    score += unemployment > 15 ? 15 : unemployment > 10 ? 8 : unemployment > 5 ? 3 : 0;
    factors++;
  }

  if (factors === 0) return 50;
  return roundTo(Math.max(0, Math.min(100, score)));
}

export const worldBankAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting World Bank development indicators ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];

    try {
      const iso2Codes = Object.values(CARIBBEAN_COUNTRIES).map(c => c.iso2).join(";");
      const iso2ToCountry: Record<string, string> = {};
      for (const [name, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        iso2ToCountry[meta.iso2] = name;
      }

      const allData: Record<string, Record<string, number>> = {};

      for (const indicator of INDICATORS) {
        log.info(PIPELINE_NAME, `Fetching ${indicator.name}...`);
        const results = await fetchIndicator(iso2Codes, indicator.code);
        recordsRead += results.length;

        for (const r of results) {
          const country = iso2ToCountry[r.iso2];
          if (!country) continue;
          if (!allData[country]) allData[country] = {};
          allData[country][indicator.name] = r.value;
        }
      }

      for (const [country, indicators] of Object.entries(allData)) {
        const rows: Array<{ country: string; region: string; datasetType: string; value: number; unit: string; timestamp: Date }> = [];

        for (const ind of INDICATORS) {
          const val = indicators[ind.name];
          if (val !== undefined) {
            rows.push({
              country, region: "Caribbean", datasetType: ind.name, value: roundTo(val, 2), unit: ind.unit, timestamp: new Date(),
            });
          }
        }

        const vulnScore = computeDevelopmentVulnerabilityScore(
          indicators["GDP Per Capita"] ?? null,
          indicators["Electricity Access"] ?? null,
          indicators["Basic Water Access"] ?? null,
          indicators["Basic Sanitation Access"] ?? null,
          indicators["Unemployment Rate"] ?? null,
        );
        rows.push({ country, region: "Caribbean", datasetType: "Development Vulnerability Score", value: vulnScore, unit: "score", timestamp: new Date() });

        if (rows.length > 0) {
          await upsertRegionalData(rows);
          recordsWritten += rows.length;
          countriesAffected.push(country);
        }
      }

      const confidence = recordsRead > 50 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      const status = recordsRead > 20 ? "success" : recordsRead > 0 ? "partial" : "failed";

      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status, confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status, startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points from ${INDICATORS.length} indicators`);
      return { pipelineName: PIPELINE_NAME, status, recordsRead, recordsWritten, countriesAffected, confidence, summary: { indicators: INDICATORS.length } };
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
