import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const regionalIndicesTable = pgTable("regional_indices", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  riskScore: real("risk_score").notNull(),
  infrastructureScore: real("infrastructure_score").notNull(),
  waterStressScore: real("water_stress_score").notNull(),
  confidence: real("confidence").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
