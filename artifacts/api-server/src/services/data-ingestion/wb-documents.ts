import { db, ingestionRunsTable, rawDataCacheTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";

const PIPELINE_NAME = "wb-documents";
const SOURCE_KEY = "wb-documents-eia";

const API_BASE = "https://search.worldbank.org/api/v2/wds";
const ROWS_PER_PAGE = 50;
const PAGE_DELAY_MS = 600;

const COUNTRY_ISO2: Record<string, string> = {};
for (const [name, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
  COUNTRY_ISO2[name] = info.iso2;
}

const ISO2_TO_COUNTRY: Record<string, string> = {};
for (const [name, iso2] of Object.entries(COUNTRY_ISO2)) {
  ISO2_TO_COUNTRY[iso2] = name;
}

type DocCategory = "eia" | "esia" | "sea" | "esmp" | "esmf" | "escp" | "rap" | "safeguards" | "other";

interface WBDocument {
  id: string;
  title: string;
  docType: string;
  category: DocCategory;
  date: string;
  year: number;
  pdfUrl: string;
  countryCode: string;
  country: string;
}

interface WBApiResponse {
  total: number;
  rows: number;
  documents: Record<string, {
    id?: string;
    display_title?: string;
    docty?: string;
    docdt?: string;
    pdfurl?: string;
    countrycode?: string;
    url?: string;
  }>;
}

function classifyDocument(title: string, docType: string): DocCategory {
  const combined = `${title} ${docType}`.toLowerCase();

  if (/\besia\b|environmental\s+and\s+social\s+impact\s+assessment/i.test(combined)) return "esia";
  if (/\bsea\b|strategic\s+environmental\s+assessment/i.test(combined)) return "sea";
  if (/\besmp\b|environmental\s+(and\s+social\s+)?management\s+plan/i.test(combined)) return "esmp";
  if (/\besmf\b|environmental\s+(and\s+social\s+)?management\s+framework/i.test(combined)) return "esmf";
  if (/\bescp\b|environmental\s+and\s+social\s+commitment\s+plan/i.test(combined)) return "escp";
  if (/\brap\b|resettlement\s+(action\s+)?plan/i.test(combined)) return "rap";
  if (/\beia\b|environmental\s+(impact\s+)?assessment/i.test(combined)) return "eia";
  if (/safeguard|isds|integrated\s+safeguards/i.test(combined)) return "safeguards";
  return "other";
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCountryDocuments(countryCode: string): Promise<WBDocument[]> {
  const docs: WBDocument[] = [];
  const countryName = ISO2_TO_COUNTRY[countryCode];
  if (!countryName) return docs;

  let offset = 0;
  let total = 0;
  let page = 0;
  const maxPages = 20;

  do {
    const url = `${API_BASE}?format=json&fl=id,docdt,docty,display_title,pdfurl,countrycode,url&rows=${ROWS_PER_PAGE}&os=${offset}&countrycode_exact=${countryCode}&qterm=environmental+impact+assessment`;

    try {
      const data = await fetchJson<WBApiResponse>(url, { timeoutMs: 20000 });
      total = data.total || 0;

      const docEntries = Object.values(data.documents || {}).filter(d => d && d.display_title);

      for (const d of docEntries) {
        const title = (d.display_title || "").replace(/\s+/g, " ").trim();
        const docType = d.docty || "";
        const category = classifyDocument(title, docType);

        if (category === "other") continue;

        const dateStr = d.docdt || "";
        const yearMatch = dateStr.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 0;

        docs.push({
          id: d.id || String(offset + docs.length),
          title,
          docType,
          category,
          date: dateStr,
          year,
          pdfUrl: d.pdfurl || d.url || "",
          countryCode,
          country: countryName,
        });
      }

      offset += ROWS_PER_PAGE;
      page++;

      if (page < maxPages && offset < total) {
        await delay(PAGE_DELAY_MS);
      }
    } catch (err) {
      log.warn(PIPELINE_NAME, `Error fetching page ${page} for ${countryCode}: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }
  } while (offset < total && page < maxPages);

  return docs;
}

export const wbDocumentsAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting World Bank Environmental Documents ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    const countrySummary: Record<string, { total: number; eia: number; esia: number; sea: number; esmp: number; esmf: number; escp: number; rap: number; safeguards: number }> = {};

    try {
      const allDocs: WBDocument[] = [];
      const countryCodes = Object.values(COUNTRY_ISO2).filter(c => c !== "KY" && c !== "PR");

      for (const cc of countryCodes) {
        const countryName = ISO2_TO_COUNTRY[cc]!;
        log.info(PIPELINE_NAME, `Fetching documents for ${countryName} (${cc})`);

        const docs = await fetchCountryDocuments(cc);
        if (docs.length > 0) {
          allDocs.push(...docs);
          countriesAffected.push(countryName);

          const summary = { total: docs.length, eia: 0, esia: 0, sea: 0, esmp: 0, esmf: 0, escp: 0, rap: 0, safeguards: 0 };
          for (const d of docs) {
            if (d.category in summary) {
              (summary as any)[d.category]++;
            }
          }
          countrySummary[countryName] = summary;
          log.info(PIPELINE_NAME, `${countryName}: ${docs.length} environmental documents found`);
        }

        await delay(PAGE_DELAY_MS);
      }

      recordsRead = allDocs.length;
      const now = new Date();
      const dataRecords: { country: string; region: string; datasetType: string; value: number; unit: string; timestamp: Date }[] = [];

      for (const [country, summary] of Object.entries(countrySummary)) {
        const jr = (dt: string, v: number, u: string) => ({ country, region: "Caribbean", datasetType: dt, value: v, unit: u, timestamp: now });

        dataRecords.push(jr("WB Environmental Documents Total", summary.total, "count"));
        if (summary.eia > 0) dataRecords.push(jr("WB EIA Documents", summary.eia, "count"));
        if (summary.esia > 0) dataRecords.push(jr("WB ESIA Documents", summary.esia, "count"));
        if (summary.sea > 0) dataRecords.push(jr("WB SEA Documents", summary.sea, "count"));
        if (summary.esmp > 0) dataRecords.push(jr("WB ESMP Documents", summary.esmp, "count"));
        if (summary.esmf > 0) dataRecords.push(jr("WB ESMF Documents", summary.esmf, "count"));
        if (summary.escp > 0) dataRecords.push(jr("WB ESCP Documents", summary.escp, "count"));
        if (summary.rap > 0) dataRecords.push(jr("WB RAP Documents", summary.rap, "count"));
        if (summary.safeguards > 0) dataRecords.push(jr("WB Safeguards Documents", summary.safeguards, "count"));

        const countryDocs = allDocs.filter(d => d.country === country);
        const years = countryDocs.map(d => d.year).filter(y => y > 0);
        if (years.length > 0) {
          dataRecords.push(jr("WB Earliest EA Year", Math.min(...years), "year"));
          dataRecords.push(jr("WB Latest EA Year", Math.max(...years), "year"));
          const yearSpan = Math.max(1, Math.max(...years) - Math.min(...years) + 1);
          dataRecords.push(jr("WB Avg EA Per Year", roundTo(summary.total / yearSpan), "per_year"));
        }

        let eaCoverage = 0;
        eaCoverage += Math.min(summary.total * 2, 30);
        if (summary.esia > 0) eaCoverage += 15;
        if (summary.sea > 0) eaCoverage += 10;
        if (summary.esmp > 0) eaCoverage += 10;
        if (summary.esmf > 0) eaCoverage += 10;
        if (summary.escp > 0) eaCoverage += 10;
        if (summary.rap > 0) eaCoverage += 5;
        eaCoverage += Math.min(Object.values(summary).filter(v => v > 0).length * 3, 15);
        eaCoverage = Math.min(eaCoverage, 100);
        dataRecords.push(jr("WB EA Coverage Score", roundTo(eaCoverage), "score"));
      }

      if (dataRecords.length > 0) {
        await upsertRegionalData(dataRecords);
        recordsWritten = dataRecords.length;
      }

      await db.insert(rawDataCacheTable).values({
        sourceKey: SOURCE_KEY,
        sourceUrl: API_BASE,
        payloadJson: JSON.stringify({
          totalDocuments: allDocs.length,
          countriesWithDocs: countriesAffected.length,
          countrySummary,
          sampleDocs: allDocs.slice(0, 20).map(d => ({
            title: d.title.slice(0, 120),
            category: d.category,
            year: d.year,
            country: d.country,
          })),
          fetchedAt: new Date().toISOString(),
        }),
        statusCode: 200,
        notes: "wb-documents-environmental-assessments",
      });

      const confidence = countriesAffected.length >= 10 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;

      await upsertFreshness({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        status: "success",
        confidence,
        recordsLoaded: recordsRead,
      });

      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME,
        status: "success",
        startedAt,
        completedAt: new Date(),
        recordsRead,
        recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${allDocs.length} environmental docs from ${countriesAffected.length} countries, ${recordsWritten} data points`, countrySummary);

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected,
        confidence,
        summary: {
          totalDocuments: allDocs.length,
          countriesWithDocs: countriesAffected.length,
          countrySummary,
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);

      await upsertFreshness({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        status: "failed",
        confidence: 0,
        recordsLoaded: 0,
        errorMessage: error,
      });

      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME,
        status: "failed",
        startedAt,
        completedAt: new Date(),
        recordsRead: 0,
        recordsWritten: 0,
        errorJson: JSON.stringify({ message: error }),
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "failed",
        recordsRead: 0,
        recordsWritten: 0,
        countriesAffected: [],
        confidence: 0,
        summary: {},
        error,
      };
    }
  },
};
