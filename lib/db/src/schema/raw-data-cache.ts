import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const rawDataCacheTable = pgTable("raw_data_cache", {
  id: serial("id").primaryKey(),
  sourceKey: text("source_key").notNull(),
  sourceUrl: text("source_url").notNull(),
  requestParamsJson: text("request_params_json"),
  responseHash: text("response_hash"),
  payloadJson: text("payload_json"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  statusCode: integer("status_code"),
  notes: text("notes"),
});
