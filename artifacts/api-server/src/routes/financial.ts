import { Router, type IRouter } from "express";
import { db, projectsTable, financialImpactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { translateEnvironmentalIntelligence, translateScenario, translatePortfolio, type CapitalMode } from "../lib/capital-translator";

const router: IRouter = Router();

const BASE_RATE = 8.0;
const BASE_PREMIUM_RATE = 0.01;
const LOAN_TERM_YEARS = 10;

function calculateFinancialImpact(project: typeof projectsTable.$inferSelect) {
  let rateAdjustment = 0;
  if (project.overallRisk > 75) rateAdjustment = 1.5;
  else if (project.overallRisk >= 60) rateAdjustment = 1.0;
  else if (project.overallRisk >= 40) rateAdjustment = 0.5;

  let confidencePenalty = 0;
  if (project.dataConfidence < 50) confidencePenalty = 0.5;

  const finalRate = Math.round((BASE_RATE + rateAdjustment + confidencePenalty) * 10) / 10;

  const projectValue = project.investmentAmount * 1_000_000;
  const basePremium = projectValue * BASE_PREMIUM_RATE;
  let premiumMultiplier = 1;
  if (project.coastalExposure > 7) premiumMultiplier += 0.25;
  if (project.floodRisk > 7) premiumMultiplier += 0.20;
  if (project.overallRisk > 70) premiumMultiplier += 0.15;
  const adjustedPremium = Math.round(basePremium * premiumMultiplier);
  const premiumIncrease = adjustedPremium - basePremium;

  let covenantLevel = "LOW";
  const covenantRequirements: string[] = [];
  if (project.overallRisk > 70 && project.dataConfidence < 60) {
    covenantLevel = "HIGH";
    covenantRequirements.push("Independent environmental monitoring", "Third-party lab validation", "Quarterly ESG reporting", "Annual independent audit");
  } else if (project.overallRisk >= 50) {
    covenantLevel = "MEDIUM";
    covenantRequirements.push("Semi-annual monitoring", "Annual environmental report");
  } else {
    covenantRequirements.push("Standard annual reporting");
  }

  const additionalFinancingCost = Math.round(projectValue * (rateAdjustment + confidencePenalty) / 100 * LOAN_TERM_YEARS);
  const totalLifetimeImpact = additionalFinancingCost + (premiumIncrease * LOAN_TERM_YEARS);

  return {
    baseRate: BASE_RATE,
    rateAdjustment: Math.round((rateAdjustment + confidencePenalty) * 10) / 10,
    riskPremium: Math.round(rateAdjustment * 10) / 10,
    confidencePenalty,
    finalRate,
    basePremium: Math.round(basePremium),
    adjustedPremium,
    premiumIncrease: Math.round(premiumIncrease),
    premiumMultiplier: Math.round(premiumMultiplier * 100) / 100,
    covenantLevel,
    covenantRequirements,
    additionalFinancingCost,
    totalLifetimeImpact,
    projectValue,
    overallRisk: project.overallRisk,
    dataConfidence: project.dataConfidence,
    coastalExposure: project.coastalExposure,
    floodRisk: project.floodRisk,
  };
}

router.get("/financial/project/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const impact = calculateFinancialImpact(project);

  const highRiskProjects = await db.select().from(projectsTable);
  const totalCapital = highRiskProjects.reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskCapital = highRiskProjects.filter(p => p.overallRisk > 70).reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskPercent = totalCapital > 0 ? Math.round((highRiskCapital / totalCapital) * 100) : 0;
  const capitalBreachPercent = highRiskPercent;
  const capitalPolicyLimit = 25;
  const capitalBreach = highRiskPercent > capitalPolicyLimit;

  res.json({
    project: { id: project.id, name: project.name, country: project.country, projectType: project.projectType, investmentAmount: project.investmentAmount },
    loanPricing: {
      baseRate: impact.baseRate,
      riskPremium: impact.riskPremium,
      confidencePenalty: impact.confidencePenalty,
      totalAdjustment: impact.rateAdjustment,
      finalRate: impact.finalRate,
    },
    insurance: {
      basePremium: impact.basePremium,
      adjustedPremium: impact.adjustedPremium,
      increase: impact.premiumIncrease,
      multiplier: impact.premiumMultiplier,
      factors: [
        ...(project.coastalExposure > 7 ? [`Coastal exposure ${project.coastalExposure.toFixed(1)} (+25%)`] : []),
        ...(project.floodRisk > 7 ? [`Flood risk ${project.floodRisk.toFixed(1)} (+20%)`] : []),
        ...(project.overallRisk > 70 ? [`Overall risk ${project.overallRisk.toFixed(1)} (+15%)`] : []),
      ],
    },
    covenant: {
      level: impact.covenantLevel,
      requirements: impact.covenantRequirements,
    },
    capitalConstraint: {
      highRiskAllocation: highRiskPercent,
      policyLimit: capitalPolicyLimit,
      breach: capitalBreach,
      reallocationRequired: capitalBreach,
    },
    totalImpact: {
      additionalFinancingCost: impact.additionalFinancingCost,
      insuranceUplift: impact.premiumIncrease * LOAN_TERM_YEARS,
      totalLifetimeImpact: impact.totalLifetimeImpact,
      loanTermYears: LOAN_TERM_YEARS,
    },
  });
});

