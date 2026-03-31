import { db, dataSourceFreshnessTable } from "@workspace/db";
import { ingestionLogger as log } from "./utils/logger";
import { PIPELINE_SCHEDULES } from "./types";
import { computeCountryScores, writeScoresToDB } from "./scoring";

const PIPELINE_NAME = "scheduler";

export interface StaleCheckResult {
  pipeline: string;
  frequency: string;
  priority: "critical" | "standard" | "low";
  intervalHours: number;
  lastSuccess: Date | null;
  hoursElapsed: number | null;
  isStale: boolean;
  neverRun: boolean;
}

export async function checkStalePipelines(): Promise<StaleCheckResult[]> {
  const freshness = await db.select().from(dataSourceFreshnessTable);
  const now = new Date();
  const results: StaleCheckResult[] = [];

  for (const [name, schedule] of Object.entries(PIPELINE_SCHEDULES)) {
    const sources = freshness.filter(f => f.pipelineName === name);
    const latestSuccess = sources
      .filter(s => s.lastSuccessAt)
      .sort((a, b) => (b.lastSuccessAt?.getTime() ?? 0) - (a.lastSuccessAt?.getTime() ?? 0))[0];

    const lastSuccess = latestSuccess?.lastSuccessAt ?? null;
    const hoursElapsed = lastSuccess ? (now.getTime() - lastSuccess.getTime()) / (1000 * 60 * 60) : null;
    const neverRun = lastSuccess === null;
    const isStale = neverRun || (hoursElapsed !== null && hoursElapsed > schedule.intervalHours);

    results.push({
      pipeline: name,
      frequency: schedule.frequency,
      priority: schedule.priority,
      intervalHours: schedule.intervalHours,
      lastSuccess,
      hoursElapsed: hoursElapsed !== null ? Math.round(hoursElapsed * 10) / 10 : null,
      isStale,
      neverRun,
    });
  }

  return results;
}

export async function getStalePipelineNames(): Promise<string[]> {
  const results = await checkStalePipelines();
  return results
    .filter(r => r.isStale)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, standard: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .map(r => r.pipeline);
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(runPipeline: (name: string) => Promise<any>, checkIntervalMs = 3600000): void {
  if (schedulerInterval) {
    log.info(PIPELINE_NAME, "Scheduler already running");
    return;
  }

  log.info(PIPELINE_NAME, `Starting pipeline scheduler (check every ${checkIntervalMs / 60000} min)`);

  const runStale = async () => {
    try {
      const stale = await getStalePipelineNames();
      if (stale.length === 0) {
        log.info(PIPELINE_NAME, "All pipelines fresh");
        return;
      }

      log.info(PIPELINE_NAME, `${stale.length} stale pipelines: ${stale.join(", ")}`);
      let successCount = 0;
      for (const name of stale) {
        try {
          await runPipeline(name);
          successCount++;
        } catch (err) {
          log.error(PIPELINE_NAME, `Scheduled run of ${name} failed: ${err}`);
        }
      }

      if (successCount > 0) {
        try {
          log.info(PIPELINE_NAME, "Re-running scoring engine after stale refresh");
          const scores = await computeCountryScores();
          await writeScoresToDB(scores);
          log.success(PIPELINE_NAME, `Scoring updated for ${scores.length} countries`);
        } catch (err) {
          log.error(PIPELINE_NAME, `Post-refresh scoring failed: ${err}`);
        }
      }
    } catch (err) {
      log.error(PIPELINE_NAME, `Scheduler check failed: ${err}`);
    }
  };

  schedulerInterval = setInterval(runStale, checkIntervalMs);
  log.success(PIPELINE_NAME, "Pipeline scheduler started");
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    log.info(PIPELINE_NAME, "Pipeline scheduler stopped");
  }
}

export function getScheduleStatus(): StaleCheckResult[] | Promise<StaleCheckResult[]> {
  return checkStalePipelines();
}
