import { pgTable, serial, text, real, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const dataLayersTable = pgTable("data_layers", {
  id: serial("id").primaryKey(),
  layerId: text("layer_id").notNull(),
  layerName: text("layer_name").notNull(),
  category: text("category").notNull(),
  country: text("country").notNull(),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  format: text("format"),
  resolution: text("resolution"),
  coverageArea: text("coverage_area"),
  accessMethod: text("access_method"),
  quality: text("quality").notNull(),
  notes: text("notes"),
  riskDomain: text("risk_domain"),
  confidenceWeight: real("confidence_weight").notNull().default(1),
}, (table) => [
  unique("uq_data_layers_country_layer").on(table.country, table.layerId),
]);

export const projectDataLayersTable = pgTable("project_data_layers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  dataLayerId: integer("data_layer_id").notNull().references(() => dataLayersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("Inherited"),
  overrideQuality: text("override_quality"),
  notes: text("notes"),
  verifiedAt: timestamp("verified_at"),
}, (table) => [
  unique("uq_project_data_layers_project_layer").on(table.projectId, table.dataLayerId),
]);
