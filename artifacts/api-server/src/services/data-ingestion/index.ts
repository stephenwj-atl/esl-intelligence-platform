import { aqueductAdapter } from "./aqueduct";
import { ibtracAdapter } from "./ibtracs";
import { opendataJamaicaAdapter } from "./opendata-jamaica";
import { arcgisJamaicaAdapter } from "./arcgis-jamaica";
import { wdpaAdapter } from "./wdpa";
import { worldpopAdapter } from "./worldpop";
import { soilgridsAdapter } from "./soilgrids";
import { coralReefWatchAdapter } from "./coral-reef-watch";
import { usgsEarthquakeAdapter } from "./usgs-earthquake";
import { worldBankAdapter } from "./world-bank";
import { whoGhoAdapter } from "./who-gho";
import { unescoWhcAdapter } from "./unesco-whc";
import { osmInfrastructureAdapter } from "./osm-infrastructure";
import { jrcFloodAdapter } from "./jrc-flood";
import { noaaSlrAdapter } from "./noaa-slr";
import { hydroshedsAdapter } from "./hydrosheds";
import { openBuildingsAdapter } from "./open-buildings";
import { nepaEiaAdapter } from "./nepa-eia";
import { computeCountryScores, writeScoresToDB } from "./scoring";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";

const PIPELINE_NAME = "orchestrator";

const adapters: Record<string, SourceAdapter> = {
  aqueduct: aqueductAdapter,
  ibtracs: ibtracAdapter,
  "opendata-jamaica": opendataJamaicaAdapter,
  "arcgis-jamaica": arcgisJamaicaAdapter,
  wdpa: wdpaAdapter,
  worldpop: worldpopAdapter,
  soilgrids: soilgridsAdapter,
  "coral-reef-watch": coralReefWatchAdapter,
  "usgs-earthquake": usgsEarthquakeAdapter,
  "world-bank": worldBankAdapter,
  "who-gho": whoGhoAdapter,
  "unesco-whc": unescoWhcAdapter,
  "osm-infrastructure": osmInfrastructureAdapter,
  "jrc-flood": jrcFloodAdapter,
  "noaa-slr": noaaSlrAdapter,
  hydrosheds: hydroshedsAdapter,
  "open-buildings": openBuildingsAdapter,
  "nepa-eia": nepaEiaAdapter,
};

export async function runPipeline(name: string): Promise<IngestionResult> {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`Unknown pipeline: ${name}. Available: ${Object.keys(adapters).join(", ")}`);
  }

  log.info(PIPELINE_NAME, `Starting pipeline: ${name}`);
  const result = await adapter.run();
  log.info(PIPELINE_NAME, `Pipeline ${name} completed with status: ${result.status}`);

  return result;
}

export async function runAllPipelines(): Promise<{
  results: IngestionResult[];
  scoring: { countriesUpdated: number } | null;
}> {
  log.info(PIPELINE_NAME, "Starting full data ingestion refresh");

  const results: IngestionResult[] = [];
  const pipelineOrder = Object.keys(adapters);

  for (const name of pipelineOrder) {
    try {
      const result = await runPipeline(name);
      results.push(result);
    } catch (err) {
      log.error(PIPELINE_NAME, `Pipeline ${name} threw an unhandled error`, err);
      results.push({
        pipelineName: name,
        status: "failed",
        recordsRead: 0,
        recordsWritten: 0,
        countriesAffected: [],
        confidence: 0,
        summary: {},
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const successCount = results.filter(r => r.status === "success" || r.status === "partial").length;
  let scoring: { countriesUpdated: number } | null = null;

  if (successCount > 0) {
    try {
      log.info(PIPELINE_NAME, "Running scoring engine...");
      const scores = await computeCountryScores();
      const countriesUpdated = await writeScoresToDB(scores);
      scoring = { countriesUpdated };
    } catch (err) {
      log.error(PIPELINE_NAME, "Scoring engine failed", err);
    }
  }

  const summary = {
    total: results.length,
    succeeded: results.filter(r => r.status === "success").length,
    partial: results.filter(r => r.status === "partial").length,
    failed: results.filter(r => r.status === "failed").length,
  };

  log.info(PIPELINE_NAME, "Full refresh complete", summary);

  return { results, scoring };
}

export { adapters };
