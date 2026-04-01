import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";
import { eq } from "drizzle-orm";

const PIPELINE_NAME = "wb-climate";
const SOURCE_KEY = "wb-cckp";

const CCKP_BASE = "https://cckpapi.worldbank.org/cckp/v1";

const COUNTRY_ISO3: Record<string, string> = {};
for (const [name, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
  COUNTRY_ISO3[name] = info.iso3;
}

interface CckpResponse {
  metadata: { status: string };
  data: Record<string, Record<string, number>>;
}

const CLIMATE_QUERIES = [
  {
    label: "Mean Temperature Baseline",
    path: "cmip6-x0.25_climatology_tas_climatology_annual_1995-2014_median_historical_ensemble_all_mean",
    unit: "°C",
  },
  {
    label: "Mean Temperature SSP245 2050",
    path: "cmip6-x0.25_climatology_tas_climatology_annual_2040-2059_median_ssp245_ensemble_all_mean",
    unit: "°C",
  },
  {
    label: "Mean Temperature SSP585 2080",
    path: "cmip6-x0.25_climatology_tas_climatology_annual_2080-2099_median_ssp585_ensemble_all_mean",
    unit: "°C",
  },
  {
    label: "Precipitation Baseline",
    path: "cmip6-x0.25_climatology_pr_climatology_annual_1995-2014_median_historical_ensemble_all_mean",
    unit: "mm/yr",
  },
  {
    label: "Precipitation SSP585 2080",
    path: "cmip6-x0.25_climatology_pr_climatology_annual_2080-2099_median_ssp585_ensemble_all_mean",
    unit: "mm/yr",
  },
  {
    label: "Max Temperature Baseline",
    path: "cmip6-x0.25_climatology_tasmax_climatology_annual_1995-2014_median_historical_ensemble_all_mean",
    unit: "°C",
  },
  {
    label: "Max Temperature SSP585 2080",
    path: "cmip6-x0.25_climatology_tasmax_climatology_annual_2080-2099_median_ssp585_ensemble_all_mean",
    unit: "°C",
  },
];

export const wbClimateAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,

  async run(): Promise<IngestionResult> {
    const startedAt = new Date();
    const runId = await db.insert(ingestionRunsTable).values({
      pipelineName: PIPELINE_NAME,
      startedAt,
      status: "running",
      recordsRead: 0,
      recordsWritten: 0,
      countriesAffected: [],
    }).returning({ id: ingestionRunsTable.id });

    log.info(PIPELINE_NAME, "Starting World Bank Climate Change Knowledge Portal ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected = new Set<string>();
    const errors: string[] = [];

    for (const query of CLIMATE_QUERIES) {
      for (const [country, iso3] of Object.entries(COUNTRY_ISO3)) {
        try {
          const url = `${CCKP_BASE}/${query.path}/${iso3}?_format=json`;
          const resp: CckpResponse = await fetchJson(url);
          recordsRead++;

          const countryData = resp.data?.[iso3];
          if (!countryData) continue;

          const value = Object.values(countryData)[0];
          if (typeof value !== "number" || isNaN(value)) continue;

          await upsertRegionalData({
            country,
            region: "National",
            datasetType: `CCKP ${query.label}`,
            value: roundTo(value, 2),
            unit: query.unit,
          });

          recordsWritten++;
          countriesAffected.add(country);
        } catch (err) {
          errors.push(`${country}/${query.label}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    const affectedArr = Array.from(countriesAffected);
    const totalCountries = Object.keys(COUNTRY_ISO3).length;
    const status = affectedArr.length === 0 ? "failed" as const :
      affectedArr.length < totalCountries ? "partial" as const : "success" as const;

    const confidence = roundTo((affectedArr.length / totalCountries) * CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION, 1);

    await upsertFreshness({
      pipelineName: PIPELINE_NAME,
      sourceKey: SOURCE_KEY,
      status,
      recordsLoaded: recordsWritten,
      confidence,
    });

    await db.update(ingestionRunsTable)
      .set({
        completedAt: new Date(),
        status,
        recordsRead,
        recordsWritten,
        countriesAffected: affectedArr,
        summaryJson: { queries: CLIMATE_QUERIES.length, countries: affectedArr.length },
        errorJson: errors.length > 0 ? { errors: errors.slice(0, 20) } : null,
      })
      .where(eq(ingestionRunsTable.id, runId[0].id));

    log.success(PIPELINE_NAME, `Completed: ${affectedArr.length} countries, ${recordsWritten} climate data points`);

    return {
      pipelineName: PIPELINE_NAME,
      status,
      recordsRead,
      recordsWritten,
      countriesAffected: affectedArr,
      confidence,
      summary: { queries: CLIMATE_QUERIES.length, countries: affectedArr.length },
      error: errors.length > 0 ? `${errors.length} query errors` : undefined,
    };
  },
};
