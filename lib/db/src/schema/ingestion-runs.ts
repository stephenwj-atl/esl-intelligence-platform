import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const ingestionRunsTable = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  pipelineName: text("pipeline_name").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("running"),
  recordsRead: integer("records_read").notNull().default(0),
  recordsWritten: integer("records_written").notNull().default(0),
  countriesAffected: text("countries_affected"),
  summaryJson: text("summary_json"),
  errorJson: text("error_json"),
});