router.get("/financial/portfolio", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  if (allProjects.length === 0) {
    res.json({ totalFinancingCost: 0, totalInsuranceUplift: 0, totalRiskCost: 0, projects: [], capitalConstraint: {} });
    return;
  }

  let totalFinancingCost = 0;
  let totalInsuranceUplift = 0;
  const projectImpacts: any[] = [];

  const totalCapital = allProjects.reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskCapital = allProjects.filter(p => p.overallRisk > 70).reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskPercent = totalCapital > 0 ? Math.round((highRiskCapital / totalCapital) * 100) : 0;

  for (const project of allProjects) {
    const impact = calculateFinancialImpact(project);
    totalFinancingCost += impact.additionalFinancingCost;
    totalInsuranceUplift += impact.premiumIncrease * LOAN_TERM_YEARS;
    projectImpacts.push({
      id: project.id,
      name: project.name,
      overallRisk: project.overallRisk,
      rateAdjustment: impact.rateAdjustment,
      finalRate: impact.finalRate,
      premiumIncrease: impact.premiumIncrease,
      covenantLevel: impact.covenantLevel,
      lifetimeImpact: impact.totalLifetimeImpact,
    });
  }

  const totalRiskCost = totalFinancingCost + totalInsuranceUplift;

  res.json({
    totalFinancingCost,
    totalInsuranceUplift,
    totalRiskCost,
    projectCount: allProjects.length,
    avgRateAdjustment: Math.round((projectImpacts.reduce((s, p) => s + p.rateAdjustment, 0) / projectImpacts.length) * 10) / 10,
    capitalConstraint: {
      highRiskAllocation: highRiskPercent,
      policyLimit: 25,
      breach: highRiskPercent > 25,
    },
    projects: projectImpacts.sort((a, b) => b.lifetimeImpact - a.lifetimeImpact),
  });
});

