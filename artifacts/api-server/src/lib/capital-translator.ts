import type { projectsTable } from "@workspace/db";
import type { DecryptedProject } from "./project-encryption";

type Project = DecryptedProject<typeof projectsTable.$inferSelect>;

export type CapitalMode = "Loan" | "Grant" | "Blended";

export interface LoanOutput {
  adjustedRate: number;
  insurancePremium: number;
  lifetimeFinancingImpact: number;
  covenantLevel: string;
  capitalConstraintFlag: boolean;
  covenantRequirements: string[];
  riskPremium: number;
  confidencePenalty: number;
}

export interface GrantOutput {
  impactDeliveryProbability: number;
  impactEfficiencyScore: number;
  costPerOutcome: number;
  disbursementRisk: string;
  utilisationRate: number;
  disbursementFactors: string[];
  deliveryDrivers: string[];
  monitoringIntensity: string;
}

export interface BlendedOutput {
  grantPercentage: number;
  loanPercentage: number;
  concessionalityLevel: string;
  transitionTimeline: { phase: string; duration: string; milestone: string; status: string }[];
  viabilityThreshold: number;
  firstLossEstimate: number;
  crowdInRatio: number;
  loanViability: string;
  splitDrivers: { factor: string; contribution: number; detail: string }[];
}

export interface UnifiedDecision {
  status: "READY" | "CONDITIONALLY_READY" | "NOT_READY";
  reasoning: string;
  nextActions: string[];
}

export interface TranslationResult {
  mode: CapitalMode;
  loan: LoanOutput;
  grant: GrantOutput;
  blended: BlendedOutput;
  decision: UnifiedDecision;
}

const BASE_RATE = 8.0;
const BASE_PREMIUM_RATE = 0.01;
const LOAN_TERM_YEARS = 10;

function translateLoan(project: Project): LoanOutput {
  let rateAdjustment = 0;
  if (project.overallRisk > 75) rateAdjustment = 1.5;
  else if (project.overallRisk >= 60) rateAdjustment = 1.0;
  else if (project.overallRisk >= 40) rateAdjustment = 0.5;

  let confidencePenalty = 0;
  if (project.dataConfidence < 50) confidencePenalty = 0.5;

  const adjustedRate = Math.round((BASE_RATE + rateAdjustment + confidencePenalty) * 10) / 10;

  const projectValue = project.investmentAmount * 1_000_000;
  const basePremium = projectValue * BASE_PREMIUM_RATE;
  let premiumMultiplier = 1;
  if (project.coastalExposure > 7) premiumMultiplier += 0.25;
  if (project.floodRisk > 7) premiumMultiplier += 0.20;
  if (project.overallRisk > 70) premiumMultiplier += 0.15;
  const insurancePremium = Math.round(basePremium * premiumMultiplier);

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
  const premiumIncrease = insurancePremium - basePremium;
  const lifetimeFinancingImpact = additionalFinancingCost + (premiumIncrease * LOAN_TERM_YEARS);

  return {
    adjustedRate,
    insurancePremium,
    lifetimeFinancingImpact,
    covenantLevel,
    capitalConstraintFlag: project.overallRisk > 70,
    covenantRequirements,
    riskPremium: Math.round(rateAdjustment * 10) / 10,
    confidencePenalty,
  };
}

