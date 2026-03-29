import { db, projectsTable, portfoliosTable, portfolioProjectsTable, riskHistoryTable, covenantsTable, esapItemsTable, monitoringEventsTable, auditLogsTable, frameworkAlignmentsTable, regionalDataTable, regionalIndicesTable, sectorBenchmarksTable, dataLayersTable, projectDataLayersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

function seedEncrypt(plaintext: string): string {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is required for seeding");
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

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
  await db.execute(sql`TRUNCATE TABLE project_data_layers RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE data_layers RESTART IDENTITY CASCADE`);
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
      investmentAmount: seedEncrypt(String(proj.investmentAmount)),
      environmentalRisk: analysis.riskScores.environmentalRisk,
      infrastructureRisk: analysis.riskScores.infrastructureRisk,
      humanExposureRisk: analysis.riskScores.humanExposureRisk,
      regulatoryRisk: analysis.riskScores.regulatoryRisk,
      dataConfidence: analysis.riskScores.dataConfidence,
      overallRisk: analysis.riskScores.overallRisk,
      delayRiskPercent: seedEncrypt(String(analysis.financialRisk.delayRiskPercent)),
      costOverrunPercent: seedEncrypt(String(analysis.financialRisk.costOverrunPercent)),
      covenantBreachPercent: seedEncrypt(String(analysis.financialRisk.covenantBreachPercent)),
      reputationalRisk: seedEncrypt(analysis.financialRisk.reputationalRisk),
      decisionOutcome: seedEncrypt(analysis.decision.outcome),
      decisionConditions: seedEncrypt(JSON.stringify(analysis.decision.conditions)),
      decisionInsight: seedEncrypt(analysis.decision.insight),
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

  // ── V4: Regional Data ──
  console.log("\n── V4: Regional Dataset Engine ──");
  await db.execute(sql`TRUNCATE regional_data, regional_indices, sector_benchmarks RESTART IDENTITY CASCADE`);

  const caribbeanCountries = [
    { country: "Jamaica", regions: ["Kingston", "St. Andrew", "St. Catherine", "Montego Bay", "Ocho Rios", "Port Antonio", "St. Elizabeth", "Negril"] },
    { country: "Dominican Republic", regions: ["Santo Domingo", "Punta Cana", "Santiago", "Puerto Plata", "La Romana"] },
    { country: "Trinidad & Tobago", regions: ["Port of Spain", "San Fernando", "Chaguanas", "Tobago"] },
    { country: "Barbados", regions: ["Bridgetown", "Christ Church", "St. James", "St. Philip"] },
    { country: "Bahamas", regions: ["Nassau", "Freeport", "Exuma", "Abaco"] },
    { country: "Guyana", regions: ["Georgetown", "Linden", "New Amsterdam", "Bartica"] },
    { country: "Suriname", regions: ["Paramaribo", "Nickerie", "Commewijne"] },
    { country: "Haiti", regions: ["Port-au-Prince", "Cap-Haitien", "Les Cayes", "Gonaives"] },
    { country: "Cuba", regions: ["Havana", "Santiago de Cuba", "Varadero", "Trinidad"] },
    { country: "Puerto Rico", regions: ["San Juan", "Ponce", "Mayaguez", "Caguas"] },
    { country: "Cayman Islands", regions: ["George Town", "West Bay", "Bodden Town"] },
    { country: "Belize", regions: ["Belize City", "San Pedro", "Belmopan", "Dangriga"] },
    { country: "St. Lucia", regions: ["Castries", "Soufriere", "Vieux Fort"] },
    { country: "Grenada", regions: ["St. George's", "Gouyave", "Grenville"] },
  ];

  const datasetTypes = ["Coastal Risk", "Flood Risk", "Water Quality", "Infrastructure Failure", "Community Risk"];
  const rng = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

  const countryRiskProfiles: Record<string, { base: number; infra: number; water: number; conf: number }> = {
    "Jamaica": { base: 58, infra: 55, water: 52, conf: 65 },
    "Dominican Republic": { base: 62, infra: 50, water: 48, conf: 60 },
    "Trinidad & Tobago": { base: 48, infra: 45, water: 40, conf: 72 },
    "Barbados": { base: 42, infra: 38, water: 35, conf: 78 },
    "Bahamas": { base: 55, infra: 52, water: 45, conf: 68 },
    "Guyana": { base: 65, infra: 62, water: 58, conf: 50 },
    "Suriname": { base: 60, infra: 58, water: 55, conf: 45 },
    "Haiti": { base: 82, infra: 78, water: 75, conf: 35 },
    "Cuba": { base: 52, infra: 48, water: 42, conf: 55 },
    "Puerto Rico": { base: 50, infra: 42, water: 38, conf: 75 },
    "Cayman Islands": { base: 38, infra: 32, water: 30, conf: 82 },
    "Belize": { base: 58, infra: 55, water: 50, conf: 55 },
    "St. Lucia": { base: 52, infra: 48, water: 44, conf: 62 },
    "Grenada": { base: 50, infra: 46, water: 42, conf: 60 },
  };

  let regionalDataCount = 0;
  for (const { country, regions } of caribbeanCountries) {
    for (const region of regions) {
      for (const dt of datasetTypes) {
        const profile = countryRiskProfiles[country];
        let baseVal = profile.base;
        if (dt === "Coastal Risk") baseVal = rng(baseVal - 5, baseVal + 15);
        else if (dt === "Flood Risk") baseVal = rng(baseVal - 10, baseVal + 10);
        else if (dt === "Water Quality") baseVal = rng(profile.water - 8, profile.water + 12);
        else if (dt === "Infrastructure Failure") baseVal = rng(profile.infra - 5, profile.infra + 10);
        else baseVal = rng(baseVal - 15, baseVal + 5);

        await db.insert(regionalDataTable).values({
          country, region, datasetType: dt,
          value: clamp(baseVal, 5, 95), unit: "score",
          timestamp: new Date(`2025-01-15`),
        });
        regionalDataCount++;
      }
    }
  }
  console.log(`  ${regionalDataCount} regional data points`);

  // Regional Indices (multi-year 2021-2025)
  let indicesCount = 0;
  for (const [country, profile] of Object.entries(countryRiskProfiles)) {
    for (let year = 2021; year <= 2025; year++) {
      const drift = (year - 2021) * rng(-1.5, 2.5);
      await db.insert(regionalIndicesTable).values({
        country,
        riskScore: clamp(profile.base + drift, 10, 95),
        infrastructureScore: clamp(profile.infra + drift * 0.8, 10, 95),
        waterStressScore: clamp(profile.water + drift * 1.2, 10, 95),
        confidence: clamp(profile.conf + (year - 2021) * rng(0.5, 2), 15, 95),
        year,
      });
      indicesCount++;
    }
  }
  console.log(`  ${indicesCount} regional index entries`);

  // Sector Benchmarks
  const sectorData = [
    { sector: "Solar", metric: "Overall Risk", avgRisk: 45, avgConfidence: 70, sampleSize: 34 },
    { sector: "Solar", metric: "Coastal Risk", avgRisk: 52, avgConfidence: 68, sampleSize: 34 },
    { sector: "Port", metric: "Overall Risk", avgRisk: 62, avgConfidence: 65, sampleSize: 18 },
    { sector: "Port", metric: "Coastal Risk", avgRisk: 72, avgConfidence: 62, sampleSize: 18 },
    { sector: "Hotel", metric: "Overall Risk", avgRisk: 48, avgConfidence: 72, sampleSize: 45 },
    { sector: "Hotel", metric: "Community Risk", avgRisk: 55, avgConfidence: 70, sampleSize: 45 },
    { sector: "Wind", metric: "Overall Risk", avgRisk: 42, avgConfidence: 68, sampleSize: 12 },
    { sector: "Wind", metric: "Coastal Risk", avgRisk: 58, avgConfidence: 65, sampleSize: 12 },
    { sector: "Mining", metric: "Overall Risk", avgRisk: 68, avgConfidence: 55, sampleSize: 8 },
    { sector: "Mining", metric: "Water Quality", avgRisk: 75, avgConfidence: 50, sampleSize: 8 },
    { sector: "Agriculture", metric: "Overall Risk", avgRisk: 38, avgConfidence: 60, sampleSize: 22 },
    { sector: "Agriculture", metric: "Water Quality", avgRisk: 52, avgConfidence: 58, sampleSize: 22 },
  ];

  for (const s of sectorData) {
    for (let year = 2022; year <= 2025; year++) {
      const drift = (year - 2022) * rng(-1, 2);
      await db.insert(sectorBenchmarksTable).values({
        sector: s.sector, metric: s.metric,
        avgRisk: clamp(s.avgRisk + drift, 10, 95),
        avgConfidence: clamp(s.avgConfidence + (year - 2022) * rng(0.5, 1.5), 20, 95),
        sampleSize: s.sampleSize + (year - 2022) * Math.floor(rng(1, 5)),
        year,
      });
    }
  }
  console.log(`  ${sectorData.length * 4} sector benchmark entries`);

  console.log("Seeding Jamaica data layers...");
  const jamaicaLayers = [
    { layerId: "1.1", layerName: "Flood Hazard Maps", category: "Environmental Hazards", country: "Jamaica", sourceName: "Water Resources Authority (WRA)", sourceUrl: "https://www.wra.gov.jm/resources/maps/", format: "Feature service / Web GIS", resolution: "Mapped flood boundaries", coverageArea: "National (select floodplains)", accessMethod: "Public ArcGIS service + agency request", quality: "Partial", notes: "WRA ArcGIS services for national flood boundaries; includes Rio Cobre return-period layers but limited coverage", riskDomain: "environmental", confidenceWeight: 1.5 },
    { layerId: "1.2", layerName: "Storm Surge / Coastal Inundation", category: "Environmental Hazards", country: "Jamaica", sourceName: "ODPEM / CCRIF / CDEMA", sourceUrl: "https://www.odpem.org.jm/", format: "Web GIS / PDF maps", resolution: "Variable", coverageArea: "Coastal zones", accessMethod: "Public portals + agency request", quality: "Partial", notes: "ODPEM hazard maps available; no single national storm-surge raster grid yet", riskDomain: "environmental", confidenceWeight: 1.5 },
    { layerId: "1.3", layerName: "Seismic Hazard", category: "Environmental Hazards", country: "Jamaica", sourceName: "Earthquake Unit (UWI)", sourceUrl: "https://www.mona.uwi.edu/earthquake/", format: "Web maps / PDF", resolution: "National", coverageArea: "National", accessMethod: "Public", quality: "Good", notes: "UWI Earthquake Unit provides seismic hazard maps and historical event data", riskDomain: "environmental", confidenceWeight: 1.0 },
    { layerId: "1.4", layerName: "Contamination Sources (PRTR)", category: "Environmental Hazards", country: "Jamaica", sourceName: "NEPA PRTR services", sourceUrl: "https://www.nepa.gov.jm/", format: "Feature service", resolution: "Point locations", coverageArea: "National", accessMethod: "Public ArcGIS service", quality: "Good", notes: "Official NEPA PRTR services identified in tightening pass; moved from Partial to Good", riskDomain: "environmental", confidenceWeight: 1.2 },
    { layerId: "1.5", layerName: "Hurricane Tracks / Wind History", category: "Environmental Hazards", country: "Jamaica", sourceName: "IBTrACS (NOAA)", sourceUrl: "https://www.ncei.noaa.gov/products/international-best-track-archive", format: "Shapefile / CSV", resolution: "Track-level", coverageArea: "Caribbean basin", accessMethod: "Public download", quality: "Good", notes: "IBTrACS provides comprehensive historical hurricane track data for the Caribbean", riskDomain: "environmental", confidenceWeight: 1.0 },
    { layerId: "1.6", layerName: "Watersheds / Drainage Basins", category: "Environmental Hazards", country: "Jamaica", sourceName: "WRA + HydroSHEDS", sourceUrl: "https://www.hydrosheds.org/", format: "Shapefile / raster", resolution: "~500m (HydroSHEDS)", coverageArea: "National", accessMethod: "Public download", quality: "Good", notes: "WRA watershed boundaries plus HydroSHEDS global drainage dataset", riskDomain: "environmental", confidenceWeight: 1.0 },
    { layerId: "2.1", layerName: "Water Stress Index", category: "Infrastructure & Utilities", country: "Jamaica", sourceName: "WRI Aqueduct", sourceUrl: "https://www.wri.org/aqueduct", format: "Web service / GeoTIFF", resolution: "Sub-basin", coverageArea: "Global (Jamaica included)", accessMethod: "Public download", quality: "Good", notes: "Aqueduct 4.0 provides baseline and projected water stress at sub-basin resolution", riskDomain: "infrastructure", confidenceWeight: 1.0 },
    { layerId: "2.2", layerName: "Water / Sewer Service Areas", category: "Infrastructure & Utilities", country: "Jamaica", sourceName: "NWC / OUR", sourceUrl: "https://www.nwcjamaica.com/", format: "PDF / web maps", resolution: "Variable", coverageArea: "Utility service zones", accessMethod: "Public + agency request", quality: "Partial", notes: "NWC service area maps available but not in standardised GIS format", riskDomain: "infrastructure", confidenceWeight: 1.2 },
    { layerId: "2.3", layerName: "Road Network", category: "Infrastructure & Utilities", country: "Jamaica", sourceName: "NWA + OSM", sourceUrl: "https://www.nwa.gov.jm/", format: "Shapefile / OSM extract", resolution: "Road-level", coverageArea: "National", accessMethod: "Public download", quality: "Good", notes: "NWA official road data supplemented by OpenStreetMap for complete coverage", riskDomain: "infrastructure", confidenceWeight: 0.8 },
    { layerId: "2.4", layerName: "Power Grid / Transmission", category: "Infrastructure & Utilities", country: "Jamaica", sourceName: "JPS Co.", sourceUrl: "https://www.jpsco.com/", format: "PDF maps", resolution: "Regional", coverageArea: "National grid", accessMethod: "Public annual filings", quality: "Partial", notes: "JPS distribution network maps available as PDF; no GIS export", riskDomain: "infrastructure", confidenceWeight: 1.0 },
    { layerId: "2.5", layerName: "Power Reliability (SAIDI/SAIFI)", category: "Infrastructure & Utilities", country: "Jamaica", sourceName: "OUR / JPS annual filing", sourceUrl: "https://our.org.jm/", format: "PDF / tabular", resolution: "District / feeder", coverageArea: "National", accessMethod: "Public regulatory filings", quality: "Partial", notes: "Reliability metrics in annual filings but not in machine-readable GIS format", riskDomain: "infrastructure", confidenceWeight: 1.0 },
    { layerId: "3.1", layerName: "Population Density", category: "Social & Community", country: "Jamaica", sourceName: "WorldPop + STATIN", sourceUrl: "https://www.worldpop.org/", format: "GeoTIFF (100m)", resolution: "100m grid", coverageArea: "National", accessMethod: "Public download", quality: "Good", notes: "WorldPop 2020 100m raster downloaded; cross-referenced with STATIN parish-level data", riskDomain: "social", confidenceWeight: 1.0 },
    { layerId: "3.2", layerName: "Sensitive Receptors (Health/Schools)", category: "Social & Community", country: "Jamaica", sourceName: "data.gov.jm + OSM", sourceUrl: "https://data.gov.jm/", format: "CSV with coordinates", resolution: "Point locations", coverageArea: "National", accessMethod: "Public download", quality: "Good", notes: "Health centres, hospitals, and school locations with geospatial coordinates downloaded", riskDomain: "social", confidenceWeight: 1.0 },
    { layerId: "3.3", layerName: "Health Burden / Disease Surveillance", category: "Social & Community", country: "Jamaica", sourceName: "MOHW / PAHO", sourceUrl: "https://www.moh.gov.jm/", format: "PDF bulletins / web tables", resolution: "Parish-level", coverageArea: "National", accessMethod: "Public bulletins", quality: "Partial", notes: "Weekly epidemiological bulletins available; parish-level health burden table not yet standardised", riskDomain: "social", confidenceWeight: 1.0 },
    { layerId: "3.4", layerName: "Informal Settlements", category: "Social & Community", country: "Jamaica", sourceName: "STATIN SDG 11.1.1 + Google Open Buildings", sourceUrl: "https://sdgnrp.statinja.gov.jm/11-1-1/", format: "Web indicator + spatial proxy", resolution: "National indicator / building footprints", coverageArea: "National", accessMethod: "Public", quality: "Partial", notes: "SDG indicator available; official polygons for informal settlements not yet published", riskDomain: "social", confidenceWeight: 1.2 },
    { layerId: "3.5", layerName: "Employment by Industry", category: "Social & Community", country: "Jamaica", sourceName: "STATIN", sourceUrl: "https://statinja.gov.jm/labourforce/", format: "Web tables / PDF", resolution: "National / parish", coverageArea: "National", accessMethod: "Public", quality: "Partial", notes: "Labour force tables available but limited spatial granularity", riskDomain: "social", confidenceWeight: 0.8 },
    { layerId: "4.1", layerName: "Protected Areas", category: "Regulatory & Planning", country: "Jamaica", sourceName: "WDPA + GOJ official service", sourceUrl: "https://www.protectedplanet.net/", format: "Shapefile / Feature service", resolution: "Polygon boundaries", coverageArea: "National", accessMethod: "Public download", quality: "Good", notes: "WDPA polygons plus official GOJ ArcGIS service for protected areas", riskDomain: "regulatory", confidenceWeight: 1.0 },
    { layerId: "4.2", layerName: "Zoning / Land Use Plans", category: "Regulatory & Planning", country: "Jamaica", sourceName: "NEPA Town & Country Plans", sourceUrl: "https://www.nepa.gov.jm/planning-and-development/town-and-country-plans", format: "PDF development orders / maps", resolution: "Variable", coverageArea: "Municipal", accessMethod: "Public", quality: "Partial", notes: "Development orders publicly available but not as parcel-ready GIS polygons", riskDomain: "regulatory", confidenceWeight: 1.3 },
    { layerId: "4.3", layerName: "Coastal Zone Management", category: "Regulatory & Planning", country: "Jamaica", sourceName: "NEPA Beach Control", sourceUrl: "https://www.nepa.gov.jm/", format: "Regulatory framework / maps", resolution: "Coastal zone", coverageArea: "National coastline", accessMethod: "Public", quality: "Partial", notes: "Beach control policies exist; spatial delineation is partial", riskDomain: "regulatory", confidenceWeight: 1.0 },
    { layerId: "4.4", layerName: "Permit Timelines", category: "Regulatory & Planning", country: "Jamaica", sourceName: "NEPA / Parish councils", sourceUrl: "https://www.nepa.gov.jm/", format: "Tabular / reports", resolution: "National", coverageArea: "National", accessMethod: "Agency request", quality: "Proxy", notes: "No standardised permit-timeline database; anecdotal and report-based data only", riskDomain: "regulatory", confidenceWeight: 1.2 },
    { layerId: "4.5", layerName: "Heritage Sites / Cultural Assets", category: "Regulatory & Planning", country: "Jamaica", sourceName: "JNHT", sourceUrl: "https://www.jnht.com/", format: "Web listing / PDF", resolution: "Point / polygon", coverageArea: "National", accessMethod: "Public", quality: "Partial", notes: "JNHT site listings available; no unified GIS heritage layer yet", riskDomain: "regulatory", confidenceWeight: 0.8 },
  ];

  const insertedLayers = await db.insert(dataLayersTable).values(jamaicaLayers).returning();
  console.log(`  ${insertedLayers.length} Jamaica data layers inserted`);

  console.log("Linking data layers to Jamaica projects...");
  const projectLayerLinks: { projectId: number; dataLayerId: number; status: string; overrideQuality: string | null; notes: string | null }[] = [];

  for (const project of insertedProjects) {
    if (project.country !== "Jamaica") continue;

    for (const layer of insertedLayers) {
      let status = "Inherited";
      let overrideQuality: string | null = null;
      let notes: string | null = null;

      if (project.hasLabData && (layer.layerId === "1.4" || layer.layerId === "3.2")) {
        status = "Verified";
        overrideQuality = "Good";
        notes = "Lab data confirms site-specific conditions";
      }
      if (project.hasMonitoringData && (layer.layerId === "2.1" || layer.layerId === "1.1")) {
        status = "Verified";
        if (layer.quality === "Partial") overrideQuality = "Good";
        notes = "Monitoring data provides ongoing site validation";
      }
      if (project.isIFCAligned && (layer.layerId === "4.1" || layer.layerId === "4.2")) {
        status = "Verified";
        if (layer.quality === "Partial") overrideQuality = "Good";
        notes = "IFC alignment verified against planning requirements";
      }

      projectLayerLinks.push({ projectId: project.id, dataLayerId: layer.id, status, overrideQuality, notes });
    }
  }

  if (projectLayerLinks.length > 0) {
    await db.insert(projectDataLayersTable).values(projectLayerLinks);
  }
  console.log(`  ${projectLayerLinks.length} project-layer associations created`);

  console.log("\nSeeding complete!");
  console.log(`  ${insertedProjects.length} projects`);
  console.log(`  ${insertedProjects.length * 12} risk history entries`);
  console.log(`  1 portfolio with ${insertedProjects.length} assignments`);
  console.log(`  ${covenantSeeds.length} covenants`);
  console.log(`  ${esapSeeds.length} ESAP items`);
  console.log(`  ${monitoringData.length} monitoring events`);
  console.log(`  ${auditSeeds.length} audit log entries`);
  console.log(`  ${regionalDataCount} regional data points`);
  console.log(`  ${indicesCount} regional index entries`);
  console.log(`  ${sectorData.length * 4} sector benchmarks`);
  console.log(`  ${insertedLayers.length} data layers`);
  console.log(`  ${projectLayerLinks.length} project-layer links`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