router.get("/financial/comparison", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  if (allProjects.length === 0) {
    res.json({ withoutESL: {}, withESL: {}, savings: {} });
    return;
  }

  let totalCapital = 0;
  let withoutFinancingCost = 0;
  let withoutInsuranceCost = 0;
  let withFinancingCost = 0;
  let withInsuranceCost = 0;

  for (const project of allProjects) {
    const projectValue = project.investmentAmount * 1_000_000;
    totalCapital += projectValue;

    const withoutRateAdj = 0.75;
    withoutFinancingCost += projectValue * withoutRateAdj / 100 * LOAN_TERM_YEARS;
    const withoutPremiumAdj = 1.3;
    withoutInsuranceCost += projectValue * BASE_PREMIUM_RATE * (withoutPremiumAdj - 1) * LOAN_TERM_YEARS;

    const impact = calculateFinancialImpact(project);
    withFinancingCost += impact.additionalFinancingCost;
    withInsuranceCost += impact.premiumIncrease * LOAN_TERM_YEARS;
  }

  const withoutLateDiscovery = Math.round(totalCapital * 0.08);
  const withoutTotal = withoutFinancingCost + withoutInsuranceCost + withoutLateDiscovery;

  const withTotal = withFinancingCost + withInsuranceCost;
  const savings = withoutTotal - withTotal;

  const lowConfProjects = allProjects.filter(p => p.dataConfidence < 60).length;
  const highRiskProjects = allProjects.filter(p => p.overallRisk > 70).length;
  const monitoredProjects = allProjects.filter(p => p.hasMonitoringData).length;

  res.json({
    withoutESL: {
      approach: "Traditional Due Diligence",
      riskPricing: "Underpriced — generic risk models",
      discovery: "Late-stage environmental findings",
      covenants: "Standard / insufficient",
      financingCost: Math.round(withoutFinancingCost),
      insuranceCost: Math.round(withoutInsuranceCost),
      lateDiscoveryCost: withoutLateDiscovery,
      totalCost: Math.round(withoutTotal),
      issues: [
        `${lowConfProjects} projects with low data confidence would go undetected`,
        `${highRiskProjects} high-risk projects underpriced by traditional models`,
        "Environmental covenant gaps create regulatory exposure",
        "No structured monitoring — reactive incident management",
      ],
    },
    withESL: {
      approach: "ESL Intelligence Platform",
      riskPricing: "Precision risk-adjusted — environmental data",
      discovery: "Pre-investment environmental intelligence",
      covenants: "Structured, data-driven environmental covenants",
      financingCost: Math.round(withFinancingCost),
      insuranceCost: Math.round(withInsuranceCost),
      totalCost: Math.round(withTotal),
      advantages: [
        "Real-time risk monitoring across portfolio",
        `${monitoredProjects} projects with active environmental monitoring`,
        "Structured covenant framework with breach detection",
        "Algorithmic capital allocation optimization",
      ],
    },
    savings: {
      total: Math.round(savings),
      financingReduction: Math.round(withoutFinancingCost - withFinancingCost),
      insuranceReduction: Math.round(withoutInsuranceCost - withInsuranceCost),
      lateDiscoveryAvoidance: withoutLateDiscovery,
      roiMultiple: withTotal > 0 ? Math.round((savings / withTotal) * 10) / 10 : 0,
    },
    portfolioStats: {
      totalCapital: Math.round(totalCapital),
      projectCount: allProjects.length,
      avgRisk: Math.round((allProjects.reduce((s, p) => s + p.overallRisk, 0) / allProjects.length) * 10) / 10,
      avgConfidence: Math.round((allProjects.reduce((s, p) => s + p.dataConfidence, 0) / allProjects.length) * 10) / 10,
    },
  });
});

router.get("/financial/scenario/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const before = calculateFinancialImpact(project);

  const mitigated = { ...project };
  let confidenceBoost = 0;
  confidenceBoost += 15;
  confidenceBoost += 10;
  mitigated.dataConfidence = Math.min(100, project.dataConfidence + confidenceBoost);
  mitigated.overallRisk = Math.max(0, project.overallRisk * 0.85);
  mitigated.floodRisk = Math.max(0, project.floodRisk - 2);
  mitigated.coastalExposure = Math.max(0, project.coastalExposure - 1);

  const after = calculateFinancialImpact(mitigated as typeof project);

  res.json({
    before: {
      rate: before.finalRate,
      rateAdjustment: before.rateAdjustment,
      premium: before.adjustedPremium,
      premiumIncrease: before.premiumIncrease,
      covenantLevel: before.covenantLevel,
      lifetimeImpact: before.totalLifetimeImpact,
    },
    after: {
      rate: after.finalRate,
      rateAdjustment: after.rateAdjustment,
      premium: after.adjustedPremium,
      premiumIncrease: after.premiumIncrease,
      covenantLevel: after.covenantLevel,
      lifetimeImpact: after.totalLifetimeImpact,
    },
    savings: {
      rateSavings: Math.round((before.finalRate - after.finalRate) * 10) / 10,
      premiumSavings: before.adjustedPremium - after.adjustedPremium,
      lifetimeSavings: before.totalLifetimeImpact - after.totalLifetimeImpact,
    },
    mitigations: [
      "Environmental monitoring program (+15% confidence)",
      "Lab validation protocol (+10% confidence)",
      "Risk mitigation engineering (-15% risk)",
      "Coastal/flood exposure reduction",
    ],
  });
});

