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
  funderFrameworksTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { SECTOR_FAMILIES } from "./sector-families";
import { METHODOLOGY_PROFILES } from "./methodology-profiles";
import { FUNDER_FRAMEWORKS } from "./funder-frameworks";

export async function seedVNextData() {
  console.log("[seed-vnext] Starting VNext seed data...");

  for (const fam of SECTOR_FAMILIES) {
    const existing = await db.select().from(sectorFamiliesTable).where(
      eq(sectorFamiliesTable.familyKey, fam.key)
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
      eq(methodologyProfilesTable.profileKey, prof.profileKey)
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
      eq(methodologyEvidenceTable.title, ev.title)
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
      eq(projectOutcomesTable.projectId, p.id)
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
        eq(transitionPathwaysTable.projectId, p2.id)
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

  for (const fw of FUNDER_FRAMEWORKS) {
    const existing = await db.select().from(funderFrameworksTable).where(
      eq(funderFrameworksTable.frameworkKey, fw.key)
    );
    if (existing.length === 0) {
      await db.insert(funderFrameworksTable).values({
        frameworkKey: fw.key,
        displayName: fw.displayName,
        instrumentRelevance: fw.instrumentRelevance,
        safeguardEmphasis: fw.safeguardEmphasis,
        reportingStyle: fw.reportingStyle,
        baselineExpectations: fw.baselineExpectations,
        disbursementControls: fw.disbursementControls,
        resultsFrameworkEmphasis: fw.resultsFrameworkEmphasis,
        permissibilityCues: fw.permissibilityCues,
        typicalConditions: fw.typicalConditions,
        categoryMapping: fw.categoryMapping,
        notes: fw.notes,
        limitations: fw.limitations,
      });
    }
  }
  console.log("[seed-vnext] Funder frameworks seeded");

  const instrumentDefaults: Record<string, { type: string; profile: string }> = {
    "Kingston Solar Farm": { type: "LOAN", profile: "PERS_INFRA_V1" },
    "Montego Bay Port Expansion": { type: "LOAN", profile: "PERS_INFRA_V1" },
    "Ocho Rios Resort Development": { type: "BLENDED", profile: "PERS_PRIVATE_SECTOR_V1" },
    "Coastal Solar Phase II": { type: "LOAN", profile: "PERS_INFRA_V1" },
    "Spanish Town Industrial Park": { type: "LOAN", profile: "PERS_PRIVATE_SECTOR_V1" },
    "Negril Agricultural Hub": { type: "GRANT", profile: "PERS_DEFAULT_V1" },
    "Port Antonio Marina": { type: "BLENDED", profile: "PERS_INFRA_V1" },
    "Kingston Harbour Water Treatment Upgrade": { type: "LOAN", profile: "PERS_INFRA_V1" },
    "Barbados Solar Farm & Grid Modernization": { type: "BLENDED", profile: "PERS_INFRA_V1" },
    "Dominica Post-Hurricane Housing Reconstruction": { type: "GRANT", profile: "PERS_DISASTER_V1" },
    "Trinidad Agricultural Supply Chain Platform": { type: "BLENDED", profile: "PERS_PRIVATE_SECTOR_V1" },
    "Guyana Public Financial Management Reform": { type: "TECHNICAL_ASSISTANCE", profile: "PERS_GOVERNANCE_V1" },
    "St. Lucia Community Health Network Expansion": { type: "LOAN", profile: "PERS_HEALTH_V1" },
    "Bahamas Coastal Resilience & Mangrove Restoration": { type: "GRANT", profile: "PERS_ECOSYSTEMS_V1" },
  };

  for (const [name, config] of Object.entries(instrumentDefaults)) {
    await db.update(projectsTable)
      .set({ instrumentType: config.type, methodologyProfile: config.profile })
      .where(eq(projectsTable.name, name));
  }
  console.log("[seed-vnext] Instrument types and profiles assigned");

  const newDemoProjects = [
    {
      name: "Barbados Private Sector Wind Energy",
      country: "Barbados",
      projectType: "Wind",
      region: "Caribbean",
      latitude: 13.1939,
      longitude: -59.5432,
      investmentAmount: 42000000,
      instrumentType: "LOAN",
      methodologyProfile: "PERS_PRIVATE_SECTOR_V1",
      sectorFamily: "energy",
      environmentalRisk: 35,
      infrastructureRisk: 40,
      humanExposureRisk: 20,
      regulatoryRisk: 30,
      overallRisk: 33,
      dataConfidence: 72,
      floodRisk: 2,
      coastalExposure: 5,
      contaminationRisk: 1,
      regulatoryComplexity: 4,
      communitySensitivity: 3,
      waterStress: 2,
      hasMonitoringData: true,
      hasLabData: true,
      hasSEA: false,
      hasESIA: true,
      isIFCAligned: true,
      capitalMode: "Concessional",
      monitoringIntensity: "Standard",
      decisionOutcome: "PROCEED",
      decisionInsight: "Strong private-sector developer with established track record. IFC-aligned with full ESIA. Low coastal and environmental risk.",
      delayRiskPercent: 12,
      costOverrunPercent: 8,
      covenantBreachPercent: 5,
      reputationalRisk: "low",
      persScore: 36,
    },
    {
      name: "Grenada Agriculture Blended Finance Facility",
      country: "Grenada",
      projectType: "Agriculture",
      region: "Caribbean",
      latitude: 12.1165,
      longitude: -61.6790,
      investmentAmount: 15000000,
      instrumentType: "BLENDED",
      methodologyProfile: "PERS_DEFAULT_V1",
      sectorFamily: "agriculture_fisheries",
      environmentalRisk: 45,
      infrastructureRisk: 30,
      humanExposureRisk: 55,
      regulatoryRisk: 40,
      overallRisk: 44,
      dataConfidence: 55,
      floodRisk: 5,
      coastalExposure: 4,
      contaminationRisk: 3,
      regulatoryComplexity: 5,
      communitySensitivity: 6,
      waterStress: 5,
      hasMonitoringData: false,
      hasLabData: false,
      hasSEA: true,
      hasESIA: false,
      isIFCAligned: false,
      capitalMode: "Grant-First",
      monitoringIntensity: "Enhanced",
      decisionOutcome: "CONDITION",
      decisionInsight: "Agriculture blended facility — grant-first tranche recommended until ESIA completion and soil contamination baseline established.",
      delayRiskPercent: 25,
      costOverrunPercent: 18,
      covenantBreachPercent: 15,
      reputationalRisk: "medium",
      persScore: 48,
    },
    {
      name: "Antigua Multi-Hazard Resilience Program",
      country: "Antigua and Barbuda",
      projectType: "Emergency Shelter",
      region: "Caribbean",
      latitude: 17.0608,
      longitude: -61.7964,
      investmentAmount: 55000000,
      instrumentType: "GRANT",
      methodologyProfile: "PERS_DISASTER_V1",
      sectorFamily: "disaster_climate",
      environmentalRisk: 50,
      infrastructureRisk: 55,
      humanExposureRisk: 70,
      regulatoryRisk: 35,
      overallRisk: 52,
      dataConfidence: 48,
      floodRisk: 7,
      coastalExposure: 8,
      contaminationRisk: 2,
      regulatoryComplexity: 4,
      communitySensitivity: 8,
      waterStress: 4,
      hasMonitoringData: true,
      hasLabData: false,
      hasSEA: true,
      hasESIA: true,
      isIFCAligned: false,
      capitalMode: "Grant",
      monitoringIntensity: "Intensive",
      decisionOutcome: "CONDITION",
      decisionInsight: "Post-disaster resilience program with high human exposure. Grant instrument appropriate. Low confidence due to post-event data gaps.",
      delayRiskPercent: 30,
      costOverrunPercent: 22,
      covenantBreachPercent: 10,
      reputationalRisk: "medium",
      persScore: 56,
    },
    {
      name: "Jamaica Blue Economy Aquaculture Park",
      country: "Jamaica",
      projectType: "Aquaculture",
      region: "Caribbean",
      latitude: 18.1096,
      longitude: -77.2975,
      investmentAmount: 22000000,
      instrumentType: "BLENDED",
      methodologyProfile: "PERS_ECOSYSTEMS_V1",
      sectorFamily: "agriculture_fisheries",
      environmentalRisk: 55,
      infrastructureRisk: 35,
      humanExposureRisk: 40,
      regulatoryRisk: 50,
      overallRisk: 46,
      dataConfidence: 58,
      floodRisk: 3,
      coastalExposure: 6,
      contaminationRisk: 4,
      regulatoryComplexity: 6,
      communitySensitivity: 5,
      waterStress: 6,
      hasMonitoringData: true,
      hasLabData: true,
      hasSEA: true,
      hasESIA: true,
      isIFCAligned: true,
      capitalMode: "Blended",
      monitoringIntensity: "Enhanced",
      decisionOutcome: "PROCEED",
      decisionInsight: "Blue economy aquaculture with strong environmental safeguards. Blended structure supported by IFC alignment and dual assessment coverage.",
      delayRiskPercent: 18,
      costOverrunPercent: 14,
      covenantBreachPercent: 8,
      reputationalRisk: "low",
      persScore: 42,
    },
  ];

  for (const proj of newDemoProjects) {
    const existing = await db.select().from(projectsTable).where(eq(projectsTable.name, proj.name));
    if (existing.length === 0) {
      await db.insert(projectsTable).values(proj);
    }
  }
  console.log("[seed-vnext] New demo projects seeded (total should be 18+)");

  console.log("[seed-vnext] VNext seed data complete.");
}
