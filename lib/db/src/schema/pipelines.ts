import { pgTable, serial, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { portfoliosTable } from "./portfolios";

export const pipelinesTable = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  orgType: text("org_type").notNull().default("DFI"),
  frameworks: jsonb("frameworks").$type<string[]>().notNull().default([]),
  thresholds: jsonb("thresholds").$type<{
    maxRisk?: number;
    minConfidence?: number;
    requiredFrameworks?: string[];
  }>().notNull().default({}),
  capitalModeDefault: text("capital_mode_default").notNull().default("Blended"),
  capitalConstraints: jsonb("capital_constraints").$type<{
    totalEnvelope?: number;
    maxSingleProject?: number;
    minGrantPercent?: number;
    maxGrantPercent?: number;
  }>().notNull().default({}),
  status: text("status").notNull().default("open"),
  portfolioId: integer("portfolio_id").references(() => portfoliosTable.id, { onDelete: "set null" }),
  projectCount: integer("project_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPipelineSchema = createInsertSchema(pipelinesTable).omit({ id: true, createdAt: true, projectCount: true });
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Pipeline = typeof pipelinesTable.$inferSelect;
