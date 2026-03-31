import { ingestionLogger as log } from "./utils/logger";
import { PIPELINE_SCHEDULES } from "./types";

const PIPELINE_NAME = "scheduler";

interface ScheduleEntry {
  pipeline: string;
  frequency: string;
  lastRun: Date | null;
  nextRun: Date | null;
}

const FREQUENCY_MS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const scheduleState: Map<string, ScheduleEntry> = new Map();
let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function initScheduler(runPipeline: (name: string) => Promise<void>): void {
  for (const [pipeline, frequency] of Object.entries(PIPELINE_SCHEDULES)) {
    const name = pipeline.toLowerCase();
    scheduleState.set(name, {
      pipeline: name,
      frequency,
      lastRun: null,
      nextRun: new Date(Date.now() + FREQUENCY_MS[frequency]),
    });
  }

  log.info(PIPELINE_NAME, "Scheduler initialized", {
    pipelines: Object.keys(PIPELINE_SCHEDULES),
  });

  intervalHandle = setInterval(async () => {
    const now = new Date();
    for (const [name, entry] of scheduleState.entries()) {
      if (entry.nextRun && now >= entry.nextRun) {
        log.info(PIPELINE_NAME, `Scheduled run triggered for ${name}`);
        try {
          await runPipeline(name);
          entry.lastRun = now;
          entry.nextRun = new Date(now.getTime() + FREQUENCY_MS[entry.frequency]);
        } catch (err) {
          log.error(PIPELINE_NAME, `Scheduled run failed for ${name}`, err);
          entry.nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        }
      }
    }
  }, 60 * 1000);
}

export function stopScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    log.info(PIPELINE_NAME, "Scheduler stopped");
  }
}

export function getScheduleStatus(): ScheduleEntry[] {
  return Array.from(scheduleState.values());
}
