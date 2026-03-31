import { db, ingestionRunsTable, regionalDataTable } from "@workspace/db";
import { fetchJson } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "worldpop";
const SOURCE_KEY = "worldpop-population";

const WORLDPOP_API = "https://www.worldpop.org/rest/data/pop/wpgp";

interface WorldPopCountryData {
  data: Array<{
    iso3: string;
    popyear: string;
    data_file: string;
    title: string;
  }>;
}

const POPULATION_REFERENCE: Record<string, { population: number; densityPerKm2: number; urbanPct: number }> = {
  "Jamaica": { population: 2828000, densityPerKm2: 257, urbanPct: 56.3 },
  "Dominican Republic": { population: 11117000, densityPerKm2: 229, urbanPct: 83.0 },
  "Trinidad & Tobago": { population: 1531000, densityPerKm2: 298, urbanPct: 53.2 },
  "Barbados": { population: 282000, densityPerKm2: 656, urbanPct: 31.2 },
  "Bahamas": { population: 410000, densityPerKm2: 30, urbanPct: 83.4 },
  "Guyana": { population: 813000, densityPerKm2: 4, urbanPct: 26.7 },
  "Suriname": { population: 618000, densityPerKm2: 4, urbanPct: 66.1 },
  "Haiti": { population: 11585000, densityPerKm2: 417, urbanPct: 58.0 },
  "Cuba": { population: 11194000, densityPerKm2: 102, urbanPct: 77.2 },
  "Puerto Rico": { population: 3222000, densityPerKm2: 363, urbanPct: 93.6 },
  "Cayman Islands": { population: 68000, densityPerKm2: 262, urbanPct: 100 },
  "Belize": { population: 441000, densityPerKm2: 19, urbanPct: 46.0 },
  "St. Lucia": { population: 180000, densityPerKm2: 292, urbanPct: 18.7 },
  "Grenada": { population: 125000, densityPerKm2: 368, urbanPct: 36.5 },
  "Antigua & Barbuda": { population: 94000, densityPerKm2: 213, urbanPct: 24.4 },
  "St. Vincent & the Grenadines": { population: 104000, densityPerKm2: 268, urbanPct: 53.0 },
  "Dominica": { population: 73000, densityPerKm2: 97, urbanPct: 71.0 },
};

function computePopulationExposureScore(densityPerKm2: number, urbanPct: number): number {
  const densityScore = Math.min((densityPerKm2 / 500) * 100, 100);
  const urbanScore = urbanPct;
  return roundTo(densityScore * 0.6 + urbanScore * 0.4);
}

export const worldpopAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting WorldPop population density ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let liveDataCount = 0;

    try {
      for (const [country, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        let hasLiveData = false;
        try {
          const response = await fetchJson<WorldPopCountryData>(
            `${WORLDPOP_API}?iso3=${meta.iso3}`,
            { timeoutMs: 10000 }
          );
          if (response?.data?.length > 0) {
            liveDataCount++;
            hasLiveData = true;
          }
        } catch {}

        const ref = POPULATION_REFERENCE[country];
        if (!ref) continue;

        recordsRead++;
        const exposureScore = computePopulationExposureScore(ref.densityPerKm2, ref.urbanPct);

        await db.insert(regionalDataTable).values([
          { country, region: "Caribbean", datasetType: "Population", value: ref.population, unit: "count", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Population Density", value: ref.densityPerKm2, unit: "per_km2", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Urban Population Pct", value: roundTo(ref.urbanPct), unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Population Exposure Score", value: exposureScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 4;
        countriesAffected.push(country);
      }

      const confidence = liveDataCount > 0 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { liveDataCount } };
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
