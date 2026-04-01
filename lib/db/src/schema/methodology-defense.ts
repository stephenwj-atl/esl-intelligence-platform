import { pgTable, serial, text, real, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const methodologyEvidenceTable = pgTable("methodology_evidence", {
  id: serial("id").primaryKey(),
  profileKey: text("profile_key").notNull(),
  evidenceType: text("evidence_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sourceReference: text("source_reference"),
  relevantFrameworks: jsonb("relevant_frameworks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const calibrationMemosTable = pgTable("calibration_memos", {
  id: serial("id").primaryKey(),
  memoType: text("memo_type").notNull(),
  title: text("title").notNull(),
  profileKey: text("profile_key"),
  sectorFamily: text("sector_family"),
  country: text("country"),
  funder: text("funder"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  content: jsonb("content").notNull(),
  status: text("status").notNull().default("draft"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const validationCasesTable = pgTable("validation_cases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  caseType: text("case_type").notNull(),
  predictedRisk: real("predicted_risk"),
  observedRisk: real("observed_risk"),
  predictedOutcome: text("predicted_outcome"),
  observedOutcome: text("observed_outcome"),
  sectorFamily: text("sector_family"),
  profileUsed: text("profile_used"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const validationObservationsTable = pgTable("validation_observations", {
  id: serial("id").primaryKey(),
  validationCaseId: integer("validation_case_id").references(() => validationCasesTable.id, { onDelete: "cascade" }),
  observationType: text("observation_type").notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const overrideDecisionsTable = pgTable("override_decisions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  overrideType: text("override_type").notNull(),
  originalValue: text("original_value").notNull(),
  overriddenValue: text("overridden_value").notNull(),
  reason: text("reason").notNull(),
  reviewer: text("reviewer").notNull(),
  mitigationRationale: text("mitigation_rationale"),
  provedCorrect: text("proved_correct"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MethodologyEvidence = typeof methodologyEvidenceTable.$inferSelect;
export type CalibrationMemo = typeof calibrationMemosTable.$inferSelect;
export type ValidationCase = typeof validationCasesTable.$inferSelect;
export type ValidationObservation = typeof validationObservationsTable.$inferSelect;
export type OverrideDecision = typeof overrideDecisionsTable.$inferSelect;
