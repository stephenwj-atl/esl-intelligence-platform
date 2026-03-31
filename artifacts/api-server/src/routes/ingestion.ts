import { Router, type IRouter } from "express";
import { runPipeline, runAllPipelines, adapters } from "../services/data-ingestion";
import { getScheduleStatus } from "../services/data-ingestion/scheduler";
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

  res.json({
    sources: freshness,
    recentRuns,
    schedule: getScheduleStatus(),
    availablePipelines: Object.keys(adapters),
  });
});

export default router;