function translateGrant(project: Project): GrantOutput {
  let impactDeliveryProbability = 100;
  const deliveryDrivers: string[] = [];

  const riskPenalty = project.overallRisk > 70 ? 30 : project.overallRisk > 50 ? 20 : project.overallRisk > 30 ? 10 : 0;
  if (riskPenalty > 0) {
    impactDeliveryProbability -= riskPenalty;
    deliveryDrivers.push(`Environmental risk ${project.overallRisk.toFixed(1)}/100 (-${riskPenalty}%)`);
  }

  const confPenalty = project.dataConfidence < 40 ? 25 : project.dataConfidence < 60 ? 15 : project.dataConfidence < 80 ? 5 : 0;
  if (confPenalty > 0) {
    impactDeliveryProbability -= confPenalty;
    deliveryDrivers.push(`Data confidence ${project.dataConfidence.toFixed(0)}% (-${confPenalty}%)`);
  }

  const sectorComplexity = getSectorComplexityPenalty(project.projectType);
  if (sectorComplexity > 0) {
    impactDeliveryProbability -= sectorComplexity;
    deliveryDrivers.push(`Sector complexity: ${project.projectType} (-${sectorComplexity}%)`);
  }

  impactDeliveryProbability = Math.max(10, Math.min(100, impactDeliveryProbability));

  let baseEfficiency = 85;
  if (project.overallRisk > 70) baseEfficiency -= 20;
  else if (project.overallRisk > 50) baseEfficiency -= 10;
  if (project.dataConfidence < 50) baseEfficiency -= 15;
  else if (project.dataConfidence < 70) baseEfficiency -= 8;

  const envVolatility = (project.floodRisk + project.coastalExposure + project.contaminationRisk) / 3;
  if (envVolatility > 7) baseEfficiency -= 8;
  else if (envVolatility > 5) baseEfficiency -= 4;

  const impactEfficiencyScore = Math.max(20, Math.min(100, baseEfficiency));

  const baseCostPerOutcome = 100;
  const envConstraintMultiplier = 1 + (project.overallRisk / 200);
  const reworkProbability = project.dataConfidence < 60 ? 0.15 : 0.05;
  const delayLikelihood = project.overallRisk > 60 ? 0.2 : 0.08;
  const costPerOutcome = Math.round(baseCostPerOutcome * envConstraintMultiplier * (1 + reworkProbability) * (1 + delayLikelihood));

  let disbursementRisk = "LOW";
  const disbursementFactors: string[] = [];
  if (project.overallRisk > 70 && project.dataConfidence < 60) {
    disbursementRisk = "HIGH";
    disbursementFactors.push("High environmental risk with low data confidence");
  } else if (project.overallRisk > 60 || project.dataConfidence < 50) {
    disbursementRisk = "MODERATE";
  }
  if (!project.hasMonitoringData) disbursementFactors.push("No monitoring infrastructure for fund verification");
  if (project.overallRisk > 70) disbursementFactors.push("High risk increases misallocation probability");

  const baseUtilisation = 90;
  const riskHaircut = project.overallRisk > 70 ? 25 : project.overallRisk > 50 ? 15 : 5;
  const confHaircut = project.dataConfidence < 50 ? 15 : project.dataConfidence < 70 ? 8 : 0;
  const monitoringBonus = project.hasMonitoringData ? 5 : 0;
  const utilisationRate = Math.max(30, Math.min(100, baseUtilisation - riskHaircut - confHaircut + monitoringBonus));

  let monitoringIntensity = "STANDARD";
  if (project.overallRisk > 70 || project.dataConfidence < 50) monitoringIntensity = "HIGH";
  else if (project.overallRisk > 50 || project.dataConfidence < 70) monitoringIntensity = "ELEVATED";

  return {
    impactDeliveryProbability,
    impactEfficiencyScore,
    costPerOutcome,
    disbursementRisk,
    utilisationRate,
    disbursementFactors,
    deliveryDrivers,
    monitoringIntensity,
  };
}

function translateBlended(project: Project): BlendedOutput {
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
  if (project.floodRisk > 7) exposureComponent += 3;
  if (project.coastalExposure > 7) exposureComponent += 3;
  if (project.contaminationRisk > 6) exposureComponent += 2;
  if (project.waterStress > 7) exposureComponent += 2;
  if (exposureComponent > 0) {
    drivers.push({ factor: "Environmental Exposure", contribution: exposureComponent, detail: "Physical risk components requiring grant-funded mitigation" });
  }

  const rawGrant = riskComponent + confidenceComponent + validationGapComponent + exposureComponent;
  const grantPercentage = Math.round(Math.max(5, Math.min(75, rawGrant)));
  const loanPercentage = 100 - grantPercentage;

  let concessionalityLevel = "STANDARD";
  if (grantPercentage >= 50) concessionalityLevel = "DEEP";
  else if (grantPercentage >= 30) concessionalityLevel = "MODERATE";
  else if (grantPercentage >= 15) concessionalityLevel = "LIGHT";

  const viabilityThreshold = 60;
  const loanViability = project.overallRisk > 75 ? "NOT VIABLE" : project.overallRisk > viabilityThreshold ? "CONDITIONAL" : "VIABLE";

  const firstLossEstimate = Math.round(Math.min(grantPercentage * 0.6, 30));

  const grantCapital = project.investmentAmount * grantPercentage / 100;
  const loanCapital = project.investmentAmount * loanPercentage / 100;
  const riskReductionFactor = grantPercentage >= 40 ? 0.5 : grantPercentage >= 20 ? 0.3 : 0.15;
  const crowdInRatio = grantCapital > 0 ? Math.round((loanCapital / grantCapital) * 10) / 10 : 0;

  const transitionTimeline = buildTransitionTimeline(project);

  return {
    grantPercentage,
    loanPercentage,
    concessionalityLevel,
    transitionTimeline,
    viabilityThreshold,
    firstLossEstimate,
    crowdInRatio,
    loanViability,
    splitDrivers: drivers,
  };
}

