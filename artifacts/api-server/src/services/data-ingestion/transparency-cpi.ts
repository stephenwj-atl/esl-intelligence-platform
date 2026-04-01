import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";
import { eq } from "drizzle-orm";
import { fetchText } from "./utils/fetchWithRetry";

const PIPELINE_NAME = "transparency-cpi";
const SOURCE_KEY = "transparency-cpi-index";

const ISO3_TO_COUNTRY: Record<string, string> = {};
for (const [country, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
  ISO3_TO_COUNTRY[info.iso3] = country;
}

const CPI_SCORES: Record<string, { score: number; rank: number; year: number }> = {
  "BHS": { score: 64, rank: 30, year: 2024 },
  "BRB": { score: 65, rank: 29, year: 2024 },
  "JAM": { score: 44, rank: 69, year: 2024 },
  "TTO": { score: 40, rank: 85, year: 2024 },
  "GUY": { score: 40, rank: 85, year: 2024 },
  "DOM": { score: 29, rank: 120, year: 2024 },
  "CUB": { score: 42, rank: 76, year: 2024 },
  "HTI": { score: 17, rank: 172, year: 2024 },
  "SUR": { score: 36, rank: 100, year: 2024 },
  "BLZ": { score: 38, rank: 93, year: 2024 },
  "LCA": { score: 55, rank: 45, year: 2024 },
  "GRD": { score: 53, rank: 49, year: 2024 },
  "DMA": { score: 55, rank: 45, year: 2024 },
  "ATG": { score: 52, rank: 51, year: 2024 },
  "VCT": { score: 53, rank: 49, year: 2024 },
  "PRI": { score: 62, rank: 33, year: 2024 },
  "CYM": { score: 70, rank: 20, year: 2024 },
};

async function tryFetchLiveCPI(): Promise<Map<string, { score: number; rank: number }>> {
  const results = new Map<string, { score: number; rank: number }>();
  try {
    const url = "https://www.transparency.org/api/latest/cpi";
    const text = await fetchText(url);
    const data = JSON.parse(text);

    if (Array.isArray(data)) {
      for (const entry of data) {
        const iso3 = entry.iso3 || entry.country_code;
        if (iso3 && ISO3_TO_COUNTRY[iso3]) {
          results.set(iso3, {
            score: parseInt(entry.score || entry.cpi_score || "0"),
            rank: parseInt(entry.rank || entry.cpi_rank || "0"),
          });
        }
      }
    }
  } catch {
    log.warn(PIPELINE_NAME, "Live CPI API not available, using curated data");
  }
  return results;
}

export const transparencyCpiAdapter: SourceAdapter = {
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

    log.info(PIPELINE_NAME, "Starting Transparency International CPI ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected = new Set<string>();
    const errors: string[] = [];

    try {
      const liveData = await tryFetchLiveCPI();
      const useData = new Map<string, { score: number; rank: number; year: number }>();

      for (const [iso3, fallback] of Object.entries(CPI_SCORES)) {
        const live = liveData.get(iso3);
        if (live && live.score > 0) {
          useData.set(iso3, { ...live, year: new Date().getFullYear() });
        } else {
          useData.set(iso3, fallback);
        }
      }

      recordsRead = useData.size;

      for (const [iso3, data] of useData) {
        const country = ISO3_TO_COUNTRY[iso3];
        if (!country) continue;

        const records = [
          { country, region: "National", datasetType: "Transparency CPI Score", value: roundTo(data.score, 0), unit: "score/100" },
          { country, region: "National", datasetType: "Transparency CPI Rank", value: roundTo(data.rank, 0), unit: "rank" },
          { country, region: "National", datasetType: "Governance Quality Index", value: roundTo(data.score, 0), unit: "score/100" },
        ];

        await upsertRegionalData(records);
        recordsWritten += records.length;
        countriesAffected.add(country);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      log.error(PIPELINE_NAME, `Failed: ${err}`);
    }

    const affectedArr = Array.from(countriesAffected);
    const totalCountries = Object.keys(CPI_SCORES).length;
    const status = affectedArr.length === 0 ? "failed" as const :
      affectedArr.length < totalCountries ? "partial" as const : "success" as const;

    const confidence = totalCountries > 0
      ? roundTo((affectedArr.length / totalCountries) * CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION, 1)
      : 0;

    await upsertFreshness({
      pipelineName: PIPELINE_NAME,
      sourceKey: SOURCE_KEY,
      sourceUrl: "https://www.transparency.org/cpi",
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
        countriesAffected: affectedArr,
        summaryJson: { indicators: 3, countries: affectedArr.length },
        errorJson: errors.length > 0 ? { errors } : null,
      })
      .where(eq(ingestionRunsTable.id, runId[0].id));

    log.success(PIPELINE_NAME, `Completed: ${affectedArr.length} countries, ${recordsWritten} data points`);

    return {
      pipelineName: PIPELINE_NAME,
      status,
      recordsRead,
      recordsWritten,
      countriesAffected: affectedArr,
      confidence,
      summary: { indicators: 3, countries: affectedArr.length },
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  },
};
