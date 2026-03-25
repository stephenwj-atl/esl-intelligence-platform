import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";

export const regionalDataTable = pgTable("regional_data", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  datasetType: text("dataset_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull().default("score"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