function buildTransitionTimeline(project: Project) {
  const timeline: { phase: string; duration: string; milestone: string; status: string }[] = [];

  timeline.push({
    phase: "Baseline Validation",
    duration: project.dataConfidence < 50 ? "6-9 months" : "3-4 months",
    milestone: "Environmental baseline established, lab data validated",
    status: project.hasLabData ? "COMPLETE" : "PENDING",
  });

  timeline.push({
    phase: "Monitoring Infrastructure",
    duration: project.overallRisk > 70 ? "6-12 months" : "3-6 months",
    milestone: "Monitoring systems operational, data collection active",
    status: project.hasMonitoringData ? "COMPLETE" : "PENDING",
  });

  timeline.push({
    phase: "Risk Reduction Verification",
    duration: "6-12 months",
    milestone: "Risk score below viability threshold, confidence above 60%",
    status: project.overallRisk <= 60 && project.dataConfidence >= 60 ? "COMPLETE" : "PENDING",
  });

  timeline.push({
    phase: "Loan Activation",
    duration: "1-3 months",
    milestone: "Commercial terms finalized, loan disbursement begins",
    status: project.overallRisk <= 50 && project.dataConfidence >= 70 ? "COMPLETE" : "PENDING",
  });

  return timeline;
}

function buildUnifiedDecision(mode: CapitalMode, project: Project, loan: LoanOutput, grant: GrantOutput, blended: BlendedOutput): UnifiedDecision {
  const nextActions: string[] = [];
  let status: UnifiedDecision["status"];
  let reasoning: string;

  if (mode === "Loan") {
    if (project.overallRisk < 40 && project.dataConfidence >= 60) {
      status = "READY";
      reasoning = "Risk profile supports direct lending with standard covenants.";
    } else if (project.overallRisk < 70) {
      status = "CONDITIONALLY_READY";
      reasoning = "Proceed with covenants — risk premium applied to rate and insurance.";
      if (!project.hasMonitoringData) nextActions.push("Establish environmental monitoring");
      if (project.dataConfidence < 60) nextActions.push("Complete baseline data validation");
      if (loan.covenantLevel === "HIGH") nextActions.push("Execute enhanced covenant package");
    } else {
      status = "NOT_READY";
      reasoning = "Risk exceeds lending threshold — consider grant or blended structure.";
      nextActions.push("Reassess under blended or grant mode");
    }
  } else if (mode === "Grant") {
    if (grant.impactDeliveryProbability >= 70 && grant.disbursementRisk !== "HIGH") {
      status = "READY";
      reasoning = "Impact delivery probability supports full disbursement.";
      nextActions.push("Initiate phased disbursement per impact milestones");
    } else if (grant.impactDeliveryProbability >= 45) {
      status = "CONDITIONALLY_READY";
      reasoning = "Disburse in phases — monitor impact delivery against milestones.";
      if (grant.utilisationRate < 70) nextActions.push("Strengthen utilisation monitoring");
      if (!project.hasMonitoringData) nextActions.push("Install monitoring for disbursement triggers");
      nextActions.push("Phase disbursement against outcome milestones");
    } else {
      status = "NOT_READY";
      reasoning = "Impact delivery probability too low — additional baseline work required.";
      nextActions.push("Complete environmental baseline assessment");
      nextActions.push("Establish data confidence before committing grant funds");
    }
  } else {
    if (blended.loanViability === "VIABLE" && project.dataConfidence >= 60) {
      status = "READY";
      reasoning = "Grant-first, loan after validation — transition path is clear.";
      nextActions.push("Deploy grant component for de-risking");
      nextActions.push("Prepare loan activation triggers");
    } else if (blended.loanViability !== "NOT VIABLE") {
      status = "CONDITIONALLY_READY";
      reasoning = "Blended structure viable — grant component must precede loan activation.";
      nextActions.push("Execute grant-funded validation programme");
      if (!project.hasMonitoringData) nextActions.push("Install monitoring infrastructure");
      nextActions.push("Monitor transition milestones toward loan viability");
    } else {
      status = "NOT_READY";
      reasoning = "Loan component not viable at current risk level — grant-only recommended.";
      nextActions.push("Reassess under pure grant mode");
      nextActions.push("Target risk reduction below viability threshold");
    }
  }

  return { status, reasoning, nextActions };
}

