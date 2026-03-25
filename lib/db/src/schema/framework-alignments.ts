import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const frameworkAlignmentsTable = pgTable("framework_alignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  framework: text("framework").notNull(),
  standard: text("standard").notNull(),
  status: text("status").notNull(),
  gap: text("gap"),
  severity: text("severity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FrameworkAlignment = typeof frameworkAlignmentsTable.$inferSelect;
