import { runAllPipelines, runPipeline } from "../services/data-ingestion";

async function main() {
  const filterArg = process.argv[2];
  const pipelineFilter = filterArg ? filterArg.split(",") : null;

  console.log("=== ESL Data Ingestion Runner ===");
  if (pipelineFilter) {
    console.log(`Running selected pipelines: ${pipelineFilter.join(", ")}\n`);
  } else {
    console.log("Starting all pipelines...\n");
  }

  try {
    let results;
    let scoring;

    if (pipelineFilter) {
      results = [];
      for (const name of pipelineFilter) {
        try {
          const result = await runPipeline(name.trim());
          results.push(result);
        } catch (err: any) {
          console.error(`Pipeline ${name} crashed: ${err.message}`);
          results.push({ pipelineName: name, status: "failed" as const, recordsRead: 0, recordsWritten: 0, countriesAffected: [], confidence: 0, summary: {}, error: err.message });
        }
      }
      scoring = null;
    } else {
      const all = await runAllPipelines();
      results = all.results;
      scoring = all.scoring;
    }

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
