import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const riskHistoryTable = pgTable("risk_history", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  overallRisk: real("overall_risk").notNull(),
  dataConfidence: real("data_confidence").notNull(),
  month: integer("month").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertRiskHistorySchema = createInsertSchema(riskHistoryTable).omit({ id: true, recordedAt: true });
export type InsertRiskHistory = z.infer<typeof insertRiskHistorySchema>;
export type RiskHistory = typeof riskHistoryTable.$inferSelect;
