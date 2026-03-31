import { db, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "soilgrids";
const SOURCE_KEY = "isric-soilgrids";

const SOILGRIDS_API = "https://rest.isric.org/soilgrids/v2.0/properties/query";

interface SoilGridsResponse {
  properties: {
    layers: Array<{
      name: string;
      depths: Array<{
        label: string;
        range: { top_depth: number; bottom_depth: number };
        values: Record<string, number>;
      }>;
    }>;
  };
}

const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  "Jamaica": { lat: 18.11, lon: -77.30 },
  "Dominican Republic": { lat: 18.74, lon: -70.16 },
  "Trinidad & Tobago": { lat: 10.44, lon: -61.26 },
  "Barbados": { lat: 13.19, lon: -59.54 },
  "Bahamas": { lat: 25.03, lon: -77.40 },
  "Guyana": { lat: 4.86, lon: -58.93 },
  "Suriname": { lat: 3.92, lon: -56.03 },
  "Haiti": { lat: 19.07, lon: -72.07 },
  "Cuba": { lat: 21.52, lon: -77.78 },
  "Puerto Rico": { lat: 18.22, lon: -66.59 },
  "Cayman Islands": { lat: 19.31, lon: -81.25 },
  "Belize": { lat: 17.19, lon: -88.50 },
  "St. Lucia": { lat: 13.91, lon: -60.98 },
  "Grenada": { lat: 12.12, lon: -61.68 },
  "Antigua & Barbuda": { lat: 17.06, lon: -61.80 },
  "St. Vincent & the Grenadines": { lat: 13.25, lon: -61.20 },
  "Dominica": { lat: 15.41, lon: -61.37 },
};

const SOIL_PROPERTIES = ["clay", "sand", "soc", "phh2o", "bdod"] as const;

function computeSoilRiskScore(clay: number | null, sand: number | null, ph: number | null): number {
  let score = 50;
  if (clay !== null) {
    if (clay > 60) score += 20;
    else if (clay > 40) score += 10;
    else if (clay < 15) score += 5;
  }
  if (sand !== null) {
    if (sand > 70) score += 15;
    else if (sand < 20) score -= 5;
  }
  if (ph !== null) {
    const phActual = ph / 10;
    if (phActual < 4.5 || phActual > 8.5) score += 15;
    else if (phActual < 5.5 || phActual > 7.5) score += 5;
  }
  return roundTo(clamp(score, 0, 100));
}

async function querySoilGrids(lat: number, lon: number): Promise<Record<string, number | null>> {
  const props = SOIL_PROPERTIES.join(",");
  const url = `${SOILGRIDS_API}?lon=${lon}&lat=${lat}&property=${props}&depth=0-5cm&value=mean`;
  try {
    const data = await fetchJson<SoilGridsResponse>(url, { timeoutMs: 8000, maxRetries: 1 });
    const result: Record<string, number | null> = {};
    for (const layer of data?.properties?.layers || []) {
      const depth = layer.depths?.[0];
      const mean = depth?.values?.mean ?? depth?.values?.["Q0.5"] ?? null;
      result[layer.name] = mean !== undefined ? mean : null;
    }
    return result;
  } catch {
    return {};
  }
}

export const soilgridsAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting SoilGrids soil classification ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let liveQueries = 0;

    try {
      for (const [country, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const centroid = COUNTRY_CENTROIDS[country];
        if (!centroid) continue;

        const soilData = await querySoilGrids(centroid.lat, centroid.lon);
        const hasData = Object.values(soilData).some(v => v !== null);
        if (hasData) liveQueries++;
        recordsRead++;

        const clay = soilData.clay ?? null;
        const sand = soilData.sand ?? null;
        const ph = soilData.phh2o ?? null;
        const soc = soilData.soc ?? null;
        const bdod = soilData.bdod ?? null;

        const riskScore = computeSoilRiskScore(clay, sand, ph);

        const rows: Array<{ country: string; region: string; datasetType: string; value: number; unit: string; timestamp: Date }> = [];
        if (clay !== null) rows.push({ country, region: "Caribbean", datasetType: "Soil Clay Content", value: roundTo(clay / 10), unit: "g/kg", timestamp: new Date() });
        if (sand !== null) rows.push({ country, region: "Caribbean", datasetType: "Soil Sand Content", value: roundTo(sand / 10), unit: "g/kg", timestamp: new Date() });
        if (ph !== null) rows.push({ country, region: "Caribbean", datasetType: "Soil pH", value: roundTo(ph / 10, 1), unit: "pH", timestamp: new Date() });
        if (soc !== null) rows.push({ country, region: "Caribbean", datasetType: "Soil Organic Carbon", value: roundTo(soc / 10), unit: "g/kg", timestamp: new Date() });
        if (bdod !== null) rows.push({ country, region: "Caribbean", datasetType: "Soil Bulk Density", value: roundTo(bdod / 100, 2), unit: "g/cm3", timestamp: new Date() });
        rows.push({ country, region: "Caribbean", datasetType: "Geotechnical Risk Score", value: riskScore, unit: "score", timestamp: new Date() });

        if (rows.length > 0) {
          await db.insert(regionalDataTable).values(rows);
          recordsWritten += rows.length;
        }
        countriesAffected.push(country);
      }

      const confidence = liveQueries > 5 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      const runStatus = liveQueries > 0 ? "success" : "partial";
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: runStatus, confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: runStatus, startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${liveQueries} live API queries`, { recordsWritten });
      return { pipelineName: PIPELINE_NAME, status: runStatus as "success" | "partial", recordsRead, recordsWritten, countriesAffected, confidence, summary: { liveQueries } };
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
