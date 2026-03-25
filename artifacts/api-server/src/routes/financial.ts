import { Router, type IRouter } from "express";
import { db, projectsTable, financialImpactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;
