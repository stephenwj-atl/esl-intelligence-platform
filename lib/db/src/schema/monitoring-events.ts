import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const monitoringEventsTable = pgTable("monitoring_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  result: text("result").notNull(),
  status: text("status").notNull().default("Verified"),
  findings: text("findings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MonitoringEvent = typeof monitoringEventsTable.$inferSelect;
