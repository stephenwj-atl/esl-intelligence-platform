import { pgTable, serial, text, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull().default("Jamaica"),
  projectType: text("project_type").notNull(),
  projectCategory: text("project_category"),
  interventionType: text("intervention_type"),
  capitalMode: text("capital_mode"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  investmentAmount: real("investment_amount").notNull().default(0),
  floodRisk: real("flood_risk").notNull(),
  coastalExposure: real("coastal_exposure").notNull(),
  contaminationRisk: real("contamination_risk").notNull(),
  regulatoryComplexity: real("regulatory_complexity").notNull(),
  communitySensitivity: real("community_sensitivity").notNull(),
  waterStress: real("water_stress").notNull(),
  hasLabData: boolean("has_lab_data").notNull().default(false),
  hasMonitoringData: boolean("has_monitoring_data").notNull().default(false),
  isIFCAligned: boolean("is_ifc_aligned").notNull().default(false),
  hasSEA: boolean("has_sea").notNull().default(false),
  hasESIA: boolean("has_esia").notNull().default(false),
  environmentalRisk: real("environmental_risk").notNull(),
  infrastructureRisk: real("infrastructure_risk").notNull(),
  humanExposureRisk: real("human_exposure_risk").notNull(),
  regulatoryRisk: real("regulatory_risk").notNull(),
  dataConfidence: real("data_confidence").notNull(),
  overallRisk: real("overall_risk").notNull(),
  persScore: real("pers_score"),
  interventionRiskScore: real("intervention_risk_score"),
  monitoringIntensity: text("monitoring_intensity"),
  lenderFramework: text("lender_framework"),
  delayRiskPercent: real("delay_risk_percent").notNull(),
  costOverrunPercent: real("cost_overrun_percent").notNull(),
  covenantBreachPercent: real("covenant_breach_percent").notNull(),
  reputationalRisk: text("reputational_risk").notNull(),
  decisionOutcome: text("decision_outcome").notNull(),
  decisionConditions: jsonb("decision_conditions"),
  decisionInsight: text("decision_insight").notNull(),
  persBreakdown: jsonb("pers_breakdown"),
  interventionRiskProfile: jsonb("intervention_risk_profile"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
