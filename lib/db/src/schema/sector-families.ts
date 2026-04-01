import { pgTable, serial, text, real, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

export const sectorFamiliesTable = pgTable("sector_families", {
  id: serial("id").primaryKey(),
  familyKey: text("family_key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  projectTypes: jsonb("project_types").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const methodologyProfilesTable = pgTable("methodology_profiles", {
  id: serial("id").primaryKey(),
  profileKey: text("profile_key").notNull().unique(),
  name: text("name").notNull(),
  sectorFamily: text("sector_family").notNull(),
  version: text("version").notNull().default("V1"),
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  isDefault: boolean("is_default").notNull().default(false),

  countryContextWeight: real("country_context_weight").notNull(),
  projectOverlayWeight: real("project_overlay_weight").notNull(),
  sensitivityWeight: real("sensitivity_weight").notNull(),
  interventionRiskWeight: real("intervention_risk_weight").notNull(),
  outcomeRiskModifier: real("outcome_risk_modifier").notNull().default(0),
  instrumentStructureModifier: real("instrument_structure_modifier").notNull().default(0),
  confidenceInfluence: real("confidence_influence").notNull().default(0.15),

  hazardRelevance: real("hazard_relevance").notNull().default(0.5),
  biodiversityRelevance: real("biodiversity_relevance").notNull().default(0.3),
  governanceRelevance: real("governance_relevance").notNull().default(0.4),
  disasterHistoryRelevance: real("disaster_history_relevance").notNull().default(0.3),
  communityVulnerabilityRelevance: real("community_vulnerability_relevance").notNull().default(0.4),
  outcomeComplexity: real("outcome_complexity").notNull().default(0.5),
  monitoringNeeds: real("monitoring_needs").notNull().default(0.5),

  capitalSuitability: jsonb("capital_suitability"),
  transitionSuitability: jsonb("transition_suitability"),

  rationale: text("rationale"),
  assumptions: text("assumptions"),
  relevantFrameworks: jsonb("relevant_frameworks"),
  knownLimitations: text("known_limitations"),
  validationConfidence: text("validation_confidence").default("provisional"),
  calibrationStatus: text("calibration_status").default("initial"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SectorFamily = typeof sectorFamiliesTable.$inferSelect;
export type MethodologyProfile = typeof methodologyProfilesTable.$inferSelect;
