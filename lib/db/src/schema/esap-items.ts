import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const esapItemsTable = pgTable("esap_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  owner: text("owner").notNull(),
  deadline: text("deadline").notNull(),
  status: text("status").notNull().default("Not Started"),
  evidence: text("evidence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EsapItem = typeof esapItemsTable.$inferSelect;
