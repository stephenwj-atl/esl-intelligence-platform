import { db, rawDataCacheTable, dataSourceFreshnessTable, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { eq } from "drizzle-orm";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo, hashString } from "./utils/normalize";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult, ArcGISQueryResponse, ArcGISServiceConfig } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "arcgis-jamaica";
const SOURCE_KEY = "arcgis-jamaica";

const GOJ_BASE = "https://services6.arcgis.com/3R3y1KXaPJ9BFnsU/ArcGIS/rest/services";
const MSET_BASE = "https://gis2.mset.gov.jm/server/rest/services";

const SERVICES: ArcGISServiceConfig[] = [
  {
    name: "Flood Boundaries",
    layerId: "flood-boundaries",
    url: `${MSET_BASE}/Hosted/Flood_Boundaries/FeatureServer`,
    layerIndex: 0,
    category: "environmental",
    fetchGeometry: false,
  },
  {
    name: "PRTR Pollutant Release",
    layerId: "prtr-pollutants",
    url: `${MSET_BASE}/Pollutant_Release_Transfer_Register_WFL1/FeatureServer`,
    layerIndex: 0,
    category: "environmental",
    fetchGeometry: false,
  },
  {
    name: "PRTR 2023",
    layerId: "prtr-2023",
    url: `${MSET_BASE}/PRTR2023_WFL1/FeatureServer`,
    layerIndex: 0,
    category: "environmental",
    fetchGeometry: false,
  },
  {
    name: "All-Cause Mortality",
    layerId: "mortality",
    url: `${GOJ_BASE}/All_Cause_mortality/FeatureServer`,
    layerIndex: 0,
    category: "social",
    fetchGeometry: false,
  },
  {
    name: "Protected Areas Jamaica",
    layerId: "protected-areas",
    url: `${GOJ_BASE}/Protected_Areas_Jamaica/FeatureServer`,
    layerIndex: 0,
    category: "regulatory",
    fetchGeometry: false,
  },
  {
    name: "Planning Proposals",
    layerId: "planning",
    url: `${GOJ_BASE}/Planning/FeatureServer`,
    layerIndex: 0,
    category: "regulatory",
    fetchGeometry: false,
  },
  {
    name: "Planning Area Boundaries",
    layerId: "planning-boundaries",
    url: `${GOJ_BASE}/All_Island_Local_Planning_Area_Boundaries/FeatureServer`,
    layerIndex: 0,
    category: "regulatory",
    fetchGeometry: false,
  },
];

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;

async function queryFeatureCount(service: ArcGISServiceConfig): Promise<number | null> {
  try {
    const url = `${service.url}/${service.layerIndex}/query?where=1%3D1&returnCountOnly=true&f=json`;
    const response = await fetchJson<{ count?: number }>(url, { timeoutMs: 15000, maxRetries: 2 });
    return response.count ?? null;
  } catch {
    return null;
  }
}

async function queryFeatures(
  service: ArcGISServiceConfig,
  offset: number = 0
): Promise<ArcGISQueryResponse | null> {
  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      f: "json",
      returnGeometry: service.fetchGeometry ? "true" : "false",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
    });

    const url = `${service.url}/${service.layerIndex}/query?${params.toString()}`;
    return await fetchJson<ArcGISQueryResponse>(url, { timeoutMs: 30000, maxRetries: 2 });
  } catch {
    return null;
  }
}

