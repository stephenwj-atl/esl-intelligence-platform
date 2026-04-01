import { pgTable, serial, text, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const projectOutcomesTable = pgTable("project_outcomes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  theoryOfChange: text("theory_of_change"),
  outputsSummary: text("outputs_summary"),
  outcomesSummary: text("outcomes_summary"),
  reportingCycle: text("reporting_cycle").default("quarterly"),
  outcomeDeliveryRiskScore: real("outcome_delivery_risk_score"),
  outcomeConfidenceScore: real("outcome_confidence_score"),
  disbursementReadinessScore: real("disbursement_readiness_score"),
  implementationCapacityScore: real("implementation_capacity_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const outcomeMetricsTable = pgTable("outcome_metrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  metricKey: text("metric_key").notNull(),
  metricName: text("metric_name").notNull(),
  category: text("category").notNull(),
  targetValue: real("target_value"),
  currentValue: real("current_value"),
  unit: text("unit").notNull(),
  verificationMethod: text("verification_method"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const disbursementMilestonesTable = pgTable("disbursement_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  milestoneName: text("milestone_name").notNull(),
  milestoneType: text("milestone_type").notNull(),
  requiredEvidence: text("required_evidence"),
  currentStatus: text("current_status").notNull().default("pending"),
  gatingEffect: text("gating_effect"),
  linkedInstrument: text("linked_instrument"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  sequenceOrder: integer("sequence_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transitionPathwaysTable = pgTable("transition_pathways", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  fromInstrument: text("from_instrument").notNull(),
  toInstrument: text("to_instrument").notNull(),
  transitionTrigger: text("transition_trigger"),
  validationCriteria: text("validation_criteria"),
  timeHorizon: text("time_horizon"),
  requiredConditions: jsonb("required_conditions"),
  confidenceThreshold: real("confidence_threshold"),
  responsibleReviewer: text("responsible_reviewer"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProjectOutcome = typeof projectOutcomesTable.$inferSelect;
export type OutcomeMetric = typeof outcomeMetricsTable.$inferSelect;
export type DisbursementMilestone = typeof disbursementMilestonesTable.$inferSelect;
export type TransitionPathway = typeof transitionPathwaysTable.$inferSelect;
