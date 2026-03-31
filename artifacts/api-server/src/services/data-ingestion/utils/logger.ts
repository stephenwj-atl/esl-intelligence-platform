const PREFIX = "[data-ingestion]";

export const ingestionLogger = {
  info(pipeline: string, message: string, data?: Record<string, unknown>) {
    console.log(`${PREFIX}[${pipeline}] ${message}`, data ? JSON.stringify(data) : "");
  },
  warn(pipeline: string, message: string, data?: Record<string, unknown>) {
    console.warn(`${PREFIX}[${pipeline}] WARN: ${message}`, data ? JSON.stringify(data) : "");
  },
  error(pipeline: string, message: string, error?: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error || "");
    console.error(`${PREFIX}[${pipeline}] ERROR: ${message}`, errMsg);
  },
  success(pipeline: string, message: string, data?: Record<string, unknown>) {
    console.log(`${PREFIX}[${pipeline}] ✓ ${message}`, data ? JSON.stringify(data) : "");
  },
};
