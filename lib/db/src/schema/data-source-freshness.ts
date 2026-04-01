import { pgTable, serial, text, timestamp, real, integer } from "drizzle-orm/pg-core";

export const dataSourceFreshnessTable = pgTable("data_source_freshness", {
  id: serial("id").primaryKey(),
  sourceKey: text("source_key").notNull().unique(),
  pipelineName: text("pipeline_name").notNull(),
  lastSuccessAt: timestamp("last_success_at"),
  lastAttemptAt: timestamp("last_attempt_at"),
  status: text("status").notNull().default("pending"),
  confidence: real("confidence").notNull().default(0),
  recordsLoaded: integer("records_loaded").notNull().default(0),
  errorMessage: text("error_message"),
  metadataJson: text("metadata_json"),
  ingestionMode: text("ingestion_mode").notNull().default("curated"),
});