function calculateDeploymentReadiness(project: typeof projectsTable.$inferSelect) {
  const hasMonitoring = project.hasMonitoringData;
  const hasLab = project.hasLabData;
  const hasIFC = project.isIFCAligned;
  const riskOk = project.overallRisk < 70;
  const confOk = project.dataConfidence >= 50;

  if (riskOk && confOk && hasMonitoring) return "READY";
  if (riskOk || confOk) return "CONDITIONALLY READY";
  return "NOT READY";
}

export function calculateCapitalMode(project: typeof projectsTable.$inferSelect) {
  if (project.overallRisk > 70 && project.dataConfidence < 50) return "Grant";
  if (project.overallRisk > 60 || project.dataConfidence < 60) return "Blended";
  return "Loan";
}

export function calculateBlendedGrantPercent(project: typeof projectsTable.$inferSelect): number {
  const split = calculateBlendedSplit(project);
  return split.grantPercent;
}

interface BlendedSplitResult {
  grantPercent: number;
  loanPercent: number;
  rationale: string[];
  drivers: { factor: string; contribution: number; detail: string }[];
}

function calculateBlendedSplit(project: typeof projectsTable.$inferSelect): BlendedSplitResult {
  const drivers: { factor: string; contribution: number; detail: string }[] = [];

  let riskComponent = 0;
  if (project.overallRisk > 70) {
    riskComponent = 20 + ((project.overallRisk - 70) / 30) * 15;
    drivers.push({ factor: "Overall Risk", contribution: Math.round(riskComponent), detail: `Risk ${project.overallRisk.toFixed(1)}/100 — severe exposure requires substantial grant de-risking` });
  } else if (project.overallRisk > 50) {
    riskComponent = 5 + ((project.overallRisk - 50) / 20) * 15;
    drivers.push({ factor: "Overall Risk", contribution: Math.round(riskComponent), detail: `Risk ${project.overallRisk.toFixed(1)}/100 — moderate exposure needs partial de-risking` });
  } else if (project.overallRisk > 30) {
    riskComponent = ((project.overallRisk - 30) / 20) * 5;
    if (riskComponent >= 1) drivers.push({ factor: "Overall Risk", contribution: Math.round(riskComponent), detail: `Risk ${project.overallRisk.toFixed(1)}/100 — low exposure, minimal grant needed` });
  }

  let confidenceComponent = 0;
  if (project.dataConfidence < 40) {
    confidenceComponent = 15 + ((40 - project.dataConfidence) / 40) * 10;
    drivers.push({ factor: "Data Confidence", contribution: Math.round(confidenceComponent), detail: `Confidence ${project.dataConfidence.toFixed(0)}% — critical data gaps require grant-funded validation` });
  } else if (project.dataConfidence < 60) {
    confidenceComponent = 5 + ((60 - project.dataConfidence) / 20) * 10;
    drivers.push({ factor: "Data Confidence", contribution: Math.round(confidenceComponent), detail: `Confidence ${project.dataConfidence.toFixed(0)}% — moderate gaps need baseline studies` });
  } else if (project.dataConfidence < 80) {
    confidenceComponent = ((80 - project.dataConfidence) / 20) * 5;
    if (confidenceComponent >= 1) drivers.push({ factor: "Data Confidence", contribution: Math.round(confidenceComponent), detail: `Confidence ${project.dataConfidence.toFixed(0)}% — minor gaps addressable with TA` });
  }

  let validationGapComponent = 0;
  const gaps: string[] = [];
  if (!project.hasLabData) { validationGapComponent += 5; gaps.push("lab validation"); }
  if (!project.hasMonitoringData) { validationGapComponent += 5; gaps.push("monitoring"); }
  if (!project.isIFCAligned) { validationGapComponent += 4; gaps.push("IFC alignment"); }
  if (validationGapComponent > 0) {
    drivers.push({ factor: "Validation Gaps", contribution: validationGapComponent, detail: `Missing: ${gaps.join(", ")} — grant funds compliance infrastructure` });
  }

  let exposureComponent = 0;
  const exposureItems: string[] = [];
  if (project.floodRisk > 7) { exposureComponent += 3; exposureItems.push(`flood ${project.floodRisk.toFixed(1)}`); }
  if (project.coastalExposure > 7) { exposureComponent += 3; exposureItems.push(`coastal ${project.coastalExposure.toFixed(1)}`); }
  if (project.contaminationRisk > 6) { exposureComponent += 2; exposureItems.push(`contamination ${project.contaminationRisk.toFixed(1)}`); }
  if (project.waterStress > 7) { exposureComponent += 2; exposureItems.push(`water stress ${project.waterStress.toFixed(1)}`); }
  if (exposureComponent > 0) {
    drivers.push({ factor: "Environmental Exposure", contribution: exposureComponent, detail: `Elevated: ${exposureItems.join(", ")} — physical risk needs grant-funded mitigation` });
  }

  const rawGrant = riskComponent + confidenceComponent + validationGapComponent + exposureComponent;
  const grantPercent = Math.round(Math.max(5, Math.min(75, rawGrant)));
  const loanPercent = 100 - grantPercent;

  const rationale: string[] = [];
  if (grantPercent >= 50) {
    rationale.push(`High grant share (${grantPercent}%) reflects severe environmental risk requiring substantial de-risking before commercial capital can be deployed`);
  } else if (grantPercent >= 30) {
    rationale.push(`Moderate grant share (${grantPercent}%) addresses key risk gaps while maintaining majority commercial lending`);
  } else {
    rationale.push(`Low grant share (${grantPercent}%) provides targeted technical assistance — project is near loan-viable`);
  }

  if (!project.hasMonitoringData || !project.hasLabData) {
    rationale.push("Grant component funds environmental baseline and monitoring infrastructure that unlocks commercial lending");
  }
  if (project.dataConfidence < 60) {
    rationale.push("Improved data confidence through grant-funded validation will reduce the risk premium on the loan component");
  }

  return { grantPercent, loanPercent, rationale, drivers };
}

