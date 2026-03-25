import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { portfoliosTable } from "./portfolios";
import { projectsTable } from "./projects";

export const portfolioProjectsTable = pgTable("portfolio_projects", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfoliosTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  investmentAmount: real("investment_amount").notNull(),
  stage: text("stage").notNull().default("Early"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPortfolioProjectSchema = createInsertSchema(portfolioProjectsTable).omit({ id: true, createdAt: true });
export type InsertPortfolioProject = z.infer<typeof insertPortfolioProjectSchema>;
export type PortfolioProject = typeof portfolioProjectsTable.$inferSelect;
