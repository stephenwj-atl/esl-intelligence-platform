import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const sectorBenchmarksTable = pgTable("sector_benchmarks", {
  id: serial("id").primaryKey(),
  sector: text("sector").notNull(),
  metric: text("metric").notNull(),
  avgRisk: real("avg_risk").notNull(),
  avgConfidence: real("avg_confidence").notNull(),
  sampleSize: integer("sample_size").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
