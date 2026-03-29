import { Router, type IRouter } from "express";
import { db, dataLayersTable, projectDataLayersTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/data-layers", async (req, res) => {
  const country = req.query.country as string | undefined;
  let layers;
  if (country) {
    layers = await db.select().from(dataLayersTable).where(eq(dataLayersTable.country, country));
  } else {
    layers = await db.select().from(dataLayersTable);
  }
  res.json(layers);
});

router.get("/data-layers/country/:country/profile", async (req, res) => {
  const country = req.params.country;
  const layers = await db.select().from(dataLayersTable).where(eq(dataLayersTable.country, country));

  const total = layers.length;
  const good = layers.filter(l => l.quality === "Good").length;
  const partial = layers.filter(l => l.quality === "Partial").length;
  const proxy = layers.filter(l => l.quality === "Proxy").length;
  const missing = layers.filter(l => l.quality === "Missing").length;

  const categories = [...new Set(layers.map(l => l.category))];
  const byCategory = categories.map(cat => {
    const catLayers = layers.filter(l => l.category === cat);
    return {
      category: cat,
      total: catLayers.length,
      good: catLayers.filter(l => l.quality === "Good").length,
      partial: catLayers.filter(l => l.quality === "Partial").length,
      proxy: catLayers.filter(l => l.quality === "Proxy").length,
      missing: catLayers.filter(l => l.quality === "Missing").length,
    };
  });

  const maxConfidence = total > 0 ? ((good + partial * 0.5 + proxy * 0.25) / total) * 100 : 0;

  res.json({
    country,
    totalLayers: total,
    good,
    partial,
    proxy,
    missing,
    dataReadiness: Math.round(maxConfidence),
    byCategory,
    layers,
  });
});

router.get("/projects/:id/data-layers", async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const countryLayers = await db.select().from(dataLayersTable).where(eq(dataLayersTable.country, project.country));
  const projectOverrides = await db.select().from(projectDataLayersTable).where(eq(projectDataLayersTable.projectId, projectId));

  const overrideMap = new Map(projectOverrides.map(o => [o.dataLayerId, o]));

  const merged = countryLayers.map(layer => {
    const override = overrideMap.get(layer.id);
    return {
      ...layer,
      effectiveQuality: override?.overrideQuality || layer.quality,
      projectStatus: override?.status || "Inherited",
      projectNotes: override?.notes || null,
      verifiedAt: override?.verifiedAt?.toISOString() || null,
    };
  });

  const total = merged.length;
  const good = merged.filter(l => l.effectiveQuality === "Good").length;
  const partial = merged.filter(l => l.effectiveQuality === "Partial").length;
  const proxy = merged.filter(l => l.effectiveQuality === "Proxy").length;
  const missing = merged.filter(l => l.effectiveQuality === "Missing").length;

  const categories = [...new Set(merged.map(l => l.category))];
  const byCategory = categories.map(cat => {
    const catLayers = merged.filter(l => l.category === cat);
    return {
      category: cat,
      total: catLayers.length,
      good: catLayers.filter(l => l.effectiveQuality === "Good").length,
      partial: catLayers.filter(l => l.effectiveQuality === "Partial").length,
      proxy: catLayers.filter(l => l.effectiveQuality === "Proxy").length,
      missing: catLayers.filter(l => l.effectiveQuality === "Missing").length,
    };
  });

  const dataReadiness = total > 0 ? Math.round(((good + partial * 0.5 + proxy * 0.25) / total) * 100) : 0;

  res.json({
    projectId,
    country: project.country,
    totalLayers: total,
    good,
    partial,
    proxy,
    missing,
    dataReadiness,
    byCategory,
    layers: merged,
  });
});

export default router;