export function translateEnvironmentalIntelligence(mode: CapitalMode, project: Project): TranslationResult {
  const loan = translateLoan(project);
  const grant = translateGrant(project);
  const blended = translateBlended(project);
  const decision = buildUnifiedDecision(mode, project, loan, grant, blended);

  return { mode, loan, grant, blended, decision };
}

export function translateScenario(mode: CapitalMode, before: Project, after: Project) {
  const beforeResult = translateEnvironmentalIntelligence(mode, before);
  const afterResult = translateEnvironmentalIntelligence(mode, after);

  if (mode === "Loan") {
    return {
      mode,
      before: {
        label: "Current Risk Position",
        rate: beforeResult.loan.adjustedRate,
        insurancePremium: beforeResult.loan.insurancePremium,
        covenantLevel: beforeResult.loan.covenantLevel,
        lifetimeImpact: beforeResult.loan.lifetimeFinancingImpact,
      },
      after: {
        label: "With Intervention",
        rate: afterResult.loan.adjustedRate,
        insurancePremium: afterResult.loan.insurancePremium,
        covenantLevel: afterResult.loan.covenantLevel,
        lifetimeImpact: afterResult.loan.lifetimeFinancingImpact,
      },
      delta: {
        rateReduction: Math.round((beforeResult.loan.adjustedRate - afterResult.loan.adjustedRate) * 10) / 10,
        insuranceSavings: beforeResult.loan.insurancePremium - afterResult.loan.insurancePremium,
        lifetimeSavings: beforeResult.loan.lifetimeFinancingImpact - afterResult.loan.lifetimeFinancingImpact,
      },
      decision: afterResult.decision,
    };
  } else if (mode === "Grant") {
    return {
      mode,
      before: {
        label: "Current Impact Profile",
        impactDeliveryProbability: beforeResult.grant.impactDeliveryProbability,
        utilisationRate: beforeResult.grant.utilisationRate,
        costPerOutcome: beforeResult.grant.costPerOutcome,
        disbursementRisk: beforeResult.grant.disbursementRisk,
      },
      after: {
        label: "Post-Intervention Impact",
        impactDeliveryProbability: afterResult.grant.impactDeliveryProbability,
        utilisationRate: afterResult.grant.utilisationRate,
        costPerOutcome: afterResult.grant.costPerOutcome,
        disbursementRisk: afterResult.grant.disbursementRisk,
      },
      delta: {
        impactProbabilityIncrease: afterResult.grant.impactDeliveryProbability - beforeResult.grant.impactDeliveryProbability,
        utilisationIncrease: afterResult.grant.utilisationRate - beforeResult.grant.utilisationRate,
        costReduction: beforeResult.grant.costPerOutcome - afterResult.grant.costPerOutcome,
      },
      decision: afterResult.decision,
    };
  } else {
    return {
      mode,
      before: {
        label: "Current Structure",
        grantPercentage: beforeResult.blended.grantPercentage,
        loanViability: beforeResult.blended.loanViability,
        firstLossEstimate: beforeResult.blended.firstLossEstimate,
        crowdInRatio: beforeResult.blended.crowdInRatio,
      },
      after: {
        label: "Transition Target",
        grantPercentage: afterResult.blended.grantPercentage,
        loanViability: afterResult.blended.loanViability,
        firstLossEstimate: afterResult.blended.firstLossEstimate,
        crowdInRatio: afterResult.blended.crowdInRatio,
      },
      delta: {
        grantReduction: beforeResult.blended.grantPercentage - afterResult.blended.grantPercentage,
        viabilityImprovement: beforeResult.blended.loanViability !== "VIABLE" && afterResult.blended.loanViability === "VIABLE",
        crowdInImprovement: afterResult.blended.crowdInRatio - beforeResult.blended.crowdInRatio,
      },
      decision: afterResult.decision,
    };
  }
}

