import { db, projectsTable } from "@workspace/db";
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

async function seed() {
  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE projects RESTART IDENTITY CASCADE`);

  console.log("Seeding portfolio data...");

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

  for (const proj of sampleProjects) {
    const analysis = analyzeProject(proj);
    await db.insert(projectsTable).values({
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
    });
    console.log(`  ${proj.name} → ${analysis.decision.outcome} (Risk: ${analysis.riskScores.overallRisk}, $${proj.investmentAmount}M)`);
  }

  console.log("\nPortfolio seeded with 7 projects!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
