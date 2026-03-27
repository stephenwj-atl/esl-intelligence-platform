import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const outcomesTable = pgTable("outcomes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  targetValue: real("target_value").notNull().default(0),
  achievedValue: real("achieved_value").notNull().default(0),
  unit: text("unit").notNull().default("units"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Outcome = typeof outcomesTable.$inferSelect;
