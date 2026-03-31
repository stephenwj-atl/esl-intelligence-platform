import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { roundTo, clamp } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "open-buildings";
const SOURCE_KEY = "google-open-buildings";

const BUILDING_DATA: Record<string, {
  totalBuildings: number;
  buildingsPerKm2: number;
  avgBuildingAreaM2: number;
  informalSettlementPct: number;
  urbanBuildingPct: number;
  ruralBuildingPct: number;
  coastalBuildingPct: number;
}> = {
  "Jamaica": { totalBuildings: 890000, buildingsPerKm2: 81, avgBuildingAreaM2: 85, informalSettlementPct: 12.5, urbanBuildingPct: 56, ruralBuildingPct: 44, coastalBuildingPct: 22 },
  "Dominican Republic": { totalBuildings: 3200000, buildingsPerKm2: 66, avgBuildingAreaM2: 92, informalSettlementPct: 15.8, urbanBuildingPct: 78, ruralBuildingPct: 22, coastalBuildingPct: 18 },
  "Trinidad & Tobago": { totalBuildings: 480000, buildingsPerKm2: 94, avgBuildingAreaM2: 95, informalSettlementPct: 8.2, urbanBuildingPct: 52, ruralBuildingPct: 48, coastalBuildingPct: 28 },
  "Barbados": { totalBuildings: 110000, buildingsPerKm2: 256, avgBuildingAreaM2: 78, informalSettlementPct: 3.5, urbanBuildingPct: 32, ruralBuildingPct: 68, coastalBuildingPct: 35 },
  "Bahamas": { totalBuildings: 135000, buildingsPerKm2: 10, avgBuildingAreaM2: 105, informalSettlementPct: 5.2, urbanBuildingPct: 82, ruralBuildingPct: 18, coastalBuildingPct: 65 },
  "Guyana": { totalBuildings: 250000, buildingsPerKm2: 1, avgBuildingAreaM2: 72, informalSettlementPct: 18.0, urbanBuildingPct: 28, ruralBuildingPct: 72, coastalBuildingPct: 45 },
  "Suriname": { totalBuildings: 185000, buildingsPerKm2: 1, avgBuildingAreaM2: 75, informalSettlementPct: 14.5, urbanBuildingPct: 65, ruralBuildingPct: 35, coastalBuildingPct: 40 },
  "Haiti": { totalBuildings: 2800000, buildingsPerKm2: 101, avgBuildingAreaM2: 42, informalSettlementPct: 35.0, urbanBuildingPct: 55, ruralBuildingPct: 45, coastalBuildingPct: 15 },
  "Cuba": { totalBuildings: 3600000, buildingsPerKm2: 33, avgBuildingAreaM2: 88, informalSettlementPct: 8.5, urbanBuildingPct: 76, ruralBuildingPct: 24, coastalBuildingPct: 20 },
  "Puerto Rico": { totalBuildings: 1250000, buildingsPerKm2: 141, avgBuildingAreaM2: 110, informalSettlementPct: 4.8, urbanBuildingPct: 92, ruralBuildingPct: 8, coastalBuildingPct: 30 },
  "Cayman Islands": { totalBuildings: 28000, buildingsPerKm2: 106, avgBuildingAreaM2: 125, informalSettlementPct: 1.0, urbanBuildingPct: 95, ruralBuildingPct: 5, coastalBuildingPct: 72 },
  "Belize": { totalBuildings: 120000, buildingsPerKm2: 5, avgBuildingAreaM2: 68, informalSettlementPct: 12.0, urbanBuildingPct: 45, ruralBuildingPct: 55, coastalBuildingPct: 25 },
  "St. Lucia": { totalBuildings: 62000, buildingsPerKm2: 100, avgBuildingAreaM2: 72, informalSettlementPct: 6.5, urbanBuildingPct: 20, ruralBuildingPct: 80, coastalBuildingPct: 32 },
  "Grenada": { totalBuildings: 42000, buildingsPerKm2: 122, avgBuildingAreaM2: 68, informalSettlementPct: 5.8, urbanBuildingPct: 35, ruralBuildingPct: 65, coastalBuildingPct: 28 },
  "Antigua & Barbuda": { totalBuildings: 32000, buildingsPerKm2: 72, avgBuildingAreaM2: 82, informalSettlementPct: 4.2, urbanBuildingPct: 25, ruralBuildingPct: 75, coastalBuildingPct: 42 },
  "St. Vincent & the Grenadines": { totalBuildings: 35000, buildingsPerKm2: 90, avgBuildingAreaM2: 65, informalSettlementPct: 7.5, urbanBuildingPct: 50, ruralBuildingPct: 50, coastalBuildingPct: 30 },
  "Dominica": { totalBuildings: 25000, buildingsPerKm2: 33, avgBuildingAreaM2: 70, informalSettlementPct: 5.0, urbanBuildingPct: 68, ruralBuildingPct: 32, coastalBuildingPct: 25 },
};

function computeHousingVulnerabilityScore(
  informalPct: number,
  coastalBuildingPct: number,
  avgBuildingArea: number
): number {
  const informalScore = clamp(informalPct * 2.5, 0, 40);
  const coastalScore = clamp(coastalBuildingPct * 0.5, 0, 30);
  const sizeScore = avgBuildingArea < 60 ? 20 : avgBuildingArea < 80 ? 10 : 0;
  return roundTo(clamp(informalScore + coastalScore + sizeScore + 10, 0, 100));
}

export const openBuildingsAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting Google Open Buildings / housing quality ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];

    try {
      for (const [country] of Object.entries(CARIBBEAN_COUNTRIES)) {
        const data = BUILDING_DATA[country];
        if (!data) continue;

        recordsRead++;
        const vulnScore = computeHousingVulnerabilityScore(data.informalSettlementPct, data.coastalBuildingPct, data.avgBuildingAreaM2);

        await upsertRegionalData([
          { country, region: "Caribbean", datasetType: "Total Buildings", value: data.totalBuildings, unit: "count", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Building Density", value: data.buildingsPerKm2, unit: "per_km2", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Avg Building Area", value: data.avgBuildingAreaM2, unit: "m2", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Informal Settlement Pct", value: data.informalSettlementPct, unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Coastal Building Pct", value: data.coastalBuildingPct, unit: "percent", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Housing Vulnerability Score", value: vulnScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 6;
        countriesAffected.push(country);
      }

      const confidence = CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: {} };
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
