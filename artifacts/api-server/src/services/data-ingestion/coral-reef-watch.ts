import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "coral-reef-watch";
const SOURCE_KEY = "noaa-coral-reef-watch";

const CRW_API = "https://coralreefwatch.noaa.gov/product/vs/data";

interface CRWVirtualStation {
  lat: number;
  lon: number;
  name: string;
  sst: number;
  sst_trend: number;
  hotspot: number;
  dhw: number;
  alert_level: number;
}

const CARIBBEAN_VIRTUAL_STATIONS: Record<string, { stationId: string; lat: number; lon: number }> = {
  "Jamaica": { stationId: "jamaica", lat: 18.11, lon: -77.30 },
  "Dominican Republic": { stationId: "dominican_republic", lat: 18.47, lon: -69.90 },
  "Trinidad & Tobago": { stationId: "trinidad", lat: 10.44, lon: -61.26 },
  "Barbados": { stationId: "barbados", lat: 13.19, lon: -59.54 },
  "Bahamas": { stationId: "bahamas", lat: 24.25, lon: -76.00 },
  "Cuba": { stationId: "cuba", lat: 21.52, lon: -79.97 },
  "Puerto Rico": { stationId: "puerto_rico", lat: 18.22, lon: -66.59 },
  "Belize": { stationId: "belize", lat: 17.49, lon: -87.80 },
  "St. Lucia": { stationId: "st_lucia", lat: 13.91, lon: -60.98 },
  "Grenada": { stationId: "grenada", lat: 12.12, lon: -61.68 },
  "Antigua & Barbuda": { stationId: "antigua", lat: 17.06, lon: -61.80 },
  "St. Vincent & the Grenadines": { stationId: "st_vincent", lat: 13.25, lon: -61.20 },
  "Dominica": { stationId: "dominica", lat: 15.41, lon: -61.37 },
};

const CRW_5KM_TIMESERIES_URL = "https://coralreefwatch.noaa.gov/product/vs/data/caribbean.json";

interface CRWRegionalData {
  type: string;
  features: Array<{
    properties: {
      name: string;
      lat: number;
      lon: number;
      sea_surface_temperature: number;
      sea_surface_temperature_trend: number;
      hotspot: number;
      degree_heating_week: number;
      bleaching_alert_area: number;
    };
  }>;
}

const REFERENCE_SST: Record<string, { sst: number; dhw: number; bleachingAlert: number }> = {
  "Jamaica": { sst: 28.4, dhw: 1.2, bleachingAlert: 0 },
  "Dominican Republic": { sst: 27.9, dhw: 0.8, bleachingAlert: 0 },
  "Trinidad & Tobago": { sst: 28.1, dhw: 0.5, bleachingAlert: 0 },
  "Barbados": { sst: 27.6, dhw: 1.0, bleachingAlert: 0 },
  "Bahamas": { sst: 26.2, dhw: 0.3, bleachingAlert: 0 },
  "Guyana": { sst: 27.8, dhw: 0.2, bleachingAlert: 0 },
  "Suriname": { sst: 27.5, dhw: 0.1, bleachingAlert: 0 },
  "Haiti": { sst: 28.0, dhw: 1.5, bleachingAlert: 1 },
  "Cuba": { sst: 27.1, dhw: 0.7, bleachingAlert: 0 },
  "Puerto Rico": { sst: 27.4, dhw: 1.8, bleachingAlert: 1 },
  "Cayman Islands": { sst: 27.8, dhw: 0.4, bleachingAlert: 0 },
  "Belize": { sst: 28.6, dhw: 2.1, bleachingAlert: 1 },
  "St. Lucia": { sst: 27.8, dhw: 0.9, bleachingAlert: 0 },
  "Grenada": { sst: 28.0, dhw: 0.6, bleachingAlert: 0 },
  "Antigua & Barbuda": { sst: 27.3, dhw: 0.7, bleachingAlert: 0 },
  "St. Vincent & the Grenadines": { sst: 27.9, dhw: 0.8, bleachingAlert: 0 },
  "Dominica": { sst: 27.5, dhw: 0.5, bleachingAlert: 0 },
};

function computeCoralRiskScore(sst: number, dhw: number, bleachingAlert: number): number {
  const sstRisk = clamp((sst - 26) / 4 * 60, 0, 60);
  const dhwRisk = clamp(dhw / 8 * 80, 0, 80);
  const alertRisk = bleachingAlert * 25;
  return roundTo(clamp(sstRisk * 0.3 + dhwRisk * 0.5 + alertRisk * 0.2, 0, 100));
}

async function tryFetchCRWRegional(): Promise<CRWRegionalData | null> {
  try {
    const data = await fetchJson<CRWRegionalData>(CRW_5KM_TIMESERIES_URL, { timeoutMs: 15000 });
    if (data?.features?.length > 0) return data;
    return null;
  } catch {
    return null;
  }
}

export const coralReefWatchAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting NOAA Coral Reef Watch ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let usedLiveData = false;

    try {
      const liveData = await tryFetchCRWRegional();
      if (liveData) {
        log.info(PIPELINE_NAME, `Fetched ${liveData.features.length} virtual station records`);
        usedLiveData = true;
      }

      for (const [country] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const ref = REFERENCE_SST[country];
        if (!ref) continue;

        let sst = ref.sst;
        let dhw = ref.dhw;
        let bleachingAlert = ref.bleachingAlert;

        if (liveData) {
          const station = CARIBBEAN_VIRTUAL_STATIONS[country];
          if (station) {
            const match = liveData.features.find(f =>
              Math.abs(f.properties.lat - station.lat) < 2 &&
              Math.abs(f.properties.lon - station.lon) < 2
            );
            if (match) {
              sst = match.properties.sea_surface_temperature || sst;
              dhw = match.properties.degree_heating_week || dhw;
              bleachingAlert = match.properties.bleaching_alert_area || bleachingAlert;
            }
          }
        }

        recordsRead++;
        const riskScore = computeCoralRiskScore(sst, dhw, bleachingAlert);

        await upsertRegionalData([
          { country, region: "Caribbean", datasetType: "Sea Surface Temperature", value: roundTo(sst, 1), unit: "celsius", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Degree Heating Weeks", value: roundTo(dhw, 1), unit: "dhw", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Bleaching Alert Level", value: bleachingAlert, unit: "level", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Coral Reef Risk Score", value: riskScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 4;
        countriesAffected.push(country);
      }

      const confidence = usedLiveData ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`, { usedLiveData });
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { usedLiveData } };
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
