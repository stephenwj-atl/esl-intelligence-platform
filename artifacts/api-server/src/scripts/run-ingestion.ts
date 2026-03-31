import { runAllPipelines } from "../services/data-ingestion";

async function main() {
  console.log("=== ESL Data Ingestion Runner ===");
  console.log("Starting all pipelines...\n");

  try {
    const { results, scoring } = await runAllPipelines();

    console.log("\n=== Pipeline Results ===");
    for (const r of results) {
      const icon = r.status === "success" ? "✓" : r.status === "partial" ? "~" : "✗";
      console.log(`${icon} ${r.pipelineName}: ${r.status} | ${r.recordsRead} read, ${r.recordsWritten} written | confidence: ${r.confidence}%`);
      if (r.error) console.log(`  Error: ${r.error}`);
    }

    if (scoring) {
      console.log(`\n=== Scoring ===`);
      console.log(`Countries updated: ${scoring.countriesUpdated}`);
    }

    const failed = results.filter(r => r.status === "failed");
    const succeeded = results.filter(r => r.status === "success" || r.status === "partial").length;
    console.log(`\n=== Summary ===`);
    console.log(`${succeeded}/${results.length} pipelines succeeded`);

    if (failed.length > 0) {
      console.error(`\n${failed.length} pipeline(s) failed: ${failed.map(f => f.pipelineName).join(", ")}`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }

  process.exit(0);
}

main();