router.get("/financial/project/:id/structure", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const impact = calculateFinancialImpact(project);
  const readiness = calculateDeploymentReadiness(project);
  const recommendedMode = calculateCapitalMode(project);

  const loanStructure = {
    viable: project.overallRisk <= 75,
    conditions: impact.covenantRequirements,
    conditionsPrecedent: [
      ...(project.dataConfidence < 60 ? ["Baseline environmental data validation"] : []),
      ...(project.overallRisk > 50 ? ["Independent environmental assessment"] : []),
      ...(project.coastalExposure > 6 ? ["Coastal resilience engineering plan"] : []),
      ...(!project.hasMonitoringData ? ["Environmental monitoring system installation"] : []),
    ],
    riskMitigation: [
      ...(project.floodRisk > 6 ? ["Flood defense infrastructure required"] : []),
      ...(project.contaminationRisk > 6 ? ["Contamination remediation plan"] : []),
      ...(project.waterStress > 6 ? ["Water management protocol"] : []),
    ],
    covenantLevel: impact.covenantLevel,
    rate: impact.finalRate,
  };

  const grantStructure = {
    required: project.overallRisk > 60 || project.dataConfidence < 60,
    purpose: project.overallRisk > 70
      ? "De-risk environmental exposure before commercial capital deployment"
      : project.dataConfidence < 60
        ? "Fund baseline data collection and monitoring infrastructure"
        : "Technical assistance for environmental compliance",
    disbursementPhases: [
      {
        phase: 1,
        name: "Baseline Validation",
        conditions: ["Environmental baseline study complete", "Lab validation protocol established", "Community consultation conducted"],
        allocation: 30,
        status: project.hasLabData ? "COMPLETE" : "PENDING",
      },
      {
        phase: 2,
        name: "Monitoring Infrastructure",
        conditions: ["Environmental monitoring system installed", "Data collection protocols active", "Reporting framework established"],
        allocation: 40,
        status: project.hasMonitoringData ? "COMPLETE" : "PENDING",
      },
      {
        phase: 3,
        name: "Performance Verification",
        conditions: ["6-month monitoring data reviewed", "Risk score reduction verified", "IFC alignment assessment"],
        allocation: 30,
        status: project.isIFCAligned ? "COMPLETE" : "PENDING",
      },
    ],
  };

  const blendedSplit = calculateBlendedSplit(project);

  const blendedStructure = {
    grantRequired: project.overallRisk > 50 || project.dataConfidence < 70,
    grantPurpose: project.overallRisk > 70
      ? "De-risk environmental exposure to enable commercial lending"
      : "Build data confidence to reduce lending risk premium",
    grantPercent: blendedSplit.grantPercent,
    loanPercent: blendedSplit.loanPercent,
    splitDrivers: blendedSplit.drivers,
    splitRationale: blendedSplit.rationale,
    grantAmount: Math.round(project.investmentAmount * blendedSplit.grantPercent / 100 * 10) / 10,
    loanAmount: Math.round(project.investmentAmount * blendedSplit.loanPercent / 100 * 10) / 10,
    loanViability: project.overallRisk > 75 ? "NOT VIABLE" : project.overallRisk > 60 ? "CONDITIONAL" : "VIABLE",
    loanTriggers: [
      ...(project.overallRisk > 60 ? ["Overall risk reduced below 60 threshold"] : []),
      ...(!project.hasMonitoringData ? ["Environmental monitoring established"] : []),
      ...(project.dataConfidence < 60 ? ["Data confidence above 60%"] : []),
    ],
    transitionMilestones: [
      "ESAP completion verified",
      "Monitoring data demonstrates risk reduction trend",
      "Independent assessment confirms improved risk profile",
    ],
  };

  res.json({
    project: { id: project.id, name: project.name, country: project.country, projectType: project.projectType, investmentAmount: project.investmentAmount },
    deploymentReadiness: readiness,
    recommendedMode,
    loan: loanStructure,
    grant: grantStructure,
    blended: blendedStructure,
  });
});