async function ingestService(service: ArcGISServiceConfig): Promise<{
  status: "success" | "failed";
  featureCount: number;
  error?: string;
}> {
  log.info(PIPELINE_NAME, `Querying ${service.name}...`);

  const featureCount = await queryFeatureCount(service);

  if (featureCount === null) {
    log.warn(PIPELINE_NAME, `${service.name} is unreachable or returned no count`);
    return { status: "failed", featureCount: 0, error: "Service unreachable or count query failed" };
  }

  log.info(PIPELINE_NAME, `${service.name}: ${featureCount} features found`);

  let allFeatures: Record<string, unknown>[] = [];
  let offset = 0;
  let page = 0;

  while (offset < featureCount && page < MAX_PAGES) {
    const response = await queryFeatures(service, offset);
    if (!response || !response.features || response.features.length === 0) break;

    allFeatures = allFeatures.concat(response.features.map(f => f.attributes));
    offset += response.features.length;
    page++;

    if (!response.exceededTransferLimit) break;
  }

  const payloadSummary = {
    featureCount: allFeatures.length,
    totalAvailable: featureCount,
    sampleFields: allFeatures.length > 0 ? Object.keys(allFeatures[0]) : [],
    sampleRecord: allFeatures[0] || null,
  };

  await db.insert(rawDataCacheTable).values({
    sourceKey: `${SOURCE_KEY}-${service.layerId}`,
    sourceUrl: service.url,
    responseHash: hashString(JSON.stringify(payloadSummary)),
    payloadJson: JSON.stringify(payloadSummary),
    statusCode: 200,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: `${service.name}: ${allFeatures.length} features`,
  });

  return { status: "success", featureCount: allFeatures.length };
}

function deriveScoresFromServiceResults(
  serviceResults: Map<string, { status: string; featureCount: number }>
): Array<{ datasetType: string; value: number }> {
  const scores: Array<{ datasetType: string; value: number }> = [];

  const floodResult = serviceResults.get("flood-boundaries");
  if (floodResult?.status === "success" && floodResult.featureCount > 0) {
    const floodScore = clamp(Math.min(floodResult.featureCount * 2, 80), 10, 90);
    scores.push({ datasetType: "Flood Risk", value: roundTo(floodScore) });
  }

  const prtrResult = serviceResults.get("prtr-pollutants");
  const prtr2023Result = serviceResults.get("prtr-2023");
  const totalPRTR = (prtrResult?.featureCount || 0) + (prtr2023Result?.featureCount || 0);
  if (totalPRTR > 0) {
    const contaminationScore = clamp(Math.min(totalPRTR * 0.5, 75), 10, 85);
    scores.push({ datasetType: "Contamination Risk", value: roundTo(contaminationScore) });
  }

  const mortalityResult = serviceResults.get("mortality");
  if (mortalityResult?.status === "success" && mortalityResult.featureCount > 0) {
    scores.push({ datasetType: "Health Burden", value: roundTo(clamp(mortalityResult.featureCount * 3, 20, 80)) });
  }

  const protectedResult = serviceResults.get("protected-areas");
  if (protectedResult?.status === "success" && protectedResult.featureCount > 0) {
    const protectedScore = clamp(protectedResult.featureCount * 1.5, 15, 70);
    scores.push({ datasetType: "Protected Area Conflict", value: roundTo(protectedScore) });
  }

  const planningResult = serviceResults.get("planning");
  const boundaryResult = serviceResults.get("planning-boundaries");
  const totalPlanning = (planningResult?.featureCount || 0) + (boundaryResult?.featureCount || 0);
  if (totalPlanning > 0) {
    scores.push({ datasetType: "Regulatory Coverage", value: roundTo(clamp(totalPlanning * 2, 20, 80)) });
  }

  return scores;
}

