import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";
import { eq } from "drizzle-orm";

const PIPELINE_NAME = "thinkhazard";
const SOURCE_KEY = "gfdrr-thinkhazard";

const COUNTRY_IDS: Record<string, number> = {
  "Jamaica": 119,
  "Dominican Republic": 69,
  "Trinidad & Tobago": 222,
  "Barbados": 40,
  "Bahamas": 28,
  "Guyana": 101,
  "Suriname": 207,
  "Haiti": 103,
  "Cuba": 61,
  "Puerto Rico": 184,
  "Belize": 42,
  "St. Lucia": 192,
  "Grenada": 95,
  "Antigua & Barbuda": 14,
  "Dominica": 67,
  "St. Vincent & the Grenadines": 193,
  "Cayman Islands": 53,
};

const HAZARD_LEVEL_SCORES: Record<string, number> = {
  "HIG": 90,
  "MED": 60,
  "LOW": 30,
  "VLO": 10,
  "no-data": 0,
};

interface ThinkHazardResult {
  hazardtype: { mnemonic: string; hazardtype: string };
  hazardlevel: { mnemonic: string; title: string };
}

export const thinkhazardAdapter: SourceAdapter = {
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

    log.info(PIPELINE_NAME, "Starting GFDRR ThinkHazard multi-hazard ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    const errors: string[] = [];

    for (const [country, thId] of Object.entries(COUNTRY_IDS)) {
      try {
        const url = `https://thinkhazard.org/en/report/${thId}-${country.toLowerCase().replace(/[^a-z]/g, "-")}.json`;
        const hazards: ThinkHazardResult[] = await fetchJson(url);
        recordsRead += hazards.length;

        const records = [];
        let compositeScore = 0;
        let hazardCount = 0;

        for (const h of hazards) {
          const score = HAZARD_LEVEL_SCORES[h.hazardlevel.mnemonic] ?? 0;
          const datasetType = `ThinkHazard ${h.hazardtype.hazardtype} Level`;

          records.push({
            country,
            region: "National",
            datasetType,
            value: score,
            unit: h.hazardlevel.title,
          });

          if (h.hazardlevel.mnemonic !== "no-data") {
            compositeScore += score;
            hazardCount++;
          }
        }

        if (hazardCount > 0) {
          records.push({
            country,
            region: "National",
            datasetType: "ThinkHazard Composite Score",
            value: Math.round((compositeScore / hazardCount) * 10) / 10,
            unit: "score",
          });
        }

        records.push({
          country,
          region: "National",
          datasetType: "ThinkHazard Count",
          value: hazardCount,
          unit: "hazards",
        });

        await upsertRegionalData(records);
        recordsWritten += records.length;
        countriesAffected.push(country);
      } catch (err) {
        errors.push(`${country}: ${err instanceof Error ? err.message : String(err)}`);
        log.warn(PIPELINE_NAME, `Failed for ${country}: ${err}`);
      }
    }

    const status = countriesAffected.length === 0 ? "failed" as const :
      countriesAffected.length < Object.keys(COUNTRY_IDS).length ? "partial" as const : "success" as const;

    const confidence = roundTo((countriesAffected.length / Object.keys(COUNTRY_IDS).length) * CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION, 1);

    await upsertFreshness({
      pipelineName: PIPELINE_NAME,
      sourceKey: SOURCE_KEY,
      sourceUrl: "https://thinkhazard.org",
      lastSuccessAt: status !== "failed" ? new Date() : undefined,
      recordCount: recordsWritten,
      confidence,
    });

    await db.update(ingestionRunsTable)
      .set({
        completedAt: new Date(),
        status,
        recordsRead,
        recordsWritten,
        countriesAffected,
        summaryJson: { hazards: 11, countries: countriesAffected.length, errors: errors.length },
        errorJson: errors.length > 0 ? { errors } : null,
      })
      .where(eq(ingestionRunsTable.id, runId[0].id));

    log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);

    return {
      pipelineName: PIPELINE_NAME,
      status,
      recordsRead,
      recordsWritten,
      countriesAffected,
      confidence,
      summary: { hazards: 11, countries: countriesAffected.length },
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  },
};
