import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "wdpa";
const SOURCE_KEY = "wdpa-protected-planet";

const WDPA_API_BASE = "https://api.protectedplanet.net/v3";
const WDPA_TOKEN = process.env.WDPA_API_TOKEN || "";

interface WDPACountryResponse {
  country: {
    name: string;
    iso_3: string;
    pas_count: number;
    pas_national_count: number;
    pas_international_count: number;
    land_area: number;
    pas_land_area: number;
    pas_land_percentage: number;
    marine_area: number;
    pas_marine_area: number;
    pas_marine_percentage: number;
  };
}

const REFERENCE_DATA: Record<string, { protectedPct: number; marineProtectedPct: number; paCount: number }> = {
  "Jamaica": { protectedPct: 18.7, marineProtectedPct: 15.2, paCount: 173 },
  "Dominican Republic": { protectedPct: 25.8, marineProtectedPct: 32.1, paCount: 123 },
  "Trinidad & Tobago": { protectedPct: 31.1, marineProtectedPct: 5.3, paCount: 61 },
  "Barbados": { protectedPct: 4.9, marineProtectedPct: 0.2, paCount: 8 },
  "Bahamas": { protectedPct: 12.3, marineProtectedPct: 10.1, paCount: 32 },
  "Guyana": { protectedPct: 8.8, marineProtectedPct: 0.1, paCount: 11 },
  "Suriname": { protectedPct: 14.3, marineProtectedPct: 0.0, paCount: 16 },
  "Haiti": { protectedPct: 2.4, marineProtectedPct: 0.1, paCount: 14 },
  "Cuba": { protectedPct: 20.4, marineProtectedPct: 25.4, paCount: 253 },
  "Puerto Rico": { protectedPct: 8.6, marineProtectedPct: 1.0, paCount: 56 },
  "Cayman Islands": { protectedPct: 12.1, marineProtectedPct: 46.0, paCount: 12 },
  "Belize": { protectedPct: 36.9, marineProtectedPct: 12.8, paCount: 103 },
  "St. Lucia": { protectedPct: 16.2, marineProtectedPct: 1.3, paCount: 23 },
  "Grenada": { protectedPct: 3.0, marineProtectedPct: 1.0, paCount: 7 },
  "Antigua & Barbuda": { protectedPct: 10.8, marineProtectedPct: 2.5, paCount: 14 },
  "St. Vincent & the Grenadines": { protectedPct: 13.4, marineProtectedPct: 1.1, paCount: 18 },
  "Dominica": { protectedPct: 22.3, marineProtectedPct: 3.7, paCount: 8 },
};

async function tryFetchWDPA(iso3: string): Promise<WDPACountryResponse | null> {
  if (!WDPA_TOKEN) return null;
  try {
    const data = await fetchJson<WDPACountryResponse>(
      `${WDPA_API_BASE}/countries/${iso3}?token=${WDPA_TOKEN}`,
      { timeoutMs: 15000 }
    );
    return data;
  } catch {
    return null;
  }
}

function computeProtectedAreaRisk(protectedPct: number, marineProtectedPct: number): number {
  const landConflictRisk = clamp(protectedPct * 2.5, 0, 100);
  const marineConflictRisk = clamp(marineProtectedPct * 2.0, 0, 100);
  return roundTo(landConflictRisk * 0.6 + marineConflictRisk * 0.4);
}

async function recordFreshness(recordsLoaded: number, confidence: number, status: string, error?: string) {
  await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status, confidence, recordsLoaded, errorMessage: error });
}

export const wdpaAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting WDPA protected area ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let usedLiveAPI = false;

    try {
      for (const [country, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const liveData = await tryFetchWDPA(meta.iso3);
        let protectedPct: number;
        let marineProtectedPct: number;
        let paCount: number;

        if (liveData?.country) {
          protectedPct = liveData.country.pas_land_percentage;
          marineProtectedPct = liveData.country.pas_marine_percentage;
          paCount = liveData.country.pas_count;
          usedLiveAPI = true;
        } else {
          const ref = REFERENCE_DATA[country];
          if (!ref) continue;
          protectedPct = ref.protectedPct;
          marineProtectedPct = ref.marineProtectedPct;
          paCount = ref.paCount;
        }

        recordsRead++;
        const riskScore = computeProtectedAreaRisk(protectedPct, marineProtectedPct);

        await upsertRegionalData([
          { country, region: "Caribbean", datasetType: "Protected Area Coverage", value: roundTo(protectedPct), unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Marine Protected Area Coverage", value: roundTo(marineProtectedPct), unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Protected Area Conflict Risk", value: riskScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 3;
        countriesAffected.push(country);
      }

      const confidence = usedLiveAPI ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await recordFreshness(recordsRead, confidence, "success");
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { usedLiveAPI } };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);
      await recordFreshness(0, 0, "failed", error);
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "failed", startedAt, completedAt: new Date(),
        recordsRead: 0, recordsWritten: 0, errorJson: JSON.stringify({ message: error }),
      });
      return { pipelineName: PIPELINE_NAME, status: "failed", recordsRead: 0, recordsWritten: 0, countriesAffected: [], confidence: 0, summary: {}, error };
    }
  },
};
