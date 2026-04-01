import { db, projectsTable } from "@workspace/db";
import { isNull } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { lookupCountryPERSInputs } from "../lib/country-data-lookup";
import {
  calculatePERS,
  buildInterventionRiskProfile,
  determineMonitoringIntensity,
  recommendCapitalMode,
  inferCategory,
  inferInterventionType,
  type ProjectCategory,
  type InterventionType,
} from "../lib/pers-engine";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`[pers:backfill] Starting PERS backfill for legacy projects${dryRun ? " (DRY RUN)" : ""}...`);

  const legacyProjects = await db.select().from(projectsTable).where(isNull(projectsTable.persScore));

  console.log(`[pers:backfill] Found ${legacyProjects.length} projects without PERS scores`);

  if (legacyProjects.length === 0) {
    console.log("[pers:backfill] No projects to backfill.");
    return;
  }

  const report: Array<{
    id: number;
    name: string;
    country: string;
    category: string;
    intervention: string;
    persScore: number;
    capitalMode: string;
    monitoring: string;
    decision: string;
  }> = [];

  for (const p of legacyProjects) {
    const category = (p.projectCategory as ProjectCategory) ?? inferCategory(p.projectType);
    const intervention = (p.interventionType as InterventionType) ?? inferInterventionType(category);
    const countryInputs = await lookupCountryPERSInputs(p.country);

    const riskScores = {
      environmentalRisk: p.environmentalRisk,
      infrastructureRisk: p.infrastructureRisk,
      humanExposureRisk: p.humanExposureRisk,
      regulatoryRisk: p.regulatoryRisk,
      dataConfidence: p.dataConfidence,
      overallRisk: p.overallRisk,
    };

    const breakdown = calculatePERS(
      riskScores, intervention, p.projectType,
      p.hasSEA, p.hasESIA,
      countryInputs.governanceScore, countryInputs.disasterLossHistory, countryInputs.provenance,
    );

    const profile = buildInterventionRiskProfile(intervention, riskScores);
    const capitalMode = recommendCapitalMode(breakdown.persScore, p.dataConfidence, intervention);
    const monitoring = determineMonitoringIntensity(breakdown.persScore, p.dataConfidence, intervention, capitalMode);

    const decision = breakdown.persScore < 40 ? "PROCEED" : breakdown.persScore <= 70 ? "CONDITION" : "DECLINE";

    report.push({
      id: p.id,
      name: p.name,
      country: p.country,
      category,
      intervention,
      persScore: breakdown.persScore,
      capitalMode,
      monitoring: monitoring.level,
      decision,
    });

    if (!dryRun) {
      await db.update(projectsTable).set({
        projectCategory: p.projectCategory ?? category,
        interventionType: p.interventionType ?? intervention,
        capitalMode,
        persScore: breakdown.persScore,
        interventionRiskScore: profile.adjustedRisk,
        monitoringIntensity: monitoring.level,
        persBreakdown: breakdown,
        interventionRiskProfile: profile,
      }).where(eq(projectsTable.id, p.id));
    }
  }

  console.log("\n=== Backfill Report ===");
  console.log("ID  | Name                          | Country   | Category              | PERS  | Mode     | Monitor  | Decision");
  console.log("----|-------------------------------|-----------|----------------------|-------|----------|----------|--------");
  for (const r of report) {
    console.log(
      `${String(r.id).padStart(3)} | ${r.name.padEnd(29)} | ${r.country.padEnd(9)} | ${r.category.padEnd(20)} | ${String(r.persScore).padStart(5)} | ${r.capitalMode.padEnd(8)} | ${r.monitoring.padEnd(8)} | ${r.decision}`
    );
  }

  console.log(`\n[pers:backfill] ${dryRun ? "Would backfill" : "Backfilled"} ${report.length} projects.`);
}

main().catch(err => { console.error(err); process.exit(1); });
