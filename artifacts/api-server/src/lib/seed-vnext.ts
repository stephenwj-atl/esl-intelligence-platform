import {
  db,
  projectsTable,
  sectorFamiliesTable,
  methodologyProfilesTable,
  projectOutcomesTable,
  outcomeMetricsTable,
  disbursementMilestonesTable,
  transitionPathwaysTable,
  methodologyEvidenceTable,
  calibrationMemosTable,
  validationCasesTable,
  validationObservationsTable,
  overrideDecisionsTable,
} from "@workspace/db";
import { SECTOR_FAMILIES } from "./sector-families";
import { METHODOLOGY_PROFILES } from "./methodology-profiles";

export async function seedVNextData() {
  console.log("[seed-vnext] Starting VNext seed data...");

  for (const fam of SECTOR_FAMILIES) {
    const existing = await db.select().from(sectorFamiliesTable).where(
      (await import("drizzle-orm")).eq(sectorFamiliesTable.familyKey, fam.key)
    );
    if (existing.length === 0) {
      await db.insert(sectorFamiliesTable).values({
        familyKey: fam.key,
        name: fam.name,
        description: fam.description,
        projectTypes: fam.projectTypes,
      });
    }
  }
  console.log("[seed-vnext] Sector families seeded");

  for (const prof of METHODOLOGY_PROFILES) {
    const existing = await db.select().from(methodologyProfilesTable).where(
      (await import("drizzle-orm")).eq(methodologyProfilesTable.profileKey, prof.profileKey)
    );
    if (existing.length === 0) {
      await db.insert(methodologyProfilesTable).values({
        profileKey: prof.profileKey,
        name: prof.name,
        sectorFamily: prof.sectorFamily,
        version: prof.version,
        countryContextWeight: prof.weights.countryContext,
        projectOverlayWeight: prof.weights.projectOverlay,
        sensitivityWeight: prof.weights.sensitivity,
        interventionRiskWeight: prof.weights.interventionRisk,
        outcomeRiskModifier: prof.weights.outcomeRiskModifier,
        instrumentStructureModifier: prof.weights.instrumentStructureModifier,
        confidenceInfluence: prof.weights.confidenceInfluence,
        hazardRelevance: prof.relevance.hazard,
        biodiversityRelevance: prof.relevance.biodiversity,
        governanceRelevance: prof.relevance.governance,
        disasterHistoryRelevance: prof.relevance.disasterHistory,
        communityVulnerabilityRelevance: prof.relevance.communityVulnerability,
        outcomeComplexity: prof.relevance.outcomeComplexity,
        monitoringNeeds: prof.relevance.monitoringNeeds,
        capitalSuitability: prof.capitalSuitability,
        rationale: prof.rationale,
        assumptions: prof.assumptions,
        knownLimitations: prof.knownLimitations,
      });
    }
  }
  console.log("[seed-vnext] Methodology profiles seeded");

  const evidenceEntries = [
    { profileKey: "PERS_DEFAULT_V1", evidenceType: "framework_alignment", title: "IFC Performance Standards Alignment", description: "Default profile weights align with IFC PS1 screening requirements for environmental and social risk categorization.", sourceReference: "IFC Performance Standards 2012" },
    { profileKey: "PERS_INFRA_V1", evidenceType: "empirical_observation", title: "Caribbean Infrastructure Post-Disaster Loss Patterns", description: "Analysis of 15 Caribbean infrastructure projects post-hurricane shows overlay (site-specific hazard) is the strongest predictor of damage severity, supporting elevated overlay weight.", sourceReference: "CDB Post-Disaster Assessment Reports 2017-2023" },
    { profileKey: "PERS_ECOSYSTEMS_V1", evidenceType: "literature_review", title: "Ecosystem Restoration Outcome Uncertainty", description: "Systematic review of 40+ ecosystem restoration projects in tropical SIDS shows 5-20 year outcome uncertainty, justifying high outcome risk modifier.", sourceReference: "IUCN Global Restoration Standards 2021" },
    { profileKey: "PERS_GOVERNANCE_V1", evidenceType: "expert_judgment", title: "Institutional Reform Delivery Risk Assessment", description: "Expert panel assessment of governance reform projects in Caribbean SIDS indicates political economy factors dominate delivery risk, supporting elevated intervention risk weight.", sourceReference: "ESL Internal Expert Panel 2024" },
    { profileKey: "PERS_DISASTER_V1", evidenceType: "framework_alignment", title: "INFORM Risk Index Alignment", description: "Disaster profile disaster history relevance is calibrated against INFORM Risk Index hazard and exposure components.", sourceReference: "INFORM Risk Index Methodology 2023" },
  ];

  for (const ev of evidenceEntries) {
    const existing = await db.select().from(methodologyEvidenceTable).where(
      (await import("drizzle-orm")).eq(methodologyEvidenceTable.title, ev.title)
    );
    if (existing.length === 0) {
      await db.insert(methodologyEvidenceTable).values(ev);
    }
  }
  console.log("[seed-vnext] Methodology evidence seeded");

  const projects = await db.select().from(projectsTable);
  if (projects.length > 0) {
    const p = projects[0];
    const existingOutcome = await db.select().from(projectOutcomesTable).where(
      (await import("drizzle-orm")).eq(projectOutcomesTable.projectId, p.id)
    );
    if (existingOutcome.length === 0) {
      await db.insert(projectOutcomesTable).values({
        projectId: p.id,
        theoryOfChange: "IF resilient infrastructure is constructed with climate-adaptive design THEN community exposure to flood damage is reduced by 40% AND economic losses from climate events decrease by 25% within 5 years.",
        outputsSummary: "1. Climate-resilient drainage infrastructure constructed. 2. Community early warning system installed. 3. Maintenance capacity building completed.",
        outcomesSummary: "Reduced flood damage to households and businesses. Improved community resilience score. Decreased economic loss from climate events.",
        reportingCycle: "quarterly",
        outcomeDeliveryRiskScore: 45,
        outcomeConfidenceScore: 62,
        disbursementReadinessScore: 70,
        implementationCapacityScore: 65,
      });

      await db.insert(outcomeMetricsTable).values([
        { projectId: p.id, metricKey: "flood_reduction", metricName: "Flood Damage Reduction", category: "climate_resilience", targetValue: 40, unit: "percent", verificationMethod: "Post-event damage assessment comparison" },
        { projectId: p.id, metricKey: "econ_loss_reduction", metricName: "Economic Loss Reduction", category: "economic", targetValue: 25, unit: "percent", verificationMethod: "Insurance claim data analysis" },
        { projectId: p.id, metricKey: "beneficiaries", metricName: "Direct Beneficiaries", category: "social", targetValue: 15000, unit: "persons", verificationMethod: "Census-based coverage assessment" },
      ]);

      await db.insert(disbursementMilestonesTable).values([
        { projectId: p.id, milestoneName: "Baseline Environmental Assessment Complete", milestoneType: "technical", requiredEvidence: "Approved ESIA report", currentStatus: "completed", gatingEffect: "gates_first_tranche", sequenceOrder: 1 },
        { projectId: p.id, milestoneName: "Procurement Package Approved", milestoneType: "fiduciary", requiredEvidence: "Procurement plan with IDB no-objection", currentStatus: "completed", gatingEffect: "gates_construction", sequenceOrder: 2 },
        { projectId: p.id, milestoneName: "50% Construction Completion", milestoneType: "physical", requiredEvidence: "Engineer's certificate + photo documentation", currentStatus: "pending", gatingEffect: "gates_second_tranche", sequenceOrder: 3 },
        { projectId: p.id, milestoneName: "Environmental Monitoring Report Q4", milestoneType: "environmental", requiredEvidence: "Quarterly monitoring report with lab results", currentStatus: "pending", gatingEffect: "informational", sequenceOrder: 4 },
      ]);

      console.log("[seed-vnext] Outcomes, metrics, milestones seeded for project:", p.name);
    }

    if (projects.length >= 2) {
      const p2 = projects[1];
      const existingTransition = await db.select().from(transitionPathwaysTable).where(
        (await import("drizzle-orm")).eq(transitionPathwaysTable.projectId, p2.id)
      );
      if (existingTransition.length === 0) {
        await db.insert(transitionPathwaysTable).values({
          projectId: p2.id,
          fromInstrument: "GRANT",
          toInstrument: "BLENDED",
          transitionTrigger: "PERS reduces below 55 AND data confidence exceeds 60%",
          validationCriteria: "Independent risk reassessment confirms reduced risk profile. Institutional capacity assessment shows adequate financial management.",
          timeHorizon: "18-24 months",
          requiredConditions: { persThreshold: 55, confidenceThreshold: 60, milestoneCompletion: 0.6 },
          confidenceThreshold: 60,
          responsibleReviewer: "Senior Investment Officer",
        });
        console.log("[seed-vnext] Transition pathway seeded for project:", p2.name);
      }
    }
  }

  const existingValidation = await db.select().from(validationCasesTable);
  if (existingValidation.length === 0 && projects.length > 0) {
    const [vc] = await db.insert(validationCasesTable).values({
      projectId: projects[0].id,
      caseType: "post_implementation",
      predictedRisk: projects[0].persScore ?? 50,
      observedRisk: null,
      predictedOutcome: "CONDITION",
      observedOutcome: null,
      sectorFamily: projects[0].sectorFamily ?? "hard_infrastructure",
      profileUsed: "PERS_DEFAULT_V1",
      notes: "Initial validation case — observed risk and outcome to be recorded after 12-month implementation period.",
    }).returning();

    await db.insert(validationObservationsTable).values({
      validationCaseId: vc.id,
      observationType: "initial_assessment",
      description: "Predicted PERS score appears reasonable given country context and project type. Key uncertainty: governance quality data relies on national-level proxy.",
      impact: "Governance proxy may overstate risk for well-managed implementing entities.",
      recommendation: "Record entity-level capacity assessment at 6-month review.",
    });
    console.log("[seed-vnext] Validation case seeded");
  }

  console.log("[seed-vnext] VNext seed data complete.");
}