router.get("/financial/project/:id/impact", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  let deliveryRisk = "LOW";
  const deliveryDrivers: string[] = [];
  if (project.floodRisk > 6) deliveryDrivers.push(`Flood exposure: ${project.floodRisk.toFixed(1)}/10`);
  if (project.coastalExposure > 6) deliveryDrivers.push(`Coastal vulnerability: ${project.coastalExposure.toFixed(1)}/10`);
  if (project.dataConfidence < 60) deliveryDrivers.push(`Low data confidence: ${project.dataConfidence.toFixed(0)}%`);
  if (project.contaminationRisk > 5) deliveryDrivers.push(`Contamination risk: ${project.contaminationRisk.toFixed(1)}/10`);
  if (project.regulatoryComplexity > 6) deliveryDrivers.push(`Regulatory complexity: ${project.regulatoryComplexity.toFixed(1)}/10`);
  if (deliveryDrivers.length >= 3) deliveryRisk = "HIGH";
  else if (deliveryDrivers.length >= 1) deliveryRisk = "MEDIUM";

  let baseEfficiency = 85;
  if (project.overallRisk > 70) baseEfficiency -= 20;
  else if (project.overallRisk > 50) baseEfficiency -= 10;
  if (project.dataConfidence < 50) baseEfficiency -= 15;
  else if (project.dataConfidence < 70) baseEfficiency -= 8;
  if (project.regulatoryComplexity > 7) baseEfficiency -= 5;
  const impactEfficiency = Math.max(20, Math.min(100, baseEfficiency));

  const efficiencyFactors = [
    { factor: "Environmental Risk", adjustment: project.overallRisk > 70 ? -20 : project.overallRisk > 50 ? -10 : 0 },
    { factor: "Data Uncertainty", adjustment: project.dataConfidence < 50 ? -15 : project.dataConfidence < 70 ? -8 : 0 },
    { factor: "Execution Complexity", adjustment: project.regulatoryComplexity > 7 ? -5 : 0 },
  ].filter(f => f.adjustment !== 0);

  let monitoringIntensity = "STANDARD";
  if (project.overallRisk > 70 || project.dataConfidence < 50) monitoringIntensity = "HIGH";
  else if (project.overallRisk > 50 || project.dataConfidence < 70) monitoringIntensity = "ELEVATED";
  const monitoringRequirements = [
    ...(monitoringIntensity === "HIGH" ? ["Monthly environmental reporting", "Quarterly independent audits", "Real-time data collection"] : []),
    ...(monitoringIntensity === "ELEVATED" ? ["Quarterly environmental reporting", "Semi-annual audits"] : []),
    ...(monitoringIntensity === "STANDARD" ? ["Semi-annual reporting", "Annual audit"] : []),
  ];

  let disbursementRisk = "LOW";
  if (project.overallRisk > 70 && project.dataConfidence < 60) disbursementRisk = "ELEVATED";
  else if (project.overallRisk > 60 || project.dataConfidence < 50) disbursementRisk = "MODERATE";
  const disbursementFactors: string[] = [];
  if (project.overallRisk > 70) disbursementFactors.push("High environmental risk increases misallocation probability");
  if (project.dataConfidence < 60) disbursementFactors.push("Low data confidence reduces outcome predictability");
  if (!project.hasMonitoringData) disbursementFactors.push("No monitoring infrastructure to verify fund utilization");

  res.json({
    project: { id: project.id, name: project.name },
    deliveryRisk: { level: deliveryRisk, drivers: deliveryDrivers },
    impactEfficiency: { score: impactEfficiency, factors: efficiencyFactors },
    monitoringIntensity: { level: monitoringIntensity, requirements: monitoringRequirements },
    disbursementRisk: { level: disbursementRisk, factors: disbursementFactors },
  });
});

