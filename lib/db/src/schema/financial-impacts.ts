import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const financialImpactsTable = pgTable("financial_impacts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  baseRate: real("base_rate").notNull().default(8.0),
  rateAdjustment: real("rate_adjustment").notNull().default(0),
  confidencePenalty: real("confidence_penalty").notNull().default(0),
  finalRate: real("final_rate").notNull().default(8.0),
  basePremium: real("base_premium").notNull().default(0),
  adjustedPremium: real("adjusted_premium").notNull().default(0),
  premiumIncrease: real("premium_increase").notNull().default(0),
  covenantLevel: text("covenant_level").notNull().default("LOW"),
  capitalBreachPercent: real("capital_breach_percent").notNull().default(0),
  totalLifetimeImpact: real("total_lifetime_impact").notNull().default(0),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export type FinancialImpact = typeof financialImpactsTable.$inferSelect;