export const arcgisJamaicaAdapter: SourceAdapter = {
  name: "Jamaica GOJ ArcGIS Services",
  sourceKey: SOURCE_KEY,

  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, `Starting ArcGIS Jamaica ingestion (${SERVICES.length} services)`);

    const [run] = await db.insert(ingestionRunsTable).values({
      pipelineName: PIPELINE_NAME,
      status: "running",
    }).returning();

    let recordsRead = 0;
    let recordsWritten = 0;
    const serviceResults = new Map<string, { status: string; featureCount: number }>();

    try {
      for (const service of SERVICES) {
        try {
          const result = await ingestService(service);
          serviceResults.set(service.layerId, result);
          recordsRead += result.featureCount;

          await db.insert(dataSourceFreshnessTable).values({
            sourceKey: `${SOURCE_KEY}-${service.layerId}`,
            pipelineName: PIPELINE_NAME,
            lastAttemptAt: new Date(),
            lastSuccessAt: result.status === "success" ? new Date() : undefined,
            status: result.status,
            confidence: result.status === "success" ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : 0,
            recordsLoaded: result.featureCount,
            errorMessage: result.error,
            metadataJson: JSON.stringify({ serviceName: service.name, url: service.url }),
          }).onConflictDoUpdate({
            target: dataSourceFreshnessTable.sourceKey,
            set: {
              lastAttemptAt: new Date(),
              lastSuccessAt: result.status === "success" ? new Date() : undefined,
              status: result.status,
              confidence: result.status === "success" ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : 0,
              recordsLoaded: result.featureCount,
              errorMessage: result.error,
            },
          });
        } catch (err) {
          log.warn(PIPELINE_NAME, `Service ${service.name} failed, continuing...`, {
            error: err instanceof Error ? err.message : String(err),
          });
          serviceResults.set(service.layerId, { status: "failed", featureCount: 0 });
        }
      }

      const successCount = Array.from(serviceResults.values()).filter(r => r.status === "success").length;

      if (successCount > 0) {
        const derivedScores = deriveScoresFromServiceResults(serviceResults);

        for (const score of derivedScores) {
          await upsertRegionalData({
            country: "Jamaica",
            region: "National",
            datasetType: score.datasetType,
            value: score.value,
            unit: "score",
            timestamp: new Date(),
          });
          recordsWritten++;
        }
      }

      const overallStatus = successCount === SERVICES.length ? "success"
        : successCount > 0 ? "partial" as const
        : "failed" as const;

      const avgConfidence = successCount > 0
        ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION * (successCount / SERVICES.length)
        : 0;

      await db.insert(dataSourceFreshnessTable).values({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        lastSuccessAt: successCount > 0 ? new Date() : undefined,
        lastAttemptAt: new Date(),
        status: overallStatus,
        confidence: roundTo(avgConfidence),
        recordsLoaded: recordsRead,
        metadataJson: JSON.stringify({
          servicesQueried: SERVICES.length,
          servicesSucceeded: successCount,
          servicesFailed: SERVICES.length - successCount,
        }),
      }).onConflictDoUpdate({
        target: dataSourceFreshnessTable.sourceKey,
        set: {
          lastSuccessAt: successCount > 0 ? new Date() : undefined,
          lastAttemptAt: new Date(),
          status: overallStatus,
          confidence: roundTo(avgConfidence),
          recordsLoaded: recordsRead,
        },
      });

      await db.update(ingestionRunsTable)
        .set({
          status: overallStatus,
          completedAt: new Date(),
          recordsRead,
          recordsWritten,
          countriesAffected: "Jamaica",
          summaryJson: JSON.stringify({
            servicesQueried: SERVICES.length,
            servicesSucceeded: successCount,
            serviceResults: Object.fromEntries(serviceResults),
          }),
        })
        .where(eq(ingestionRunsTable.id, run.id));

      log.success(PIPELINE_NAME, `Completed: ${successCount}/${SERVICES.length} services, ${recordsWritten} scores derived`);

      return {
        pipelineName: PIPELINE_NAME,
        status: overallStatus,
        recordsRead,
        recordsWritten,
        countriesAffected: ["Jamaica"],
        confidence: roundTo(avgConfidence),
        summary: { servicesSucceeded: successCount, servicesFailed: SERVICES.length - successCount },
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);

      await db.update(ingestionRunsTable)
        .set({ status: "failed", completedAt: new Date(), errorJson: JSON.stringify({ message: errorMsg }) })
        .where(eq(ingestionRunsTable.id, run.id));

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
