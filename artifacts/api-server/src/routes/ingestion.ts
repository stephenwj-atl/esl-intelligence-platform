import { Router, type IRouter } from "express";
import { runPipeline, runAllPipelines, adapters } from "../services/data-ingestion";
import { getScheduleStatus, checkStalePipelines, getStalePipelineNames } from "../services/data-ingestion/scheduler";
import { computeCountryScores, writeScoresToDB } from "../services/data-ingestion/scoring";
import { db, dataSourceFreshnessTable, ingestionRunsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.post("/ingestion/run", requireAdmin, async (req, res) => {
  const { pipeline } = req.body;

  if (!pipeline || typeof pipeline !== "string") {
    res.status(400).json({ error: "pipeline name is required", available: Object.keys(adapters) });
    return;
  }

  try {
    const result = await runPipeline(pipeline);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/ingestion/run-all", requireAdmin, async (_req, res) => {
  try {
    const result = await runAllPipelines();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/ingestion/status", async (_req, res) => {
  const freshness = await db.select().from(dataSourceFreshnessTable);
  const recentRuns = await db.select().from(ingestionRunsTable).orderBy(desc(ingestionRunsTable.startedAt)).limit(20);
  const schedule = await getScheduleStatus();

  res.json({
    sources: freshness,
    recentRuns,
    schedule,
    availablePipelines: Object.keys(adapters),
  });
});

router.get("/ingestion/freshness", async (_req, res) => {
  const staleResults = await checkStalePipelines();
  const staleNames = staleResults.filter(r => r.isStale).map(r => r.pipeline);

  res.json({
    pipelines: staleResults,
    summary: {
      total: staleResults.length,
      fresh: staleResults.filter(r => !r.isStale).length,
      stale: staleNames.length,
      neverRun: staleResults.filter(r => r.neverRun).length,
      stalePipelines: staleNames,
    },
  });
});

router.post("/ingestion/refresh-stale", requireAdmin, async (_req, res) => {
  const staleNames = await getStalePipelineNames();
  if (staleNames.length === 0) {
    res.json({ message: "All pipelines are fresh", refreshed: [] });
    return;
  }

  const results: Array<{ pipeline: string; status: string; error?: string }> = [];
  for (const name of staleNames) {
    try {
      const result = await runPipeline(name);
      results.push({ pipeline: name, status: result.status });
    } catch (err) {
      results.push({ pipeline: name, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  const successCount = results.filter(r => r.status === "success").length;
  let scoring = null;
  if (successCount > 0) {
    try {
      const scores = await computeCountryScores();
      const countriesUpdated = await writeScoresToDB(scores);
      scoring = { countriesUpdated };
    } catch (_err) {}
  }

  res.json({
    message: `Refreshed ${successCount}/${staleNames.length} stale pipelines`,
    results,
    scoring,
  });
});

export default router;