router.get("/financial/portfolio/deployment", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  if (allProjects.length === 0) {
    res.json({ capitalMix: {}, readiness: {}, efficiency: {} });
    return;
  }

  const modes = allProjects.map(p => ({ ...p, mode: calculateCapitalMode(p), readiness: calculateDeploymentReadiness(p) }));

  const loanProjects = modes.filter(m => m.mode === "Loan");
  const grantProjects = modes.filter(m => m.mode === "Grant");
  const blendedProjects = modes.filter(m => m.mode === "Blended");

  const totalCapital = allProjects.reduce((s, p) => s + p.investmentAmount, 0);
  const loanCapital = loanProjects.reduce((s, p) => s + p.investmentAmount, 0);
  const grantCapital = grantProjects.reduce((s, p) => s + p.investmentAmount, 0);
  const blendedCapital = blendedProjects.reduce((s, p) => s + p.investmentAmount, 0);

  const readyCount = modes.filter(m => m.readiness === "READY").length;
  const conditionalCount = modes.filter(m => m.readiness === "CONDITIONALLY READY").length;
  const notReadyCount = modes.filter(m => m.readiness === "NOT READY").length;

  const lowConfCapital = allProjects
    .filter(p => p.dataConfidence < 60 || p.overallRisk > 70)
    .reduce((s, p) => s + p.investmentAmount, 0);

  const structuringInsights: string[] = [];
  if (grantProjects.length > 0) structuringInsights.push(`${grantProjects.length} project${grantProjects.length > 1 ? "s" : ""} require grant-first structuring`);
  if (loanProjects.length > 0) structuringInsights.push(`${loanProjects.length} project${loanProjects.length > 1 ? "s" : ""} viable for direct lending`);
  if (blendedProjects.length > 0) structuringInsights.push(`${blendedProjects.length} project${blendedProjects.length > 1 ? "s" : ""} recommended for blended finance`);
  if (notReadyCount > 0) structuringInsights.push(`${notReadyCount} project${notReadyCount > 1 ? "s" : ""} should be deferred pending data improvement`);

  res.json({
    capitalMix: {
      loan: { count: loanProjects.length, capital: loanCapital, percent: totalCapital > 0 ? Math.round(loanCapital / totalCapital * 100) : 0 },
      grant: { count: grantProjects.length, capital: grantCapital, percent: totalCapital > 0 ? Math.round(grantCapital / totalCapital * 100) : 0 },
      blended: { count: blendedProjects.length, capital: blendedCapital, percent: totalCapital > 0 ? Math.round(blendedCapital / totalCapital * 100) : 0 },
    },
    readiness: {
      ready: { count: readyCount, percent: Math.round(readyCount / allProjects.length * 100) },
      conditional: { count: conditionalCount, percent: Math.round(conditionalCount / allProjects.length * 100) },
      notReady: { count: notReadyCount, percent: Math.round(notReadyCount / allProjects.length * 100) },
    },
    capitalEfficiency: {
      atRisk: lowConfCapital,
      atRiskPercent: totalCapital > 0 ? Math.round(lowConfCapital / totalCapital * 100) : 0,
      drivers: [
        ...(allProjects.filter(p => p.dataConfidence < 60).length > 0 ? ["Low data confidence"] : []),
        ...(allProjects.filter(p => p.overallRisk > 70).length > 0 ? ["High environmental uncertainty"] : []),
      ],
    },
    structuringInsights,
    projects: modes.map(m => ({
      id: m.id,
      name: m.name,
      recommendedMode: m.mode,
      readiness: m.readiness,
      overallRisk: m.overallRisk,
      dataConfidence: m.dataConfidence,
      investmentAmount: m.investmentAmount,
    })),
  });
});

