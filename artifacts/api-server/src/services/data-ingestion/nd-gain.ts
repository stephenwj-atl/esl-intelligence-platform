import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchText } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";
import { eq } from "drizzle-orm";
import * as https from "https";
import { createUnzip, createGunzip } from "zlib";

const PIPELINE_NAME = "nd-gain";
const SOURCE_KEY = "nd-gain-index";

const DOWNLOAD_PAGE = "https://gain.nd.edu/our-work/country-index/download-data/";

const COUNTRY_ISO3_MAP: Record<string, string> = {
  "JAM": "Jamaica",
  "DOM": "Dominican Republic",
  "TTO": "Trinidad & Tobago",
  "BRB": "Barbados",
  "BHS": "Bahamas",
  "GUY": "Guyana",
  "SUR": "Suriname",
  "HTI": "Haiti",
  "CUB": "Cuba",
  "PRI": "Puerto Rico",
  "BLZ": "Belize",
  "LCA": "St. Lucia",
  "GRD": "Grenada",
  "ATG": "Antigua & Barbuda",
  "DMA": "Dominica",
  "VCT": "St. Vincent & the Grenadines",
  "CYM": "Cayman Islands",
};

interface GainScores {
  gain?: number;
  vulnerability?: number;
  readiness?: number;
}

async function discoverZipUrl(): Promise<string> {
  const html = await fetchText(DOWNLOAD_PAGE);
  const match = html.match(/href="([^"]*\.zip[^"]*)"/);
  if (!match) throw new Error("Could not find ZIP download link on ND-GAIN page");
  const path = match[1];
  return path.startsWith("http") ? path : `https://gain.nd.edu${path}`;
}

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseScoreCsv(csv: string): Map<string, number> {
  const results = new Map<string, number>();
  const lines = csv.split("\n");
  if (lines.length < 2) return results;

  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const yearCols = headers.slice(2).map((h, i) => ({ year: parseInt(h), idx: i + 2 })).filter(c => !isNaN(c.year));
  yearCols.sort((a, b) => b.year - a.year);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
    if (cols.length < 3) continue;
    const iso3 = cols[0];
    if (!COUNTRY_ISO3_MAP[iso3]) continue;

    for (const yc of yearCols) {
      const val = parseFloat(cols[yc.idx]);
      if (!isNaN(val) && val > 0) {
        results.set(iso3, val);
        break;
      }
    }
  }
  return results;
}

async function extractCsvFromZip(zipBuffer: Buffer): Promise<Map<string, string>> {
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const csvFiles = new Map<string, string>();

  for (const entry of entries) {
    const name = entry.entryName.toLowerCase();
    if (name.endsWith(".csv") && !entry.isDirectory) {
      csvFiles.set(entry.entryName, entry.getData().toString("utf8"));
    }
  }
  return csvFiles;
}

function identifyCsvType(filename: string): "gain" | "vulnerability" | "readiness" | null {
  const lower = filename.toLowerCase();
  if (lower.includes("gain") && !lower.includes("vulnerability") && !lower.includes("readiness")) return "gain";
  if (lower.includes("vulnerability")) return "vulnerability";
  if (lower.includes("readiness")) return "readiness";
  return null;
}

export const ndGainAdapter: SourceAdapter = {
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

    log.info(PIPELINE_NAME, "Starting ND-GAIN climate vulnerability/readiness ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected = new Set<string>();
    const errors: string[] = [];

    try {
      const zipUrl = await discoverZipUrl();
      log.info(PIPELINE_NAME, `Downloading ZIP from ${zipUrl}`);

      const zipBuffer = await downloadBuffer(zipUrl);
      log.info(PIPELINE_NAME, `ZIP downloaded: ${(zipBuffer.length / 1024).toFixed(0)}KB`);

      const csvFiles = await extractCsvFromZip(zipBuffer);
      log.info(PIPELINE_NAME, `Found ${csvFiles.size} CSV files in ZIP`);

      const countryScores = new Map<string, GainScores>();
      for (const iso3 of Object.keys(COUNTRY_ISO3_MAP)) {
        countryScores.set(iso3, {});
      }

      for (const [filename, content] of csvFiles) {
        const csvType = identifyCsvType(filename);
        if (!csvType) continue;

        const values = parseScoreCsv(content);
        recordsRead += values.size;

        for (const [iso3, val] of values) {
          const scores = countryScores.get(iso3);
          if (scores) {
            scores[csvType] = val;
          }
        }
      }

      for (const [iso3, scores] of countryScores) {
        const country = COUNTRY_ISO3_MAP[iso3];
        if (!country) continue;

        const records = [];
        if (scores.gain !== undefined) {
          records.push({
            country,
            region: "National",
            datasetType: "ND-GAIN Overall Score",
            value: roundTo(scores.gain * 100, 1),
            unit: "score",
          });
        }
        if (scores.vulnerability !== undefined) {
          records.push({
            country,
            region: "National",
            datasetType: "ND-GAIN Vulnerability",
            value: roundTo(scores.vulnerability * 100, 1),
            unit: "score",
          });
        }
        if (scores.readiness !== undefined) {
          records.push({
            country,
            region: "National",
            datasetType: "ND-GAIN Readiness",
            value: roundTo(scores.readiness * 100, 1),
            unit: "score",
          });
        }

        if (records.length > 0) {
          await upsertRegionalData(records);
          recordsWritten += records.length;
          countriesAffected.add(country);
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      log.error(PIPELINE_NAME, `Failed: ${err}`);
    }

    const affectedArr = Array.from(countriesAffected);
    const totalCountries = Object.keys(COUNTRY_ISO3_MAP).length;
    const status = affectedArr.length === 0 ? "failed" as const :
      affectedArr.length < totalCountries ? "partial" as const : "success" as const;

    const confidence = totalCountries > 0
      ? roundTo((affectedArr.length / totalCountries) * CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION, 1)
      : 0;

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
