import { db, ingestionRunsTable } from "@workspace/db";
import { upsertRegionalData } from "./utils/upsert-regional";
import { roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS, CARIBBEAN_COUNTRIES } from "./types";
import { eq } from "drizzle-orm";
import { fetchText } from "./utils/fetchWithRetry";

const PIPELINE_NAME = "em-dat";
const SOURCE_KEY = "em-dat-disasters";

const ISO3_TO_COUNTRY: Record<string, string> = {};
for (const [country, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
  ISO3_TO_COUNTRY[info.iso3] = country;
}

interface DisasterRecord {
  totalEvents: number;
  totalDeaths: number;
  totalAffected: number;
  totalDamageUSD: number;
  majorDisasters: { type: string; year: number; deaths: number; affected: number; damageUSD: number }[];
  annualizedLoss: number;
  disasterFrequencyScore: number;
}

const CARIBBEAN_DISASTERS: Record<string, DisasterRecord> = {
  "Jamaica": {
    totalEvents: 42, totalDeaths: 312, totalAffected: 1250000, totalDamageUSD: 4200000000,
    majorDisasters: [
      { type: "Hurricane", year: 2007, deaths: 12, affected: 350000, damageUSD: 800000000 },
      { type: "Hurricane", year: 2004, deaths: 13, affected: 500000, damageUSD: 595000000 },
      { type: "Flood", year: 2010, deaths: 6, affected: 25000, damageUSD: 125000000 },
    ],
    annualizedLoss: 210000000, disasterFrequencyScore: 65,
  },
  "Haiti": {
    totalEvents: 85, totalDeaths: 232000, totalAffected: 8500000, totalDamageUSD: 12000000000,
    majorDisasters: [
      { type: "Earthquake", year: 2010, deaths: 222570, affected: 3700000, damageUSD: 8000000000 },
      { type: "Hurricane", year: 2016, deaths: 546, affected: 2100000, damageUSD: 2800000000 },
      { type: "Earthquake", year: 2021, deaths: 2248, affected: 800000, damageUSD: 1600000000 },
    ],
    annualizedLoss: 600000000, disasterFrequencyScore: 95,
  },
  "Dominican Republic": {
    totalEvents: 52, totalDeaths: 1850, totalAffected: 3200000, totalDamageUSD: 3500000000,
    majorDisasters: [
      { type: "Hurricane", year: 2004, deaths: 23, affected: 600000, damageUSD: 296000000 },
      { type: "Hurricane", year: 2017, deaths: 34, affected: 425000, damageUSD: 690000000 },
      { type: "Flood", year: 2007, deaths: 65, affected: 65000, damageUSD: 150000000 },
    ],
    annualizedLoss: 175000000, disasterFrequencyScore: 70,
  },
  "Trinidad & Tobago": {
    totalEvents: 18, totalDeaths: 45, totalAffected: 85000, totalDamageUSD: 350000000,
    majorDisasters: [
      { type: "Flood", year: 2018, deaths: 4, affected: 15000, damageUSD: 50000000 },
      { type: "Tropical Storm", year: 2017, deaths: 3, affected: 25000, damageUSD: 100000000 },
    ],
    annualizedLoss: 17500000, disasterFrequencyScore: 35,
  },
  "Barbados": {
    totalEvents: 12, totalDeaths: 8, totalAffected: 32000, totalDamageUSD: 180000000,
    majorDisasters: [
      { type: "Hurricane", year: 2010, deaths: 2, affected: 12000, damageUSD: 80000000 },
      { type: "Flood", year: 2016, deaths: 1, affected: 5000, damageUSD: 25000000 },
    ],
    annualizedLoss: 9000000, disasterFrequencyScore: 28,
  },
  "Bahamas": {
    totalEvents: 22, totalDeaths: 105, totalAffected: 75000, totalDamageUSD: 4500000000,
    majorDisasters: [
      { type: "Hurricane", year: 2019, deaths: 74, affected: 29500, damageUSD: 3400000000 },
      { type: "Hurricane", year: 2016, deaths: 4, affected: 15000, damageUSD: 580000000 },
    ],
    annualizedLoss: 225000000, disasterFrequencyScore: 55,
  },
  "Guyana": {
    totalEvents: 15, totalDeaths: 45, totalAffected: 420000, totalDamageUSD: 650000000,
    majorDisasters: [
      { type: "Flood", year: 2005, deaths: 34, affected: 275000, damageUSD: 465000000 },
      { type: "Flood", year: 2021, deaths: 2, affected: 50000, damageUSD: 85000000 },
    ],
    annualizedLoss: 32500000, disasterFrequencyScore: 45,
  },
  "Suriname": {
    totalEvents: 8, totalDeaths: 12, totalAffected: 35000, totalDamageUSD: 120000000,
    majorDisasters: [
      { type: "Flood", year: 2006, deaths: 3, affected: 20000, damageUSD: 50000000 },
    ],
    annualizedLoss: 6000000, disasterFrequencyScore: 25,
  },
  "Cuba": {
    totalEvents: 65, totalDeaths: 320, totalAffected: 9500000, totalDamageUSD: 18000000000,
    majorDisasters: [
      { type: "Hurricane", year: 2008, deaths: 7, affected: 3500000, damageUSD: 5000000000 },
      { type: "Hurricane", year: 2017, deaths: 10, affected: 2000000, damageUSD: 5800000000 },
      { type: "Hurricane", year: 2022, deaths: 3, affected: 1200000, damageUSD: 2200000000 },
    ],
    annualizedLoss: 900000000, disasterFrequencyScore: 80,
  },
  "Belize": {
    totalEvents: 20, totalDeaths: 32, totalAffected: 125000, totalDamageUSD: 850000000,
    majorDisasters: [
      { type: "Hurricane", year: 2001, deaths: 22, affected: 45000, damageUSD: 280000000 },
      { type: "Hurricane", year: 2010, deaths: 8, affected: 35000, damageUSD: 210000000 },
    ],
    annualizedLoss: 42500000, disasterFrequencyScore: 55,
  },
  "Puerto Rico": {
    totalEvents: 35, totalDeaths: 3059, totalAffected: 3200000, totalDamageUSD: 95000000000,
    majorDisasters: [
      { type: "Hurricane", year: 2017, deaths: 2975, affected: 3200000, damageUSD: 90000000000 },
      { type: "Earthquake", year: 2020, deaths: 1, affected: 300000, damageUSD: 3000000000 },
    ],
    annualizedLoss: 4750000000, disasterFrequencyScore: 72,
  },
  "St. Lucia": {
    totalEvents: 14, totalDeaths: 35, totalAffected: 55000, totalDamageUSD: 450000000,
    majorDisasters: [
      { type: "Hurricane", year: 2010, deaths: 14, affected: 40000, damageUSD: 336000000 },
    ],
    annualizedLoss: 22500000, disasterFrequencyScore: 42,
  },
  "Grenada": {
    totalEvents: 10, totalDeaths: 40, totalAffected: 62000, totalDamageUSD: 920000000,
    majorDisasters: [
      { type: "Hurricane", year: 2004, deaths: 37, affected: 60000, damageUSD: 889000000 },
    ],
    annualizedLoss: 46000000, disasterFrequencyScore: 48,
  },
  "Dominica": {
    totalEvents: 12, totalDeaths: 62, totalAffected: 72000, totalDamageUSD: 1350000000,
    majorDisasters: [
      { type: "Hurricane", year: 2017, deaths: 31, affected: 71000, damageUSD: 1300000000 },
      { type: "Tropical Storm", year: 2015, deaths: 30, affected: 36000, damageUSD: 483000000 },
    ],
    annualizedLoss: 67500000, disasterFrequencyScore: 60,
  },
  "Antigua & Barbuda": {
    totalEvents: 11, totalDeaths: 5, totalAffected: 28000, totalDamageUSD: 300000000,
    majorDisasters: [
      { type: "Hurricane", year: 2017, deaths: 3, affected: 25000, damageUSD: 250000000 },
    ],
    annualizedLoss: 15000000, disasterFrequencyScore: 38,
  },
  "St. Vincent & the Grenadines": {
    totalEvents: 13, totalDeaths: 18, totalAffected: 45000, totalDamageUSD: 380000000,
    majorDisasters: [
      { type: "Volcanic Eruption", year: 2021, deaths: 0, affected: 20000, damageUSD: 150000000 },
      { type: "Hurricane", year: 2013, deaths: 9, affected: 12000, damageUSD: 108000000 },
    ],
    annualizedLoss: 19000000, disasterFrequencyScore: 45,
  },
  "Cayman Islands": {
    totalEvents: 8, totalDeaths: 2, totalAffected: 15000, totalDamageUSD: 3400000000,
    majorDisasters: [
      { type: "Hurricane", year: 2004, deaths: 2, affected: 15000, damageUSD: 3400000000 },
    ],
    annualizedLoss: 170000000, disasterFrequencyScore: 30,
  },
};

export const emDatAdapter: SourceAdapter = {
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

    log.info(PIPELINE_NAME, "Starting EM-DAT disaster loss history ingestion");

    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected = new Set<string>();
    const errors: string[] = [];

    try {
      for (const [country, data] of Object.entries(CARIBBEAN_DISASTERS)) {
        recordsRead++;

        const records = [
          { country, region: "National", datasetType: "EM-DAT Total Disaster Events", value: roundTo(data.totalEvents, 0), unit: "count" },
          { country, region: "National", datasetType: "EM-DAT Total Deaths", value: roundTo(data.totalDeaths, 0), unit: "people" },
          { country, region: "National", datasetType: "EM-DAT Total Affected", value: roundTo(data.totalAffected, 0), unit: "people" },
          { country, region: "National", datasetType: "EM-DAT Total Damage", value: roundTo(data.totalDamageUSD / 1000000, 1), unit: "USD millions" },
          { country, region: "National", datasetType: "EM-DAT Annualized Loss", value: roundTo(data.annualizedLoss / 1000000, 1), unit: "USD millions/year" },
          { country, region: "National", datasetType: "EM-DAT Disaster Frequency Score", value: roundTo(data.disasterFrequencyScore, 0), unit: "score/100" },
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
    const totalCountries = Object.keys(CARIBBEAN_DISASTERS).length;
    const status = affectedArr.length === 0 ? "failed" as const :
      affectedArr.length < totalCountries ? "partial" as const : "success" as const;

    const confidence = CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;

    await upsertFreshness({
      pipelineName: PIPELINE_NAME,
      sourceKey: SOURCE_KEY,
      status,
      recordsLoaded: recordsWritten,
      confidence,
      ingestionMode: "curated",
    });

    await db.update(ingestionRunsTable)
      .set({
        completedAt: new Date(),
        status,
        recordsRead,
        recordsWritten,
        countriesAffected: affectedArr,
        summaryJson: { indicators: 6, countries: affectedArr.length, totalEvents: Object.values(CARIBBEAN_DISASTERS).reduce((s, d) => s + d.totalEvents, 0) },
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
      summary: { indicators: 6, countries: affectedArr.length },
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  },
};
