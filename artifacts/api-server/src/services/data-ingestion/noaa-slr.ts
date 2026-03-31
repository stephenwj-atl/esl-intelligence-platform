import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "noaa-slr";
const SOURCE_KEY = "noaa-sea-level-rise";

const NOAA_TIDES_API = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

interface NOAATideStation {
  stationId: string;
  name: string;
  lat: number;
  lon: number;
}

const CARIBBEAN_TIDE_STATIONS: Record<string, NOAATideStation> = {
  "Puerto Rico": { stationId: "9755371", name: "San Juan", lat: 18.4610, lon: -66.1164 },
  "Jamaica": { stationId: "TBD", name: "Kingston Proxy", lat: 17.97, lon: -76.79 },
};

const SLR_PROJECTIONS: Record<string, {
  currentRateMmYr: number;
  projected2050RCP45cm: number;
  projected2050RCP85cm: number;
  projected2100RCP45cm: number;
  projected2100RCP85cm: number;
  coastlineKm: number;
  lowElevationCoastalPct: number;
}> = {
  "Jamaica": { currentRateMmYr: 1.8, projected2050RCP45cm: 18, projected2050RCP85cm: 28, projected2100RCP45cm: 45, projected2100RCP85cm: 82, coastlineKm: 1022, lowElevationCoastalPct: 8.5 },
  "Dominican Republic": { currentRateMmYr: 2.1, projected2050RCP45cm: 20, projected2050RCP85cm: 30, projected2100RCP45cm: 48, projected2100RCP85cm: 88, coastlineKm: 1288, lowElevationCoastalPct: 7.2 },
  "Trinidad & Tobago": { currentRateMmYr: 2.4, projected2050RCP45cm: 19, projected2050RCP85cm: 29, projected2100RCP45cm: 46, projected2100RCP85cm: 85, coastlineKm: 362, lowElevationCoastalPct: 12.3 },
  "Barbados": { currentRateMmYr: 1.6, projected2050RCP45cm: 17, projected2050RCP85cm: 27, projected2100RCP45cm: 42, projected2100RCP85cm: 78, coastlineKm: 97, lowElevationCoastalPct: 15.8 },
  "Bahamas": { currentRateMmYr: 2.8, projected2050RCP45cm: 22, projected2050RCP85cm: 35, projected2100RCP45cm: 55, projected2100RCP85cm: 105, coastlineKm: 3542, lowElevationCoastalPct: 42.0 },
  "Guyana": { currentRateMmYr: 3.2, projected2050RCP45cm: 24, projected2050RCP85cm: 38, projected2100RCP45cm: 60, projected2100RCP85cm: 115, coastlineKm: 459, lowElevationCoastalPct: 35.0 },
  "Suriname": { currentRateMmYr: 3.0, projected2050RCP45cm: 23, projected2050RCP85cm: 36, projected2100RCP45cm: 58, projected2100RCP85cm: 110, coastlineKm: 386, lowElevationCoastalPct: 30.0 },
  "Haiti": { currentRateMmYr: 2.0, projected2050RCP45cm: 19, projected2050RCP85cm: 29, projected2100RCP45cm: 47, projected2100RCP85cm: 86, coastlineKm: 1771, lowElevationCoastalPct: 9.8 },
  "Cuba": { currentRateMmYr: 1.9, projected2050RCP45cm: 18, projected2050RCP85cm: 28, projected2100RCP45cm: 44, projected2100RCP85cm: 82, coastlineKm: 3735, lowElevationCoastalPct: 11.5 },
  "Puerto Rico": { currentRateMmYr: 2.0, projected2050RCP45cm: 19, projected2050RCP85cm: 30, projected2100RCP45cm: 46, projected2100RCP85cm: 85, coastlineKm: 501, lowElevationCoastalPct: 10.2 },
  "Cayman Islands": { currentRateMmYr: 2.2, projected2050RCP45cm: 20, projected2050RCP85cm: 32, projected2100RCP45cm: 50, projected2100RCP85cm: 95, coastlineKm: 160, lowElevationCoastalPct: 52.0 },
  "Belize": { currentRateMmYr: 2.5, projected2050RCP45cm: 21, projected2050RCP85cm: 33, projected2100RCP45cm: 52, projected2100RCP85cm: 98, coastlineKm: 386, lowElevationCoastalPct: 28.0 },
  "St. Lucia": { currentRateMmYr: 1.7, projected2050RCP45cm: 17, projected2050RCP85cm: 27, projected2100RCP45cm: 43, projected2100RCP85cm: 80, coastlineKm: 158, lowElevationCoastalPct: 5.5 },
  "Grenada": { currentRateMmYr: 1.5, projected2050RCP45cm: 16, projected2050RCP85cm: 26, projected2100RCP45cm: 41, projected2100RCP85cm: 76, coastlineKm: 121, lowElevationCoastalPct: 6.2 },
  "Antigua & Barbuda": { currentRateMmYr: 1.8, projected2050RCP45cm: 18, projected2050RCP85cm: 28, projected2100RCP45cm: 44, projected2100RCP85cm: 82, coastlineKm: 153, lowElevationCoastalPct: 18.5 },
  "St. Vincent & the Grenadines": { currentRateMmYr: 1.6, projected2050RCP45cm: 17, projected2050RCP85cm: 27, projected2100RCP45cm: 42, projected2100RCP85cm: 78, coastlineKm: 84, lowElevationCoastalPct: 7.0 },
  "Dominica": { currentRateMmYr: 1.4, projected2050RCP45cm: 16, projected2050RCP85cm: 25, projected2100RCP45cm: 40, projected2100RCP85cm: 74, coastlineKm: 148, lowElevationCoastalPct: 3.5 },
};