router.get("/financial/translate/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const mode = (req.query.mode as CapitalMode) || "Loan";
  if (!["Loan", "Grant", "Blended"].includes(mode)) { res.status(400).json({ message: "Invalid mode" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const result = translateEnvironmentalIntelligence(mode, project);
  res.json(result);
});

router.get("/financial/scenario/:id/mode", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const mode = (req.query.mode as CapitalMode) || "Loan";
  if (!["Loan", "Grant", "Blended"].includes(mode)) { res.status(400).json({ message: "Invalid mode" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const addMonitoring = req.query.monitoring === "true";
  const addLab = req.query.lab === "true";
  const addIFC = req.query.ifc === "true";
  const reduceHazards = req.query.hazards === "true";

  const mitigated = { ...project };
  const mitigations: string[] = [];

  if (addMonitoring) {
    mitigated.dataConfidence = Math.min(100, mitigated.dataConfidence + 15);
    mitigated.hasMonitoringData = true;
    mitigations.push("Environmental monitoring program (+15% confidence)");
  }
  if (addLab) {
    mitigated.dataConfidence = Math.min(100, mitigated.dataConfidence + 10);
    mitigated.hasLabData = true;
    mitigations.push("Lab validation protocol (+10% confidence)");
  }
  if (addIFC) {
    mitigated.isIFCAligned = true;
    mitigations.push("IFC alignment verification");
  }
  if (reduceHazards) {
    mitigated.overallRisk = Math.max(0, mitigated.overallRisk * 0.85);
    mitigated.floodRisk = Math.max(0, mitigated.floodRisk - 2);
    mitigated.coastalExposure = Math.max(0, mitigated.coastalExposure - 1);
    mitigations.push("Risk mitigation engineering (-15% risk)");
  }

  if (mitigations.length === 0) {
    mitigated.dataConfidence = Math.min(100, project.dataConfidence + 25);
    mitigated.overallRisk = Math.max(0, project.overallRisk * 0.85);
    mitigations.push("Standard mitigation package applied");
  }

  const result = translateScenario(mode, project, mitigated as typeof project);
  res.json({ ...result, mitigations });
});

router.get("/financial/portfolio/translate", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  if (allProjects.length === 0) {
    res.json({ totalCapital: 0, totalProjects: 0, loanPortfolio: {}, grantPortfolio: {}, blendedPortfolio: {}, projects: [] });
    return;
  }
  const result = translatePortfolio(allProjects);
  res.json(result);
});

export default router;
