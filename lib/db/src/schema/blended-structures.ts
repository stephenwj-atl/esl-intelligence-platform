import { pgTable, serial, integer, real, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const blendedStructuresTable = pgTable("blended_structures", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  grantComponent: real("grant_component").notNull().default(0),
  loanComponent: real("loan_component").notNull().default(0),
  concessionalityLevel: text("concessionality_level").notNull().default("STANDARD"),
  firstLossPercent: real("first_loss_percent").notNull().default(0),
  crowdInRatio: real("crowd_in_ratio").notNull().default(1.0),
  viabilityThreshold: real("viability_threshold").notNull().default(60),
  timeline: jsonb("timeline").$type<{ phase: string; duration: string; milestone: string }[]>(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export type BlendedStructure = typeof blendedStructuresTable.$inferSelect;
