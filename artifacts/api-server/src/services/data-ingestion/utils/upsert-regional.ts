import { db, regionalDataTable } from "@workspace/db";
import { sql } from "drizzle-orm";

type RegionalRecord = typeof regionalDataTable.$inferInsert;

export async function upsertRegionalData(records: RegionalRecord | RegionalRecord[]): Promise<void> {
  const rows = Array.isArray(records) ? records : [records];
  if (rows.length === 0) return;

  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db.insert(regionalDataTable).values(batch).onConflictDoUpdate({
      target: [regionalDataTable.country, regionalDataTable.region, regionalDataTable.datasetType],
      set: {
        value: sql`excluded.value`,
        unit: sql`excluded.unit`,
        timestamp: sql`now()`,
      },
    });
  }
}
