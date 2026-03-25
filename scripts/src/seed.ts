import { db, projectsTable } from "@workspace/db";

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

  const environmentalRisk = clamp(
    (flood * 0.25) + (contamination * 0.25) + (water * 0.20) + (coastal * 0.30), 0, 100
  );
  const infrastructureRisk = clamp(
    (flood * 0.35) + (coastal * 0.35) + (regulatory * 0.30), 0, 100
  );
  const humanExposureRisk = clamp(
    (community * 0.50) + (contamination * 0.50), 0, 100
  );
  const regulatoryRisk = clamp(
    (regulatory * 0.60) + (community * 0.25) + (contamination * 0.15), 0, 100
  );

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
  if (riskScores.environmentalRisk > 70) {
    delayRiskPercent = 60 + (riskScores.environmentalRisk - 70) * 0.67;
  } else if (riskScores.environmentalRisk > 40) {
    delayRiskPercent = 25 + (riskScores.environmentalRisk - 40) * 1.17;
  } else {
    delayRiskPercent = riskScores.environmentalRisk * 0.625;
  }

  let costOverrunPercent: number;
  if (riskScores.infrastructureRisk > 70) {
    costOverrunPercent = 50 + (riskScores.infrastructureRisk - 70) * 0.67;
  } else if (riskScores.infrastructureRisk > 40) {
    costOverrunPercent = 20 + (riskScores.infrastructureRisk - 40) * 1.0;
  } else {
    costOverrunPercent = riskScores.infrastructureRisk * 0.5;
  }

  let covenantBreachPercent: number;
  if (riskScores.overallRisk > 70) {
    covenantBreachPercent = 55 + (riskScores.overallRisk - 70) * 0.5;
  } else if (riskScores.overallRisk > 40) {
    covenantBreachPercent = 20 + (riskScores.overallRisk - 40) * 1.17;
  } else {
    covenantBreachPercent = riskScores.overallRisk * 0.5;
  }

  if (riskScores.dataConfidence < 50) {
    delayRiskPercent *= 1.20;
    costOverrunPercent *= 1.20;
    covenantBreachPercent *= 1.20;
  }

  let reputationalRisk: string;
  if (riskScores.humanExposureRisk > 60 || riskScores.overallRisk > 70) {
    reputationalRisk = "High";
  } else if (riskScores.humanExposureRisk > 35 || riskScores.overallRisk > 45) {
    reputationalRisk = "Medium";
  } else {
    reputationalRisk = "Low";
  }

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
    if (!inputs.hasMonitoringData) conditions.push("Independent environmental monitoring required prior to investment commitment");
    if (!inputs.hasLabData) conditions.push("Independent laboratory validation of environmental baseline data required");
    if (!inputs.isIFCAligned) conditions.push("Alignment with IFC Performance Standards required for international financing");
    if (riskScores.environmentalRisk > 50) conditions.push("Environmental risk mitigation plan with quarterly reporting covenants");
    if (riskScores.infrastructureRisk > 50) conditions.push("Infrastructure resilience assessment and climate adaptation plan required");
  }

  let insight = "";
  if (riskScores.overallRisk <= 40) {
    insight = "Overall risk profile supports proceeding with standard due diligence protocols. Environmental factors are within acceptable ranges for investment.";
  } else if (riskScores.overallRisk <= 70) {
    insight = "Risk profile requires conditional approval with specific mitigation measures and enhanced monitoring. Additional data collection recommended.";
  } else {
    insight = "Risk profile exceeds acceptable thresholds for investment. Fundamental risk mitigation required before reconsideration.";
  }

  if (riskScores.dataConfidence < 50) {
    insight += " Low data confidence significantly increases uncertainty in all risk projections.";
  }

  return { riskScores, financialRisk, decision: { outcome, conditions, insight } };
}

async function seed() {
  console.log("Seeding database...");

  const sampleProjects = [
    {
      name: "Kingston Solar Farm",
      country: "Jamaica",
      projectType: "Solar",
      floodRisk: 3,
      coastalExposure: 2,
      contaminationRisk: 1,
      regulatoryComplexity: 4,
      communitySensitivity: 3,
      waterStress: 2,
      hasLabData: true,
      hasMonitoringData: true,
      isIFCAligned: true,
    },
    {
      name: "Montego Bay Port Expansion",
      country: "Jamaica",
      projectType: "Port",
      floodRisk: 7,
      coastalExposure: 8,
      contaminationRisk: 5,
      regulatoryComplexity: 7,
      communitySensitivity: 6,
      waterStress: 4,
      hasLabData: false,
      hasMonitoringData: false,
      isIFCAligned: false,
    },
    {
      name: "Ocho Rios Resort Development",
      country: "Jamaica",
      projectType: "Hotel",
      floodRisk: 5,
      coastalExposure: 6,
      contaminationRisk: 3,
      regulatoryComplexity: 5,
      communitySensitivity: 7,
      waterStress: 5,
      hasLabData: true,
      hasMonitoringData: false,
      isIFCAligned: false,
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
    console.log(`  Seeded: ${proj.name} → ${analysis.decision.outcome}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
