import { db, projectsTable, portfoliosTable, portfolioProjectsTable, riskHistoryTable, covenantsTable, esapItemsTable, monitoringEventsTable, auditLogsTable, frameworkAlignmentsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function normalize(val: number, maxInput: number): number {
  return (val / maxInput) * 100;
}

function analyzeProject(inputs: {
  floodRisk: number;
  coastalExposure: number;
  contaminationRisk: number;
  regulatoryComplexity: number;
  communitySensitivity: number;
  waterStress: number;
  hasLabData: boolean;
  hasMonitoringData: boolean;
  isIFCAligned: boolean;
}) {
  const flood = normalize(inputs.floodRisk, 10);
  const coastal = normalize(inputs.coastalExposure, 10);
  const contamination = normalize(inputs.contaminationRisk, 10);
  const regulatory = normalize(inputs.regulatoryComplexity, 10);
  const community = normalize(inputs.communitySensitivity, 10);
  const water = normalize(inputs.waterStress, 10);

  const environmentalRisk = clamp((flood * 0.25) + (contamination * 0.25) + (water * 0.20) + (coastal * 0.30), 0, 100);
  const infrastructureRisk = clamp((flood * 0.35) + (coastal * 0.35) + (regulatory * 0.30), 0, 100);
  const humanExposureRisk = clamp((community * 0.50) + (contamination * 0.50), 0, 100);
  const regulatoryRisk = clamp((regulatory * 0.60) + (community * 0.25) + (contamination * 0.15), 0, 100);

  let dataConfidence = 40;
  if (inputs.hasLabData) dataConfidence += 20;
  if (inputs.hasMonitoringData) dataConfidence += 20;
  if (inputs.isIFCAligned) dataConfidence += 20;
  dataConfidence = clamp(dataConfidence, 0, 100);

  const rawOverall = (environmentalRisk * 0.30) + (infrastructureRisk * 0.25) + (humanExposureRisk * 0.20) + (regulatoryRisk * 0.25);
  const uncertaintyFactor = dataConfidence < 50 ? 0.20 : (dataConfidence < 70 ? 0.10 : 0);
  const overallRisk = clamp(rawOverall * (1 + uncertaintyFactor), 0, 100);

  const riskScores = {
    environmentalRisk: Math.round(environmentalRisk * 10) / 10,
    infrastructureRisk: Math.round(infrastructureRisk * 10) / 10,
    humanExposureRisk: Math.round(humanExposureRisk * 10) / 10,
    regulatoryRisk: Math.round(regulatoryRisk * 10) / 10,
    dataConfidence: Math.round(dataConfidence * 10) / 10,
    overallRisk: Math.round(overallRisk * 10) / 10,
  };

  let delayRiskPercent: number;
  if (riskScores.environmentalRisk > 70) delayRiskPercent = 60 + (riskScores.environmentalRisk - 70) * 0.67;
  else if (riskScores.environmentalRisk > 40) delayRiskPercent = 25 + (riskScores.environmentalRisk - 40) * 1.17;
  else delayRiskPercent = riskScores.environmentalRisk * 0.625;

  let costOverrunPercent: number;
  if (riskScores.infrastructureRisk > 70) costOverrunPercent = 50 + (riskScores.infrastructureRisk - 70) * 0.67;
  else if (riskScores.infrastructureRisk > 40) costOverrunPercent = 20 + (riskScores.infrastructureRisk - 40) * 1.0;
  else costOverrunPercent = riskScores.infrastructureRisk * 0.5;

  let covenantBreachPercent: number;
  if (riskScores.overallRisk > 70) covenantBreachPercent = 55 + (riskScores.overallRisk - 70) * 0.5;
  else if (riskScores.overallRisk > 40) covenantBreachPercent = 20 + (riskScores.overallRisk - 40) * 1.17;
  else covenantBreachPercent = riskScores.overallRisk * 0.5;

  if (riskScores.dataConfidence < 50) {
    delayRiskPercent *= 1.20;
    costOverrunPercent *= 1.20;
    covenantBreachPercent *= 1.20;
  }

  let reputationalRisk: string;
  if (riskScores.humanExposureRisk > 60 || riskScores.overallRisk > 70) reputationalRisk = "High";
  else if (riskScores.humanExposureRisk > 35 || riskScores.overallRisk > 45) reputationalRisk = "Medium";
  else reputationalRisk = "Low";

  const financialRisk = {
    delayRiskPercent: clamp(Math.round(delayRiskPercent), 0, 100),
    costOverrunPercent: clamp(Math.round(costOverrunPercent), 0, 100),
    covenantBreachPercent: clamp(Math.round(covenantBreachPercent), 0, 100),
    reputationalRisk,
  };

  let outcome: string;
  if (riskScores.overallRisk > 70) outcome = "DECLINE";
  else if (riskScores.overallRisk > 40) outcome = "CONDITION";
  else outcome = "PROCEED";

  const conditions: string[] = [];
  if (outcome !== "PROCEED") {
    if (!inputs.hasMonitoringData) conditions.push("Independent environmental monitoring required");
    if (!inputs.hasLabData) conditions.push("Independent laboratory validation required");
    if (!inputs.isIFCAligned) conditions.push("Alignment with IFC Performance Standards required");
    if (riskScores.environmentalRisk > 50) conditions.push("Environmental risk mitigation plan required");
    if (riskScores.infrastructureRisk > 50) conditions.push("Infrastructure resilience assessment required");
  }

  let insight = "";
  if (riskScores.overallRisk <= 40) insight = "Overall risk profile supports proceeding with standard due diligence protocols.";
  else if (riskScores.overallRisk <= 70) insight = "Risk profile requires conditional approval with specific mitigation measures.";
  else insight = "Risk profile exceeds acceptable thresholds. Fundamental risk mitigation required.";
  if (riskScores.dataConfidence < 50) insight += " Low data confidence increases uncertainty.";

  return { riskScores, financialRisk, decision: { outcome, conditions, insight } };
}

function generateRiskHistory(projectId: number, baseRisk: number, baseConfidence: number, hasMonitoring: boolean) {
  const entries = [];
  let risk = baseRisk;
  let confidence = baseConfidence;

  for (let month = 1; month <= 12; month++) {
    if (month === 3 && !hasMonitoring) {
      risk = Math.max(risk - 3, risk * 0.95);
    }
    if (month === 4) {
      confidence = Math.min(confidence + 5, 100);
      risk = Math.max(risk - 2, 10);
    }
    if (month === 6) {
      confidence = Math.min(confidence + 10, 100);
      risk = Math.max(risk - 5, 10);
    }
    if (month === 9) {
      confidence = Math.min(confidence + 5, 100);
      risk = Math.max(risk - 3, 10);
    }

    const jitter = (Math.random() - 0.5) * 4;
    entries.push({
      projectId,
      month,
      overallRisk: Math.round(Math.max(10, Math.min(100, risk + jitter)) * 10) / 10,
      dataConfidence: Math.round(Math.min(100, confidence) * 10) / 10,
    });
  }

  return entries;
}

async function seed() {
  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE monitoring_events RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE esap_items RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE covenants RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE framework_alignments RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE risk_history RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE portfolio_projects RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE portfolios RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE projects RESTART IDENTITY CASCADE`);

  console.log("Seeding projects...");

  const sampleProjects = [
    {
      name: "Kingston Solar Farm",
      country: "Jamaica",
      projectType: "Solar",
      investmentAmount: 25,
      floodRisk: 3, coastalExposure: 2, contaminationRisk: 1, regulatoryComplexity: 4,
      communitySensitivity: 3, waterStress: 2,
      hasLabData: true, hasMonitoringData: true, isIFCAligned: true,
    },
    {
      name: "Montego Bay Port Expansion",
      country: "Jamaica",
      projectType: "Port",
      investmentAmount: 35,
      floodRisk: 7, coastalExposure: 8, contaminationRisk: 5, regulatoryComplexity: 7,
      communitySensitivity: 6, waterStress: 4,
      hasLabData: false, hasMonitoringData: false, isIFCAligned: false,
    },
    {
      name: "Ocho Rios Resort Development",
      country: "Jamaica",
      projectType: "Hotel",
      investmentAmount: 18,
      floodRisk: 5, coastalExposure: 6, contaminationRisk: 3, regulatoryComplexity: 5,
      communitySensitivity: 7, waterStress: 5,
      hasLabData: true, hasMonitoringData: false, isIFCAligned: false,
    },
    {
      name: "Coastal Solar Phase II",
      country: "Jamaica",
      projectType: "Solar",
      investmentAmount: 18,
      floodRisk: 8, coastalExposure: 7, contaminationRisk: 4, regulatoryComplexity: 6,
      communitySensitivity: 5, waterStress: 6,
      hasLabData: false, hasMonitoringData: false, isIFCAligned: false,
    },
    {
      name: "Spanish Town Industrial Park",
      country: "Jamaica",
      projectType: "Industrial",
      investmentAmount: 12,
      floodRisk: 4, coastalExposure: 3, contaminationRisk: 6, regulatoryComplexity: 5,
      communitySensitivity: 8, waterStress: 4,
      hasLabData: true, hasMonitoringData: true, isIFCAligned: false,
    },
    {
      name: "Negril Agricultural Hub",
      country: "Jamaica",
      projectType: "Agriculture",
      investmentAmount: 8,
      floodRisk: 4, coastalExposure: 5, contaminationRisk: 2, regulatoryComplexity: 3,
      communitySensitivity: 4, waterStress: 7,
      hasLabData: true, hasMonitoringData: true, isIFCAligned: true,
    },
    {
      name: "Port Antonio Marina",
      country: "Jamaica",
      projectType: "Port",
      investmentAmount: 14,
      floodRisk: 6, coastalExposure: 7, contaminationRisk: 3, regulatoryComplexity: 5,
      communitySensitivity: 4, waterStress: 3,
      hasLabData: false, hasMonitoringData: true, isIFCAligned: false,
    },
  ];

  const insertedProjects: any[] = [];
  for (const proj of sampleProjects) {
    const analysis = analyzeProject(proj);
    const [inserted] = await db.insert(projectsTable).values({
      ...proj,
      environmentalRisk: analysis.riskScores.environmentalRisk,
      infrastructureRisk: analysis.riskScores.infrastructureRisk,
      humanExposureRisk: analysis.riskScores.humanExposureRisk,
      regulatoryRisk: analysis.riskScores.regulatoryRisk,
      dataConfidence: analysis.riskScores.dataConfidence,
      overallRisk: analysis.riskScores.overallRisk,
      delayRiskPercent: analysis.financialRisk.delayRiskPercent,
      costOverrunPercent: analysis.financialRisk.costOverrunPercent,
      covenantBreachPercent: analysis.financialRisk.covenantBreachPercent,
      reputationalRisk: analysis.financialRisk.reputationalRisk,
      decisionOutcome: analysis.decision.outcome,
      decisionConditions: analysis.decision.conditions,
      decisionInsight: analysis.decision.insight,
    }).returning();
    insertedProjects.push({ ...inserted, ...proj, analysis });
    console.log(`  ${proj.name} -> ${analysis.decision.outcome} (Risk: ${analysis.riskScores.overallRisk}, $${proj.investmentAmount}M)`);
  }

  console.log("\nSeeding risk history...");
  for (const proj of insertedProjects) {
    const history = generateRiskHistory(
      proj.id,
      proj.analysis.riskScores.overallRisk,
      proj.analysis.riskScores.dataConfidence,
      proj.hasMonitoringData
    );
    for (const entry of history) {
      await db.insert(riskHistoryTable).values(entry);
    }
    console.log(`  ${proj.name}: 12 months of history`);
  }

  console.log("\nSeeding portfolio...");
  const [portfolio] = await db.insert(portfoliosTable).values({
    name: "Caribbean Energy Fund",
  }).returning();
  console.log(`  Created portfolio: ${portfolio.name}`);

  const stages = ["Approved", "Pre-IC", "Early", "Early", "Pre-IC", "Approved", "Early"];
  for (let i = 0; i < insertedProjects.length; i++) {
    const proj = insertedProjects[i];
    await db.insert(portfolioProjectsTable).values({
      portfolioId: portfolio.id,
      projectId: proj.id,
      investmentAmount: proj.investmentAmount,
      stage: stages[i],
    });
    console.log(`  Added ${proj.name} to portfolio (${stages[i]}, $${proj.investmentAmount}M)`);
  }

  console.log("\nSeeding governance data...");

  const monitoringData: Array<{projectId: number; date: string; type: string; result: string; status: string; findings: string | null}> = [];

  for (const proj of insertedProjects) {
    if (proj.hasMonitoringData) {
      monitoringData.push(
        { projectId: proj.id, date: "2025-01-10", type: "Site Visit", result: "Pass", status: "Verified", findings: "No issues found during routine inspection" },
        { projectId: proj.id, date: "2025-02-15", type: "Lab Test", result: "Pass", status: "Verified", findings: "Water quality within acceptable parameters" },
        { projectId: proj.id, date: "2025-03-20", type: "Community Review", result: "Pass", status: "Verified", findings: "Community engagement session completed successfully" },
      );
    }
    if (proj.hasLabData) {
      monitoringData.push(
        { projectId: proj.id, date: "2025-01-05", type: "Lab Test", result: "Pass", status: "Verified", findings: "Soil contamination levels below threshold" },
      );
    }
  }

  const montegoBay = insertedProjects[1];
  monitoringData.push(
    { projectId: montegoBay.id, date: "2025-02-01", type: "Site Visit", result: "Issue Found", status: "Escalated", findings: "Unauthorized discharge near construction zone observed" },
    { projectId: montegoBay.id, date: "2025-03-10", type: "Audit", result: "Fail", status: "Escalated", findings: "ESMS documentation not available on site" },
  );

  const coastalSolar = insertedProjects[3];
  monitoringData.push(
    { projectId: coastalSolar.id, date: "2025-01-20", type: "Site Visit", result: "Issue Found", status: "Escalated", findings: "Drainage infrastructure inadequate for flood zone" },
  );

  for (const m of monitoringData) {
    await db.insert(monitoringEventsTable).values(m);
  }
  console.log(`  ${monitoringData.length} monitoring events`);

  const covenantSeeds: Array<{projectId: number; category: string; description: string; triggerCondition: string; status: string}> = [];

  for (const proj of insertedProjects) {
    if (!proj.hasLabData) {
      covenantSeeds.push({
        projectId: proj.id, category: "Environmental",
        description: "Independent water quality monitoring required quarterly to ISO 17025 standard",
        triggerCondition: "Lab data absent", status: "Pending"
      });
    }
    if (!proj.hasMonitoringData) {
      covenantSeeds.push({
        projectId: proj.id, category: "Environmental",
        description: "Continuous environmental monitoring system deployment within 60 days",
        triggerCondition: "No monitoring data available", status: "Pending"
      });
    }
    if (proj.floodRisk >= 5) {
      covenantSeeds.push({
        projectId: proj.id, category: "Environmental",
        description: "Flood risk mitigation infrastructure must be installed prior to drawdown",
        triggerCondition: "Flood risk score exceeds threshold",
        status: proj.hasMonitoringData ? "In Progress" : "Pending"
      });
    }
    if (!proj.isIFCAligned) {
      covenantSeeds.push({
        projectId: proj.id, category: "Monitoring",
        description: "Alignment with IFC Performance Standards required within 180 days",
        triggerCondition: "Project not currently IFC-aligned", status: "Pending"
      });
    }
    if (proj.communitySensitivity >= 5) {
      covenantSeeds.push({
        projectId: proj.id, category: "Social",
        description: "Community stakeholder engagement plan required prior to construction",
        triggerCondition: "Community sensitivity exceeds threshold",
        status: proj.hasMonitoringData ? "In Progress" : "Pending"
      });
    }
    covenantSeeds.push({
      projectId: proj.id, category: "Monitoring",
      description: "Quarterly E&S monitoring reports submitted to lender",
      triggerCondition: "Standard monitoring obligation",
      status: proj.hasMonitoringData ? "Met" : "Pending"
    });
  }

  covenantSeeds.push({
    projectId: montegoBay.id, category: "Environmental",
    description: "Contamination assessment to ISO17025 standard prior to drawdown",
    triggerCondition: "High contamination risk + no lab data", status: "Breach"
  });

  for (const c of covenantSeeds) {
    await db.insert(covenantsTable).values(c);
  }
  console.log(`  ${covenantSeeds.length} covenants`);

  const esapSeeds: Array<{projectId: number; action: string; owner: string; deadline: string; status: string; evidence: string | null}> = [];

  for (const proj of insertedProjects) {
    if (!proj.hasLabData) {
      esapSeeds.push({ projectId: proj.id, action: "Conduct independent laboratory testing of soil and water samples", owner: "Sponsor", deadline: "90 days", status: "Not Started", evidence: null });
    }
    if (!proj.hasMonitoringData) {
      esapSeeds.push({ projectId: proj.id, action: "Deploy continuous environmental monitoring stations", owner: "Sponsor", deadline: "60 days", status: "Not Started", evidence: null });
    }
    if (!proj.isIFCAligned) {
      esapSeeds.push({ projectId: proj.id, action: "Complete IFC Performance Standards gap analysis", owner: "E&S Consultant", deadline: "120 days", status: "In Progress", evidence: null });
    }
    esapSeeds.push({ projectId: proj.id, action: "Prepare Environmental & Social Management System (ESMS)", owner: "Sponsor", deadline: "180 days", status: proj.hasMonitoringData ? "In Progress" : "Not Started", evidence: null });
    esapSeeds.push({ projectId: proj.id, action: "Submit initial E&S monitoring report", owner: "Sponsor", deadline: "30 days", status: proj.hasMonitoringData ? "Complete" : "Not Started", evidence: proj.hasMonitoringData ? "Report submitted" : null });
  }

  esapSeeds.push(
    { projectId: montegoBay.id, action: "Conduct Phase II environmental site assessment", owner: "Environmental Consultant", deadline: "60 days", status: "Overdue", evidence: null },
    { projectId: montegoBay.id, action: "Develop flood risk mitigation and drainage plan", owner: "Civil Engineer", deadline: "90 days", status: "Not Started", evidence: null },
    { projectId: coastalSolar.id, action: "Complete coastal vulnerability and climate adaptation assessment", owner: "Climate Consultant", deadline: "120 days", status: "Overdue", evidence: null },
  );

  for (const e of esapSeeds) {
    await db.insert(esapItemsTable).values(e);
  }
  console.log(`  ${esapSeeds.length} ESAP items`);

  const auditSeeds = [
    { projectId: insertedProjects[0].id, action: "Project Created", user: "System", details: "Kingston Solar Farm added to platform" },
    { projectId: insertedProjects[0].id, action: "Risk Assessment Complete", user: "System", details: "Overall risk: 25.6 — PROCEED" },
    { projectId: montegoBay.id, action: "Project Created", user: "System", details: "Montego Bay Port Expansion added to platform" },
    { projectId: montegoBay.id, action: "Risk Assessment Complete", user: "System", details: "Overall risk: 76.9 — DECLINE" },
    { projectId: montegoBay.id, action: "Risk Updated", user: "Analyst", details: "Contamination risk revised: 4 → 5 based on site survey" },
    { projectId: montegoBay.id, action: "Covenant Breach Detected", user: "System", details: "ISO17025 contamination assessment not completed by deadline" },
    { projectId: montegoBay.id, action: "Escalation Triggered", user: "System", details: "Breach escalated to Investment Officer for review" },
    { projectId: coastalSolar.id, action: "Project Created", user: "System", details: "Coastal Solar Phase II added to platform" },
    { projectId: coastalSolar.id, action: "ESAP Item Overdue", user: "System", details: "Coastal vulnerability assessment past deadline" },
    { projectId: insertedProjects[2].id, action: "Monitoring Event", user: "Analyst", details: "Site visit completed — community concerns noted" },
    { projectId: insertedProjects[4].id, action: "Covenant Status Updated", user: "Investment Officer", details: "Quarterly monitoring report: Pending → Met" },
  ];

  for (const a of auditSeeds) {
    await db.insert(auditLogsTable).values(a);
  }
  console.log(`  ${auditSeeds.length} audit log entries`);

  console.log("\nSeeding complete!");
  console.log(`  ${insertedProjects.length} projects`);
  console.log(`  ${insertedProjects.length * 12} risk history entries`);
  console.log(`  1 portfolio with ${insertedProjects.length} assignments`);
  console.log(`  ${covenantSeeds.length} covenants`);
  console.log(`  ${esapSeeds.length} ESAP items`);
  console.log(`  ${monitoringData.length} monitoring events`);
  console.log(`  ${auditSeeds.length} audit log entries`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
