import { db, rawDataCacheTable, dataSourceFreshnessTable, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchText } from "./utils/fetchWithRetry";
import { getCountryForPoint } from "./utils/geo";
import { clamp, roundTo, hashString } from "./utils/normalize";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult, HurricaneExposure } from "./types";
import { HURRICANE_WEIGHTS, CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";

const PIPELINE_NAME = "ibtracs";
const SOURCE_KEY = "noaa-ibtracs";

const IBTRACS_CSV_URL = process.env.IBTRACS_CSV_URL ||
  "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/provisional/csv/ibtracs.NA.list.v04r01.csv";

const YEARS_LOOKBACK = 30;
const PROXIMITY_KM = 250;

const MAX_WIND_REFERENCE_KT = 140;
const MAX_STORMS_PER_DECADE = 8;

interface StormRecord {
  sid: string;
  name: string;
  year: number;
  lat: number;
  lon: number;
  windKt: number;
  category: number;
}

function parseIBTrACSCSV(csvText: string): StormRecord[] {
  const lines = csvText.split("\n");
  if (lines.length < 3) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map(h => h.trim().replace(/"/g, ""));

  const sidIdx = headers.indexOf("SID");
  const nameIdx = headers.indexOf("NAME");
  const isoTimeIdx = headers.indexOf("ISO_TIME");
  const latIdx = headers.indexOf("LAT");
  const lonIdx = headers.indexOf("LON");
  const windIdx = headers.indexOf("USA_WIND");
  const statusIdx = headers.indexOf("USA_STATUS");

  if (sidIdx < 0 || latIdx < 0 || lonIdx < 0) {
    log.warn(PIPELINE_NAME, "Missing required columns in IBTrACS CSV", { headers: headers.slice(0, 15) });
    return [];
  }

  const cutoffYear = new Date().getFullYear() - YEARS_LOOKBACK;
  const records: StormRecord[] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = line.split(",").map(f => f.trim().replace(/"/g, ""));

    const lat = parseFloat(fields[latIdx]);
    const lon = parseFloat(fields[lonIdx]);
    if (isNaN(lat) || isNaN(lon)) continue;

    const isoTime = fields[isoTimeIdx] || "";
    const year = parseInt(isoTime.substring(0, 4));
    if (isNaN(year) || year < cutoffYear) continue;

    if (lat < 8 || lat > 30 || lon < -90 || lon > -55) continue;

    const windStr = fields[windIdx] || "";
    const windKt = parseFloat(windStr);
    const wind = isNaN(windKt) || windKt < 0 ? 0 : windKt;

    let category = 0;
    if (wind >= 137) category = 5;
    else if (wind >= 113) category = 4;
    else if (wind >= 96) category = 3;
    else if (wind >= 83) category = 2;
    else if (wind >= 64) category = 1;

    records.push({
      sid: fields[sidIdx] || `unknown-${i}`,
      name: fields[nameIdx] || "UNNAMED",
      year,
      lat,
      lon,
      windKt: wind,
      category,
    });
  }

  return records;
}

function computeCountryExposure(
  country: string,
  records: StormRecord[]
): HurricaneExposure {
  const countryRecords = records.filter(r => {
    const affected = getCountryForPoint(r.lat, r.lon, PROXIMITY_KM);
    return affected.includes(country);
  });

  const stormIds = new Set(countryRecords.map(r => r.sid));
  const uniqueStorms = Array.from(stormIds);

  const maxWindPerStorm = new Map<string, number>();
  for (const r of countryRecords) {
    const current = maxWindPerStorm.get(r.sid) || 0;
    if (r.windKt > current) maxWindPerStorm.set(r.sid, r.windKt);
  }

  const stormCount = uniqueStorms.length;
  const decades = YEARS_LOOKBACK / 10;
  const stormsPerDecade = stormCount / decades;
  const frequencyScore = clamp((stormsPerDecade / MAX_STORMS_PER_DECADE) * 100, 0, 100);

  const maxWinds = Array.from(maxWindPerStorm.values());
  const avgMaxWind = maxWinds.length > 0
    ? maxWinds.reduce((a, b) => a + b, 0) / maxWinds.length
    : 0;
  const intensityScore = clamp((avgMaxWind / MAX_WIND_REFERENCE_KT) * 100, 0, 100);

  const currentYear = new Date().getFullYear();
  const recentStorms = countryRecords.filter(r => r.year >= currentYear - 10);
  const recentStormIds = new Set(recentStorms.map(r => r.sid));
  const recentRatio = stormCount > 0 ? recentStormIds.size / stormCount : 0;
  const recencyScore = clamp(recentRatio * 100 * 1.5, 0, 100);

  const compositeScore = roundTo(
    frequencyScore * HURRICANE_WEIGHTS.FREQUENCY +
    intensityScore * HURRICANE_WEIGHTS.INTENSITY +
    recencyScore * HURRICANE_WEIGHTS.RECENCY
  );

  return {
    country,
    frequencyScore: roundTo(frequencyScore),
    intensityScore: roundTo(intensityScore),
    recencyScore: roundTo(recencyScore),
    compositeScore,
    stormCount,
    avgMaxWind: roundTo(avgMaxWind),
  };
}

export const ibtracAdapter: SourceAdapter = {
  name: "NOAA IBTrACS Hurricane Tracks",
  sourceKey: SOURCE_KEY,

  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting IBTrACS hurricane exposure ingestion");

    const [run] = await db.insert(ingestionRunsTable).values({
      pipelineName: PIPELINE_NAME,
      status: "running",
    }).returning();

    const countriesAffected: string[] = [];
    let recordsRead = 0;
    let recordsWritten = 0;

    try {
      log.info(PIPELINE_NAME, "Downloading IBTrACS CSV (this may take a moment)...");
      const csvText = await fetchText(IBTRACS_CSV_URL, { timeoutMs: 120000, maxRetries: 2 });
      const csvHash = hashString(csvText.substring(0, 10000));

      log.info(PIPELINE_NAME, `CSV downloaded: ${(csvText.length / 1024 / 1024).toFixed(1)} MB`);

      const records = parseIBTrACSCSV(csvText);
      recordsRead = records.length;
      log.info(PIPELINE_NAME, `Parsed ${records.length} Caribbean storm track points`);

      await db.insert(rawDataCacheTable).values({
        sourceKey: SOURCE_KEY,
        sourceUrl: IBTRACS_CSV_URL,
        responseHash: csvHash,
        payloadJson: JSON.stringify({
          totalRecords: records.length,
          yearRange: [
            Math.min(...records.map(r => r.year)),
            Math.max(...records.map(r => r.year)),
          ],
          stormIds: new Set(records.map(r => r.sid)).size,
        }),
        statusCode: 200,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `IBTrACS NA basin, ${records.length} track points`,
      });

      const exposures: HurricaneExposure[] = [];
      for (const country of Object.keys(CARIBBEAN_COUNTRIES)) {
        const exposure = computeCountryExposure(country, records);
        exposures.push(exposure);
        countriesAffected.push(country);

        await db.insert(regionalDataTable).values({
          country,
          region: "National",
          datasetType: "Hurricane Exposure",
          value: exposure.compositeScore,
          unit: "score",
          timestamp: new Date(),
        });

        await db.insert(regionalDataTable).values({
          country,
          region: "National",
          datasetType: "Hurricane Frequency",
          value: exposure.frequencyScore,
          unit: "score",
          timestamp: new Date(),
        });

        await db.insert(regionalDataTable).values({
          country,
          region: "National",
          datasetType: "Hurricane Intensity",
          value: exposure.intensityScore,
          unit: "score",
          timestamp: new Date(),
        });

        recordsWritten += 3;
      }

      const avgComposite = roundTo(exposures.reduce((s, e) => s + e.compositeScore, 0) / exposures.length);

      await db.insert(dataSourceFreshnessTable).values({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        lastSuccessAt: new Date(),
        lastAttemptAt: new Date(),
        status: "success",
        confidence: CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION,
        recordsLoaded: recordsWritten,
        metadataJson: JSON.stringify({
          trackPoints: records.length,
          uniqueStorms: new Set(records.map(r => r.sid)).size,
          countriesScored: exposures.length,
          avgCompositeScore: avgComposite,
        }),
      }).onConflictDoUpdate({
        target: dataSourceFreshnessTable.sourceKey,
        set: {
          lastSuccessAt: new Date(),
          lastAttemptAt: new Date(),
          status: "success",
          confidence: CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION,
          recordsLoaded: recordsWritten,
          metadataJson: JSON.stringify({
            trackPoints: records.length,
            uniqueStorms: new Set(records.map(r => r.sid)).size,
            countriesScored: exposures.length,
          }),
        },
      });

      await db.update(ingestionRunsTable)
        .set({
          status: "success",
          completedAt: new Date(),
          recordsRead,
          recordsWritten,
          countriesAffected: countriesAffected.join(","),
          summaryJson: JSON.stringify({
            avgCompositeScore: avgComposite,
            highestExposure: exposures.sort((a, b) => b.compositeScore - a.compositeScore)[0]?.country,
            lowestExposure: exposures.sort((a, b) => a.compositeScore - b.compositeScore)[0]?.country,
          }),
        })
        .where(eq(ingestionRunsTable.id, run.id));

      log.success(PIPELINE_NAME, `Completed: ${exposures.length} countries scored`, { avgComposite });

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected,
        confidence: CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION,
        summary: { avgCompositeScore: avgComposite, uniqueStorms: new Set(records.map(r => r.sid)).size },
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
        countriesAffected,
        confidence: 0,
        summary: {},
        error: errorMsg,
      };
    }
  },
};
