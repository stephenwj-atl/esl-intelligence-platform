import { pgTable, serial, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull().default("Jamaica"),
  projectType: text("project_type").notNull(),
  floodRisk: real("flood_risk").notNull(),
  coastalExposure: real("coastal_exposure").notNull(),
  contaminationRisk: real("contamination_risk").notNull(),
  regulatoryComplexity: real("regulatory_complexity").notNull(),
  communitySensitivity: real("community_sensitivity").notNull(),
  waterStress: real("water_stress").notNull(),
  hasLabData: boolean("has_lab_data").notNull().default(false),
  hasMonitoringData: boolean("has_monitoring_data").notNull().default(false),
  isIFCAligned: boolean("is_ifc_aligned").notNull().default(false),
  environmentalRisk: real("environmental_risk").notNull(),
  infrastructureRisk: real("infrastructure_risk").notNull(),
  humanExposureRisk: real("human_exposure_risk").notNull(),
  regulatoryRisk: real("regulatory_risk").notNull(),
  dataConfidence: real("data_confidence").notNull(),
  overallRisk: real("overall_risk").notNull(),
  delayRiskPercent: real("delay_risk_percent").notNull(),
  costOverrunPercent: real("cost_overrun_percent").notNull(),
  covenantBreachPercent: real("covenant_breach_percent").notNull(),
  reputationalRisk: text("reputational_risk").notNull(),
  decisionOutcome: text("decision_outcome").notNull(),
  decisionConditions: jsonb("decision_conditions").$type<string[]>(),
  decisionInsight: text("decision_insight").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