export function translatePortfolio(projects: Project[]) {
  const modes = projects.map(p => ({
    project: p,
    mode: calculateRecommendedMode(p),
    translation: translateEnvironmentalIntelligence(calculateRecommendedMode(p), p),
  }));

  const loanProjects = modes.filter(m => m.mode === "Loan");
  const grantProjects = modes.filter(m => m.mode === "Grant");
  const blendedProjects = modes.filter(m => m.mode === "Blended");
  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);

  const loanPortfolio = {
    count: loanProjects.length,
    capital: loanProjects.reduce((s, m) => s + m.project.investmentAmount, 0),
    capitalAtRisk: loanProjects.filter(m => m.project.overallRisk > 40).reduce((s, m) => s + m.project.investmentAmount, 0),
    weightedRisk: loanProjects.length > 0
      ? Math.round(loanProjects.reduce((s, m) => s + m.project.overallRisk * m.project.investmentAmount, 0) / Math.max(1, loanProjects.reduce((s, m) => s + m.project.investmentAmount, 0)) * 10) / 10
      : 0,
    avgRate: loanProjects.length > 0
      ? Math.round(loanProjects.reduce((s, m) => s + m.translation.loan.adjustedRate, 0) / loanProjects.length * 10) / 10
      : 0,
  };

  const grantPortfolio = {
    count: grantProjects.length,
    capital: grantProjects.reduce((s, m) => s + m.project.investmentAmount, 0),
    impactDeliveryRate: grantProjects.length > 0
      ? Math.round(grantProjects.reduce((s, m) => s + m.translation.grant.impactDeliveryProbability, 0) / grantProjects.length)
      : 0,
    utilisationRate: grantProjects.length > 0
      ? Math.round(grantProjects.reduce((s, m) => s + m.translation.grant.utilisationRate, 0) / grantProjects.length)
      : 0,
    disbursementVelocity: grantProjects.length > 0
      ? Math.round(grantProjects.filter(m => m.translation.grant.disbursementRisk !== "HIGH").length / grantProjects.length * 100)
      : 0,
    avgCostPerOutcome: grantProjects.length > 0
      ? Math.round(grantProjects.reduce((s, m) => s + m.translation.grant.costPerOutcome, 0) / grantProjects.length)
      : 0,
  };

  const blendedPortfolio = {
    count: blendedProjects.length,
    capital: blendedProjects.reduce((s, m) => s + m.project.investmentAmount, 0),
    transitionPipeline: {
      viable: blendedProjects.filter(m => m.translation.blended.loanViability === "VIABLE").length,
      conditional: blendedProjects.filter(m => m.translation.blended.loanViability === "CONDITIONAL").length,
      notViable: blendedProjects.filter(m => m.translation.blended.loanViability === "NOT VIABLE").length,
    },
    capitalLeverage: blendedProjects.length > 0
      ? Math.round(blendedProjects.reduce((s, m) => s + m.translation.blended.loanPercentage, 0) / blendedProjects.length)
      : 0,
    avgCrowdInRatio: blendedProjects.length > 0
      ? Math.round(blendedProjects.reduce((s, m) => s + m.translation.blended.crowdInRatio, 0) / blendedProjects.length * 10) / 10
      : 0,
    avgGrantPercent: blendedProjects.length > 0
      ? Math.round(blendedProjects.reduce((s, m) => s + m.translation.blended.grantPercentage, 0) / blendedProjects.length)
      : 0,
    avgFirstLoss: blendedProjects.length > 0
      ? Math.round(blendedProjects.reduce((s, m) => s + m.translation.blended.firstLossEstimate, 0) / blendedProjects.length)
      : 0,
  };

  return {
    totalCapital,
    totalProjects: projects.length,
    loanPortfolio,
    grantPortfolio,
    blendedPortfolio,
    projects: modes.map(m => ({
      id: m.project.id,
      name: m.project.name,
      mode: m.mode,
      decision: m.translation.decision,
      investmentAmount: m.project.investmentAmount,
      overallRisk: m.project.overallRisk,
      dataConfidence: m.project.dataConfidence,
    })),
  };
}

function calculateRecommendedMode(project: Project): CapitalMode {
  if (project.overallRisk > 70 && project.dataConfidence < 50) return "Grant";
  if (project.overallRisk > 60 || project.dataConfidence < 60) return "Blended";
  return "Loan";
}

function getSectorComplexityPenalty(projectType: string): number {
  const complexSectors: Record<string, number> = {
    "Industrial": 10,
    "Mining": 12,
    "Energy": 8,
    "Waste Management": 10,
    "Chemical Processing": 15,
  };
  return complexSectors[projectType] || 5;
}
