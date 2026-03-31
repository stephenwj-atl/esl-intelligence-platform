import { db, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "usgs-earthquake";
const SOURCE_KEY = "usgs-earthquake-hazards";

const USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query";

const CARIBBEAN_BBOX = {
  minLat: 8.0,
  maxLat: 28.0,
  minLon: -90.0,
  maxLon: -55.0,
};

interface USGSResponse {
  type: string;
  metadata: { generated: number; count: number; title: string };
  features: Array<{
    properties: {
      mag: number;
      place: string;
      time: number;
      type: string;
    };
    geometry: {
      coordinates: [number, number, number];
    };
  }>;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCountryCentroid(country: string): { lat: number; lon: number } | null {
  const meta = CARIBBEAN_COUNTRIES[country];
  if (!meta) return null;
  const [minLat, minLon, maxLat, maxLon] = meta.bbox;
  return { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
}

function computeSeismicRisk(nearbyQuakes: Array<{ mag: number; distKm: number; ageYears: number }>): {
  score: number;
  maxMagnitude: number;
  totalEvents: number;
  significantEvents: number;
} {
  let score = 10;
  let maxMagnitude = 0;
  let significantEvents = 0;

  for (const q of nearbyQuakes) {
    if (q.mag > maxMagnitude) maxMagnitude = q.mag;
    if (q.mag >= 5.0) significantEvents++;

    const magFactor = Math.pow(q.mag / 4, 2);
    const distFactor = Math.max(0, 1 - q.distKm / 500);
    const recencyFactor = Math.max(0.2, 1 - q.ageYears / 30);
    score += magFactor * distFactor * recencyFactor * 15;
  }

  return {
    score: roundTo(clamp(score, 0, 100)),
    maxMagnitude: roundTo(maxMagnitude, 1),
    totalEvents: nearbyQuakes.length,
    significantEvents,
  };
}

export const usgsEarthquakeAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting USGS earthquake hazard ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];

    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDateObj = new Date();
      startDateObj.setFullYear(startDateObj.getFullYear() - 20);
      const startDate = startDateObj.toISOString().split("T")[0];

      const url = `${USGS_API}?format=geojson&starttime=${startDate}&endtime=${endDate}&minlatitude=${CARIBBEAN_BBOX.minLat}&maxlatitude=${CARIBBEAN_BBOX.maxLat}&minlongitude=${CARIBBEAN_BBOX.minLon}&maxlongitude=${CARIBBEAN_BBOX.maxLon}&minmagnitude=3.0&orderby=magnitude&limit=2000`;

      log.info(PIPELINE_NAME, "Fetching USGS earthquake data (20-year window, M3.0+)...");
      const data = await fetchJson<USGSResponse>(url, { timeoutMs: 30000 });

      if (!data?.features) {
        throw new Error("No earthquake data returned from USGS API");
      }

      log.info(PIPELINE_NAME, `Fetched ${data.features.length} earthquake events`);
      recordsRead = data.features.length;

      const now = Date.now();

      for (const [country] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const centroid = getCountryCentroid(country);
        if (!centroid) continue;

        const PROXIMITY_KM = 500;
        const nearbyQuakes = data.features
          .filter(f => {
            const [lon, lat] = f.geometry.coordinates;
            return haversineDistance(centroid.lat, centroid.lon, lat, lon) <= PROXIMITY_KM;
          })
          .map(f => {
            const [lon, lat] = f.geometry.coordinates;
            return {
              mag: f.properties.mag,
              distKm: haversineDistance(centroid.lat, centroid.lon, lat, lon),
              ageYears: (now - f.properties.time) / (365.25 * 24 * 3600 * 1000),
            };
          });

        const risk = computeSeismicRisk(nearbyQuakes);

        await db.insert(regionalDataTable).values([
          { country, region: "Caribbean", datasetType: "Seismic Risk Score", value: risk.score, unit: "score", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Max Earthquake Magnitude", value: risk.maxMagnitude, unit: "magnitude", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Significant Seismic Events (20yr)", value: risk.significantEvents, unit: "count", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Total Seismic Events (20yr)", value: risk.totalEvents, unit: "count", timestamp: new Date() },
        ]);

        recordsWritten += 4;
        countriesAffected.push(country);
      }

      const confidence = CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${data.features.length} events, ${countriesAffected.length} countries scored`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { totalEvents: data.features.length } };
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
