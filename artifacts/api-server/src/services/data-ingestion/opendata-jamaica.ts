import { db, rawDataCacheTable, dataSourceFreshnessTable, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchText } from "./utils/fetchWithRetry";
import { clamp, roundTo, hashString, parseFloatSafe } from "./utils/normalize";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult, HealthFacility } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "opendata-jamaica";
const SOURCE_KEY = "jamaica-opendata";

const DATA_SOURCES = {
  healthCentres: {
    url: "https://data.gov.jm/sites/default/files/healthcentreslatlong_1.csv",
    type: "Health Centre",
  },
  hospitals: {
    url: "https://data.gov.jm/sites/default/files/hospitals.csv",
    type: "Hospital",
  },
  publicHealthFacilities: {
    url: "https://data.gov.jm/sites/default/files/Public-Health-Centres-adn-Hospitals.csv",
    type: "Public Health Facility",
  },
};

const JAMAICA_PARISHES = [
  "Kingston", "St. Andrew", "St. Catherine", "Clarendon", "Manchester",
  "St. Elizabeth", "Westmoreland", "Hanover", "St. James", "Trelawny",
  "St. Ann", "St. Mary", "Portland", "St. Thomas",
];

const JAMAICA_AREA_KM2 = 10991;

function parseCSVToFacilities(csvText: string, facilityType: string): HealthFacility[] {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());

  const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("facility") || h.includes("health"));
  const latIdx = headers.findIndex(h => h.includes("lat") || h === "y" || h.includes("latitude"));
  const lngIdx = headers.findIndex(h => h.includes("lon") || h.includes("lng") || h === "x" || h.includes("longitude"));
  const parishIdx = headers.findIndex(h => h.includes("parish") || h.includes("district"));

  if (latIdx < 0 || lngIdx < 0) {
    log.warn(PIPELINE_NAME, `No lat/lng columns found for ${facilityType}`, { headers });
    return [];
  }

  const facilities: HealthFacility[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length <= Math.max(latIdx, lngIdx)) continue;

    const lat = parseFloatSafe(fields[latIdx]);
    const lng = parseFloatSafe(fields[lngIdx]);

    if (lat === null || lng === null) continue;
    if (lat < 17 || lat > 19 || lng < -79 || lng > -76) continue;

    facilities.push({
      name: nameIdx >= 0 ? fields[nameIdx]?.replace(/"/g, "").trim() : `${facilityType} ${i}`,
      type: facilityType,
      lat,
      lng,
      parish: parishIdx >= 0 ? fields[parishIdx]?.replace(/"/g, "").trim() : undefined,
    });
  }

  return facilities;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function computeReceptorMetrics(facilities: HealthFacility[]) {
  const totalFacilities = facilities.length;
  const hospitals = facilities.filter(f => f.type === "Hospital").length;
  const healthCentres = facilities.filter(f => f.type !== "Hospital").length;
  const facilitiesPerKm2 = totalFacilities / JAMAICA_AREA_KM2;
  const densityScore = clamp(facilitiesPerKm2 * 10000, 0, 100);

  const parishCounts: Record<string, number> = {};
  for (const f of facilities) {
    if (f.parish) {
      parishCounts[f.parish] = (parishCounts[f.parish] || 0) + 1;
    }
  }

  const parishValues = Object.values(parishCounts);
  const avgPerParish = parishValues.length > 0
    ? parishValues.reduce((a, b) => a + b, 0) / parishValues.length
    : 0;

  const coverageUniformity = parishValues.length > 0
    ? 1 - (Math.max(...parishValues) - Math.min(...parishValues)) / (Math.max(...parishValues) || 1)
    : 0;

  return {
    totalFacilities,
    hospitals,
    healthCentres,
    facilitiesPerKm2: roundTo(facilitiesPerKm2, 4),
    densityScore: roundTo(densityScore),
    avgPerParish: roundTo(avgPerParish),
    coverageUniformity: roundTo(coverageUniformity * 100),
    parishCoverage: parishCounts,
  };
}

export const opendataJamaicaAdapter: SourceAdapter = {
  name: "Jamaica Open Data - Health Facilities",
  sourceKey: SOURCE_KEY,

  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting Jamaica open-data health facility ingestion");

    const [run] = await db.insert(ingestionRunsTable).values({
      pipelineName: PIPELINE_NAME,
      status: "running",
    }).returning();

    let recordsRead = 0;
    let recordsWritten = 0;
    const allFacilities: HealthFacility[] = [];
    const sourceResults: Record<string, { count: number; status: string }> = {};

    try {
      for (const [key, source] of Object.entries(DATA_SOURCES)) {
        try {
          log.info(PIPELINE_NAME, `Downloading ${source.type} data from ${source.url}`);
          const csvText = await fetchText(source.url, { timeoutMs: 30000, maxRetries: 2 });

          const facilities = parseCSVToFacilities(csvText, source.type);
          recordsRead += facilities.length;
          allFacilities.push(...facilities);
          sourceResults[key] = { count: facilities.length, status: "success" };

          await db.insert(rawDataCacheTable).values({
            sourceKey: `${SOURCE_KEY}-${key}`,
            sourceUrl: source.url,
            responseHash: hashString(csvText),
            payloadJson: JSON.stringify({ recordCount: facilities.length, sampleRecord: facilities[0] }),
            statusCode: 200,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: `${source.type}: ${facilities.length} facilities parsed`,
          });

          log.info(PIPELINE_NAME, `Parsed ${facilities.length} ${source.type} facilities`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          log.warn(PIPELINE_NAME, `Failed to fetch ${source.type}: ${errMsg}`);
          sourceResults[key] = { count: 0, status: "failed" };
        }
      }

      if (allFacilities.length === 0) {
        throw new Error("No health facility data could be loaded from any source");
      }

      const uniqueFacilities = deduplicateFacilities(allFacilities);
      const metrics = computeReceptorMetrics(uniqueFacilities);

      await db.insert(regionalDataTable).values({
        country: "Jamaica",
        region: "National",
        datasetType: "Health Facility Density",
        value: metrics.densityScore,
        unit: "score",
        timestamp: new Date(),
      });
      recordsWritten++;

      await db.insert(regionalDataTable).values({
        country: "Jamaica",
        region: "National",
        datasetType: "Health Facility Count",
        value: metrics.totalFacilities,
        unit: "count",
        timestamp: new Date(),
      });
      recordsWritten++;

      await db.insert(regionalDataTable).values({
        country: "Jamaica",
        region: "National",
        datasetType: "Hospital Count",
        value: metrics.hospitals,
        unit: "count",
        timestamp: new Date(),
      });
      recordsWritten++;

      for (const [parish, count] of Object.entries(metrics.parishCoverage)) {
        await db.insert(regionalDataTable).values({
          country: "Jamaica",
          region: parish,
          datasetType: "Health Facility Count",
          value: count,
          unit: "count",
          timestamp: new Date(),
        });
        recordsWritten++;
      }

      const confidence = CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION;

      await db.insert(dataSourceFreshnessTable).values({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        lastSuccessAt: new Date(),
        lastAttemptAt: new Date(),
        status: "success",
        confidence,
        recordsLoaded: recordsWritten,
        metadataJson: JSON.stringify({
          totalFacilities: metrics.totalFacilities,
          hospitals: metrics.hospitals,
          healthCentres: metrics.healthCentres,
          sourcesLoaded: Object.entries(sourceResults).filter(([, v]) => v.status === "success").length,
          sourcesFailed: Object.entries(sourceResults).filter(([, v]) => v.status === "failed").length,
        }),
      }).onConflictDoUpdate({
        target: dataSourceFreshnessTable.sourceKey,
        set: {
          lastSuccessAt: new Date(),
          lastAttemptAt: new Date(),
          status: "success",
          confidence,
          recordsLoaded: recordsWritten,
          metadataJson: JSON.stringify({
            totalFacilities: metrics.totalFacilities,
            hospitals: metrics.hospitals,
            healthCentres: metrics.healthCentres,
          }),
        },
      });

      await db.update(ingestionRunsTable)
        .set({
          status: "success",
          completedAt: new Date(),
          recordsRead,
          recordsWritten,
          countriesAffected: "Jamaica",
          summaryJson: JSON.stringify(metrics),
        })
        .where(eq(ingestionRunsTable.id, run.id));

      log.success(PIPELINE_NAME, `Completed: ${metrics.totalFacilities} facilities, ${recordsWritten} data points`, {
        hospitals: metrics.hospitals,
        healthCentres: metrics.healthCentres,
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected: ["Jamaica"],
        confidence,
        summary: metrics,
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);

      await db.update(ingestionRunsTable)
        .set({ status: "failed", completedAt: new Date(), errorJson: JSON.stringify({ message: errorMsg }) })
        .where(eq(ingestionRunsTable.id, run.id));

      await db.insert(dataSourceFreshnessTable).values({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        lastAttemptAt: new Date(),
        status: "failed",
        confidence: 0,
        errorMessage: errorMsg,
      }).onConflictDoUpdate({
        target: dataSourceFreshnessTable.sourceKey,
        set: { lastAttemptAt: new Date(), status: "failed", errorMessage: errorMsg },
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "failed",
        recordsRead,
        recordsWritten,
        countriesAffected: ["Jamaica"],
        confidence: 0,
        summary: {},
        error: errorMsg,
      };
    }
  },
};

function deduplicateFacilities(facilities: HealthFacility[]): HealthFacility[] {
  const seen = new Set<string>();
  return facilities.filter(f => {
    const key = `${f.lat.toFixed(4)}_${f.lng.toFixed(4)}_${f.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
