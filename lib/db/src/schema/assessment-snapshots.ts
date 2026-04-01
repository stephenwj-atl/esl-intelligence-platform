import { pgTable, serial, text, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const assessmentSnapshotsTable = pgTable("assessment_snapshots", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  profileUsed: text("profile_used").notNull(),
  instrumentType: text("instrument_type").notNull(),
  funderFramework: text("funder_framework"),

  countryContextScore: real("country_context_score"),
  projectExposureScore: real("project_exposure_score"),
  sectorSensitivityScore: real("sector_sensitivity_score"),
  interventionDeliveryScore: real("intervention_delivery_score"),
  instrumentStructureScore: real("instrument_structure_score"),
  outcomeDeliveryScore: real("outcome_delivery_score"),
  confidenceScore: real("confidence_score"),
  persBaseScore: real("pers_base_score"),
  persFinalScore: real("pers_final_score"),

  decisionSignal: text("decision_signal"),
  capitalMode: text("capital_mode"),
  monitoringIntensity: text("monitoring_intensity"),
  disbursementReadiness: text("disbursement_readiness"),
  transitionReadiness: text("transition_readiness"),
  blendedLabel: text("blended_label"),

  conditions: jsonb("conditions"),
  controls: jsonb("controls"),
  reasoning: jsonb("reasoning"),
  explainability: jsonb("explainability"),
  fullBreakdown: jsonb("full_breakdown"),

  generatedBy: text("generated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profileComparisonRunsTable = pgTable("profile_comparison_runs", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  selectedProfiles: jsonb("selected_profiles").notNull(),
  instrumentOverride: text("instrument_override"),
  funderOverride: text("funder_override"),
  results: jsonb("results").notNull(),
  generatedBy: text("generated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const methodologyProfileChangesTable = pgTable("methodology_profile_changes", {
  id: serial("id").primaryKey(),
  profileKey: text("profile_key").notNull(),
  fieldChanged: text("field_changed").notNull(),
  originalValue: real("original_value"),
  newValue: real("new_value"),
  delta: real("delta"),
  changeReason: text("change_reason").notNull(),
  reviewer: text("reviewer").notNull(),
  reviewStatus: text("review_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const funderFrameworksTable = pgTable("funder_frameworks", {
  id: serial("id").primaryKey(),
  frameworkKey: text("framework_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  instrumentRelevance: jsonb("instrument_relevance"),
  safeguardEmphasis: jsonb("safeguard_emphasis"),
  reportingStyle: text("reporting_style"),
  baselineExpectations: text("baseline_expectations"),
  disbursementControls: text("disbursement_controls"),
  resultsFrameworkEmphasis: text("results_framework_emphasis"),
  permissibilityCues: jsonb("permissibility_cues"),
  typicalConditions: jsonb("typical_conditions"),
  categoryMapping: text("category_mapping"),
  notes: text("notes"),
  limitations: text("limitations"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AssessmentSnapshot = typeof assessmentSnapshotsTable.$inferSelect;
export type ProfileComparisonRun = typeof profileComparisonRunsTable.$inferSelect;
export type MethodologyProfileChange = typeof methodologyProfileChangesTable.$inferSelect;
export type FunderFramework = typeof funderFrameworksTable.$inferSelect;