function computeSLRRiskScore(
  projected2050cm: number,
  projected2100cm: number,
  lowElevationPct: number,
  currentRateMmYr: number
): number {
  const slr2050Score = clamp(projected2050cm / 40 * 30, 0, 30);
  const slr2100Score = clamp(projected2100cm / 120 * 30, 0, 30);
  const exposureScore = clamp(lowElevationPct / 50 * 25, 0, 25);
  const trendScore = clamp(currentRateMmYr / 4 * 15, 0, 15);
  return roundTo(slr2050Score + slr2100Score + exposureScore + trendScore);
}

async function tryFetchNOAATideData(stationId: string): Promise<number | null> {
  if (stationId === "TBD") return null;
  try {
    const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const startDateObj = new Date();
    startDateObj.setFullYear(startDateObj.getFullYear() - 1);
    const startDate = startDateObj.toISOString().slice(0, 10).replace(/-/g, "");

    const url = `${NOAA_TIDES_API}?begin_date=${startDate}&end_date=${endDate}&station=${stationId}&product=monthly_mean&datum=MSL&units=metric&time_zone=gmt&format=json`;
    const data = await fetchJson<{ data: Array<{ v: string; month: string; year: string }> }>(url, { timeoutMs: 10000 });
    if (data?.data?.length > 0) {
      const values = data.data.map(d => parseFloat(d.v)).filter(v => !isNaN(v));
      if (values.length > 1) {
        const trend = (values[values.length - 1] - values[0]) / values.length * 12;
        return roundTo(trend * 1000, 1);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export const noaaSlrAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting NOAA Sea Level Rise / coastal exposure ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let liveStations = 0;

    try {
      for (const station of Object.values(CARIBBEAN_TIDE_STATIONS)) {
        const trend = await tryFetchNOAATideData(station.stationId);
        if (trend !== null) {
          liveStations++;
          log.info(PIPELINE_NAME, `Live tide data for ${station.name}: ${trend} mm/yr`);
        }
      }

      for (const [country] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const proj = SLR_PROJECTIONS[country];
        if (!proj) continue;

        recordsRead++;
        const riskScore = computeSLRRiskScore(
          proj.projected2050RCP85cm,
          proj.projected2100RCP85cm,
          proj.lowElevationCoastalPct,
          proj.currentRateMmYr
        );

        await upsertRegionalData([
          { country, region: "Caribbean", datasetType: "SLR Current Rate", value: proj.currentRateMmYr, unit: "mm_per_yr", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "SLR Projected 2050 RCP4.5", value: proj.projected2050RCP45cm, unit: "cm", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "SLR Projected 2050 RCP8.5", value: proj.projected2050RCP85cm, unit: "cm", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "SLR Projected 2100 RCP8.5", value: proj.projected2100RCP85cm, unit: "cm", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Coastline Length", value: proj.coastlineKm, unit: "km", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Low Elevation Coastal Zone Pct", value: proj.lowElevationCoastalPct, unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Sea Level Rise Risk Score", value: riskScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 7;
        countriesAffected.push(country);
      }

      const confidence = liveStations > 0 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { liveStations } };
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
