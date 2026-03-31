import { db, dataSourceFreshnessTable } from "@workspace/db";

export async function upsertFreshness(params: {
  sourceKey: string;
  pipelineName: string;
  status: string;
  confidence: number;
  recordsLoaded: number;
  errorMessage?: string;
}) {
  const now = new Date();
  const isSuccess = params.status !== "failed";

  await db.insert(dataSourceFreshnessTable).values({
    sourceKey: params.sourceKey,
    pipelineName: params.pipelineName,
    lastAttemptAt: now,
    lastSuccessAt: isSuccess ? now : undefined,
    status: params.status,
    confidence: params.confidence,
    recordsLoaded: params.recordsLoaded,
    errorMessage: params.errorMessage,
  }).onConflictDoUpdate({
    target: dataSourceFreshnessTable.sourceKey,
    set: {
      lastAttemptAt: now,
      ...(isSuccess ? { lastSuccessAt: now } : {}),
      status: params.status,
      confidence: params.confidence,
      recordsLoaded: params.recordsLoaded,
      errorMessage: params.errorMessage ?? null,
    },
  });
}
