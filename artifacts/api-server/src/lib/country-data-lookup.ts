import { db, regionalDataTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

export interface CountryPERSInputs {
  governanceScore: number | undefined;
  disasterLossHistory: number | undefined;
  informRiskScore: number | undefined;
  provenance: SensitivityProvenance;
}

export interface SensitivityProvenance {
  governance: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
  disasterHistory: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
  informRisk: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
}

const DATASET_KEYS = {
  governance: "Governance Quality Index",
  disasterFrequency: "EM-DAT Disaster Frequency Score",
  informRisk: "INFORM Risk Score",
} as const;

export async function lookupCountryPERSInputs(country: string): Promise<CountryPERSInputs> {
  const now = new Date().toISOString();

  const rows = await db.select({
    datasetType: regionalDataTable.datasetType,
    value: regionalDataTable.value,
    timestamp: regionalDataTable.timestamp,
  }).from(regionalDataTable).where(
    and(
      eq(regionalDataTable.country, country),
      inArray(regionalDataTable.datasetType, [
        DATASET_KEYS.governance,
        DATASET_KEYS.disasterFrequency,
        DATASET_KEYS.informRisk,
      ]),
    ),
  );

  const lookup = new Map<string, { value: number; timestamp: Date }>();
  for (const row of rows) {
    lookup.set(row.datasetType, { value: row.value, timestamp: row.timestamp });
  }

  const govRow = lookup.get(DATASET_KEYS.governance);
  const disasterRow = lookup.get(DATASET_KEYS.disasterFrequency);
  const informRow = lookup.get(DATASET_KEYS.informRisk);

  return {
    governanceScore: govRow?.value,
    disasterLossHistory: disasterRow?.value,
    informRiskScore: informRow?.value,
    provenance: {
      governance: {
        source: govRow ? "transparency-cpi" : "fallback",
        datasetKey: DATASET_KEYS.governance,
        value: govRow?.value ?? null,
        fallback: !govRow,
        timestamp: govRow?.timestamp.toISOString() ?? now,
      },
      disasterHistory: {
        source: disasterRow ? "em-dat" : "fallback",
        datasetKey: DATASET_KEYS.disasterFrequency,
        value: disasterRow?.value ?? null,
        fallback: !disasterRow,
        timestamp: disasterRow?.timestamp.toISOString() ?? now,
      },
      informRisk: {
        source: informRow ? "inform-risk" : "fallback",
        datasetKey: DATASET_KEYS.informRisk,
        value: informRow?.value ?? null,
        fallback: !informRow,
        timestamp: informRow?.timestamp.toISOString() ?? now,
      },
    },
  };
}
