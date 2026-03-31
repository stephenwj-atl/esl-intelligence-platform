import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { fetchJson } from "./utils/fetchWithRetry";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CARIBBEAN_COUNTRIES, CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "unesco-whc";
const SOURCE_KEY = "unesco-world-heritage";

const UNESCO_API = "https://whc.unesco.org/en/list/&action=list&format=json";

interface UNESCOSite {
  id_number: number;
  site: string;
  states: string;
  iso_code: string;
  category: string;
  date_inscribed: string;
  latitude: number;
  longitude: number;
  danger: number;
  region: string;
}

const REFERENCE_HERITAGE: Record<string, Array<{ name: string; category: string; danger: boolean }>> = {
  "Jamaica": [
    { name: "Blue and John Crow Mountains", category: "Mixed", danger: false },
  ],
  "Dominican Republic": [
    { name: "Colonial City of Santo Domingo", category: "Cultural", danger: false },
  ],
  "Barbados": [
    { name: "Historic Bridgetown and its Garrison", category: "Cultural", danger: false },
  ],
  "Haiti": [
    { name: "National History Park – Citadel, Sans Souci, Ramiers", category: "Cultural", danger: false },
  ],
  "Cuba": [
    { name: "Old Havana and its Fortification System", category: "Cultural", danger: false },
    { name: "Trinidad and the Valley de los Ingenios", category: "Cultural", danger: false },
    { name: "Desembarco del Granma National Park", category: "Natural", danger: false },
    { name: "Viñales Valley", category: "Cultural", danger: false },
    { name: "Archaeological Landscape of the First Coffee Plantations", category: "Cultural", danger: false },
    { name: "Alejandro de Humboldt National Park", category: "Natural", danger: false },
    { name: "Historic Centre of Camagüey", category: "Cultural", danger: false },
    { name: "Urban Historic Centre of Cienfuegos", category: "Cultural", danger: false },
    { name: "San Pedro de la Roca Castle, Santiago de Cuba", category: "Cultural", danger: false },
  ],
  "Belize": [
    { name: "Belize Barrier Reef Reserve System", category: "Natural", danger: false },
  ],
  "Suriname": [
    { name: "Historic Inner City of Paramaribo", category: "Cultural", danger: false },
    { name: "Central Suriname Nature Reserve", category: "Natural", danger: false },
  ],
  "St. Lucia": [
    { name: "Pitons Management Area", category: "Natural", danger: false },
  ],
  "Dominica": [
    { name: "Morne Trois Pitons National Park", category: "Natural", danger: false },
  ],
  "Antigua & Barbuda": [
    { name: "Antigua Naval Dockyard and Related Archaeological Sites", category: "Cultural", danger: false },
  ],
};

async function tryFetchUNESCO(): Promise<UNESCOSite[] | null> {
  try {
    const data = await fetchJson<UNESCOSite[]>(UNESCO_API, { timeoutMs: 15000 });
    if (Array.isArray(data) && data.length > 0) return data;
    return null;
  } catch {
    return null;
  }
}

function computeHeritageRiskScore(siteCount: number, hasNatural: boolean, hasDanger: boolean): number {
  let score = 10;
  score += Math.min(siteCount * 8, 40);
  if (hasNatural) score += 15;
  if (hasDanger) score += 25;
  return roundTo(clamp(score, 0, 100));
}

export const unescoWhcAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting UNESCO World Heritage ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let usedLiveAPI = false;

    try {
      const liveData = await tryFetchUNESCO();
      if (liveData) {
        log.info(PIPELINE_NAME, `Fetched ${liveData.length} World Heritage sites globally`);
        usedLiveAPI = true;
      }

      const iso3ToCountry: Record<string, string> = {};
      for (const [name, meta] of Object.entries(CARIBBEAN_COUNTRIES)) {
        iso3ToCountry[meta.iso3.toLowerCase()] = name;
      }

      for (const [country] of Object.entries(CARIBBEAN_COUNTRIES)) {
        let sites: Array<{ name: string; category: string; danger: boolean }> = [];

        if (liveData) {
          const countrySites = liveData.filter(s => {
            const codes = s.iso_code?.toLowerCase().split(",").map(c => c.trim()) || [];
            return codes.some(c => iso3ToCountry[c] === country);
          });
          sites = countrySites.map(s => ({
            name: s.site,
            category: s.category,
            danger: s.danger === 1,
          }));
        }

        if (sites.length === 0) {
          sites = REFERENCE_HERITAGE[country] || [];
        }

        recordsRead++;
        const hasNatural = sites.some(s => s.category === "Natural" || s.category === "Mixed");
        const hasDanger = sites.some(s => s.danger);
        const riskScore = computeHeritageRiskScore(sites.length, hasNatural, hasDanger);

        await upsertRegionalData([
          { country, region: "Caribbean", datasetType: "UNESCO World Heritage Sites", value: sites.length, unit: "count", timestamp: new Date() },
          { country, region: "Caribbean", datasetType: "Heritage Risk Score", value: riskScore, unit: "score", timestamp: new Date() },
        ]);

        recordsWritten += 2;
        countriesAffected.push(country);
      }

      const confidence = usedLiveAPI ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;
      await upsertFreshness({ sourceKey: SOURCE_KEY, pipelineName: PIPELINE_NAME, status: "success", confidence, recordsLoaded: recordsRead });
      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME, status: "success", startedAt, completedAt: new Date(),
        recordsRead, recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${countriesAffected.length} countries, ${recordsWritten} data points`);
      return { pipelineName: PIPELINE_NAME, status: "success", recordsRead, recordsWritten, countriesAffected, confidence, summary: { usedLiveAPI } };
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
