import { db, projectsTable, riskHistoryTable } from "@workspace/db";
import { eq, isNotNull } from "drizzle-orm";
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
const filterCountry = process.argv.find(a => a.startsWith("--country="))?.split("=")[1];

async function main() {
  console.log(`[pers:recalculate] Starting PERS recalculation${dryRun ? " (DRY RUN)" : ""}...`);
  if (filterCountry) console.log(`[pers:recalculate] Filtering to country: ${filterCountry}`);

  const allProjects = await db.select().from(projectsTable).where(isNotNull(projectsTable.persScore));

  const projects = filterCountry
    ? allProjects.filter(p => p.country === filterCountry)
    : allProjects;

  console.log(`[pers:recalculate] Found ${projects.length} PERS-scored projects to recalculate`);

  let updated = 0;
  let changed = 0;

  for (const p of projects) {
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

    const newBreakdown = calculatePERS(
      riskScores, intervention, p.projectType,
      p.hasSEA, p.hasESIA,
      countryInputs.governanceScore, countryInputs.disasterLossHistory, countryInputs.provenance,
    );

    const newProfile = buildInterventionRiskProfile(intervention, riskScores);
    const newCapitalMode = recommendCapitalMode(newBreakdown.persScore, p.dataConfidence, intervention);
    const newMonitoring = determineMonitoringIntensity(newBreakdown.persScore, p.dataConfidence, intervention, newCapitalMode);

    const oldPers = p.persScore ?? 0;
    const delta = Math.round((newBreakdown.persScore - oldPers) * 10) / 10;

    if (Math.abs(delta) > 0.05) {
      changed++;
      console.log(`  [${p.id}] ${p.name} (${p.country}): PERS ${oldPers} → ${newBreakdown.persScore} (Δ${delta > 0 ? "+" : ""}${delta})`);

      if (!dryRun) {
        const now = new Date();
        const monthInt = now.getFullYear() * 100 + (now.getMonth() + 1);
        await db.insert(riskHistoryTable).values({
          projectId: p.id,
          month: monthInt,
          overallRisk: newBreakdown.persScore,
          dataConfidence: p.dataConfidence,
        });
      }
    }

    if (!dryRun) {
      await db.update(projectsTable).set({
        persScore: newBreakdown.persScore,
        interventionRiskScore: newProfile.adjustedRisk,
        monitoringIntensity: newMonitoring.level,
        capitalMode: newCapitalMode,
        persBreakdown: newBreakdown,
        interventionRiskProfile: newProfile,
      }).where(eq(projectsTable.id, p.id));
      updated++;
    }
  }

  console.log(`[pers:recalculate] Done. ${updated} updated, ${changed} had score changes.`);
}

main().catch(err => { console.error(err); process.exit(1); });
