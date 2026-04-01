import type { RiskScores } from "./risk-engine";

export type ProjectCategory =
  | "Hard Infrastructure"
  | "Soft Infrastructure"
  | "Climate & Environment"
  | "Agriculture & Food Security"
  | "Governance & Institutional"
  | "Disaster Response & Recovery";

export type InterventionType =
  | "Physical Infrastructure"
  | "Social/Programmatic"
  | "Environmental"
  | "Governance"
  | "Disaster";

export type MonitoringLevel = "STANDARD" | "ENHANCED" | "INTENSIVE";

export type LenderFramework =
  | "IDB ESPF"
  | "CDB ESRP"
  | "World Bank ESF"
  | "GCF"
  | "EIB"
  | "Equator Principles";

export const PROJECT_TYPES_BY_CATEGORY: Record<ProjectCategory, string[]> = {
  "Hard Infrastructure": ["Port", "Road", "Bridge", "Dam", "Power Plant", "Water Treatment", "Solar", "Wind", "Geothermal"],
  "Soft Infrastructure": ["Hotel", "Hospital", "School", "Housing", "Community Centre", "Market"],
  "Climate & Environment": ["Mangrove Restoration", "Coral Reef Protection", "Watershed Management", "Forest Conservation", "Carbon Sequestration"],
  "Agriculture & Food Security": ["Agriculture", "Aquaculture", "Irrigation", "Food Processing", "Cold Chain"],
  "Governance & Institutional": ["Regulatory Capacity", "Environmental Agency", "Land Registry", "Monitoring Network"],
  "Disaster Response & Recovery": ["Emergency Shelter", "Early Warning System", "Debris Management", "Infrastructure Repair"],
};

export function inferCategory(projectType: string): ProjectCategory {
  for (const [cat, types] of Object.entries(PROJECT_TYPES_BY_CATEGORY)) {
    if (types.some(t => t.toLowerCase() === projectType.toLowerCase())) {
      return cat as ProjectCategory;
    }
  }
  if (["Industrial", "Mining", "Energy", "Waste Management", "Chemical Processing"].includes(projectType)) {
    return "Hard Infrastructure";
  }
  return "Hard Infrastructure";
}

export function inferInterventionType(category: ProjectCategory): InterventionType {
  const map: Record<ProjectCategory, InterventionType> = {
    "Hard Infrastructure": "Physical Infrastructure",
    "Soft Infrastructure": "Social/Programmatic",
    "Climate & Environment": "Environmental",
    "Agriculture & Food Security": "Physical Infrastructure",
    "Governance & Institutional": "Governance",
    "Disaster Response & Recovery": "Disaster",
  };
  return map[category];
}

const INTERVENTION_RISK_PROFILES: Record<InterventionType, {
  baseRisk: number;
  riskDrivers: { factor: string; weight: number }[];
  typicalFailures: string[];
}> = {
  "Physical Infrastructure": {
    baseRisk: 35,
    riskDrivers: [
      { factor: "Construction complexity", weight: 0.30 },
      { factor: "Environmental footprint", weight: 0.25 },
      { factor: "Supply chain dependency", weight: 0.20 },
      { factor: "Regulatory burden", weight: 0.15 },
      { factor: "Community displacement", weight: 0.10 },
    ],
    typicalFailures: ["Cost overrun >30%", "Environmental permit delays", "Community opposition"],
  },
  "Social/Programmatic": {
    baseRisk: 25,
    riskDrivers: [
      { factor: "Institutional capacity", weight: 0.30 },
      { factor: "Community engagement", weight: 0.25 },
      { factor: "Political stability", weight: 0.20 },
      { factor: "Monitoring difficulty", weight: 0.15 },
      { factor: "Sustainability post-funding", weight: 0.10 },
    ],
    typicalFailures: ["Low uptake rates", "Institutional gaps", "Post-project sustainability"],
  },
  "Environmental": {
    baseRisk: 30,
    riskDrivers: [
      { factor: "Ecosystem complexity", weight: 0.30 },
      { factor: "Climate uncertainty", weight: 0.25 },
      { factor: "Monitoring requirements", weight: 0.20 },
      { factor: "Time to impact", weight: 0.15 },
      { factor: "Baseline data quality", weight: 0.10 },
    ],
    typicalFailures: ["Ecosystem response slower than projected", "Climate event wipes gains", "Insufficient monitoring"],
  },
  "Governance": {
    baseRisk: 40,
    riskDrivers: [
      { factor: "Political will", weight: 0.30 },
      { factor: "Institutional inertia", weight: 0.25 },
      { factor: "Corruption risk", weight: 0.20 },
      { factor: "Technical capacity", weight: 0.15 },
      { factor: "Reform sustainability", weight: 0.10 },
    ],
    typicalFailures: ["Political turnover", "Reform reversal", "Capacity not retained"],
  },
  "Disaster": {
    baseRisk: 45,
    riskDrivers: [
      { factor: "Event recurrence probability", weight: 0.30 },
      { factor: "Access constraints", weight: 0.25 },
      { factor: "Supply chain disruption", weight: 0.20 },
      { factor: "Coordination complexity", weight: 0.15 },
      { factor: "Build-back-better compliance", weight: 0.10 },
    ],
    typicalFailures: ["Secondary disaster during recovery", "Supply chain collapse", "Coordination failures"],
  },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export interface SensitivityProvenance {
  governance: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
  disasterHistory: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
  informRisk: { source: string; datasetKey: string; value: number | null; fallback: boolean; timestamp: string };
}

export interface PERSBreakdown {
  ceriScore: number;
  projectOverlay: number;
  sensitivityScore: number;
  interventionRiskScore: number;
  persScore: number;
  weights: { ceri: number; project: number; sensitivity: number; intervention: number };
  explainability: string[];
  sensitivityInputs?: {
    governanceScore: number;
    disasterLossHistory: number;
    usedFallback: boolean;
    provenance?: SensitivityProvenance;
  };
}

export interface InterventionRiskProfile {
  interventionType: InterventionType;
  baseRisk: number;
  adjustedRisk: number;
  riskDrivers: { factor: string; weight: number; score: number }[];
  typicalFailures: string[];
  mitigationRecommendations: string[];
}

export interface MonitoringIntensityResult {
  level: MonitoringLevel;
  frequency: string;
  requirements: string[];
  triggers: string[];
  reasoning: string;
}

export function calculatePERS(
  riskScores: RiskScores,
  interventionType: InterventionType,
  projectType: string,
  hasSEA: boolean,
  hasESIA: boolean,
  governanceScore?: number,
  disasterLossHistory?: number,
  provenance?: SensitivityProvenance,
): PERSBreakdown {
  const ceriScore = riskScores.overallRisk;

  let projectOverlay = calculateProjectOverlay(riskScores, projectType);
  if (hasSEA) {
    projectOverlay *= 0.85;
  }
  if (hasESIA) {
    projectOverlay *= 0.90;
  }
  projectOverlay = clamp(projectOverlay, 0, 100);

  const sensitivityScore = calculateSensitivity(riskScores, governanceScore, disasterLossHistory);

  const interventionRiskScore = calculateInterventionRisk(interventionType, riskScores);

  const persScore = clamp(
    (ceriScore * 0.50) + (projectOverlay * 0.25) + (sensitivityScore * 0.15) + (interventionRiskScore * 0.10),
    0, 100
  );

  const govUsed = governanceScore ?? 50;
  const disasterUsed = disasterLossHistory ?? 40;
  const usedFallback = governanceScore === undefined || disasterLossHistory === undefined;

  const explainability = buildExplainability(ceriScore, projectOverlay, sensitivityScore, interventionRiskScore, hasSEA, hasESIA, govUsed, disasterUsed, usedFallback, provenance);

  return {
    ceriScore: Math.round(ceriScore * 10) / 10,
    projectOverlay: Math.round(projectOverlay * 10) / 10,
    sensitivityScore: Math.round(sensitivityScore * 10) / 10,
    interventionRiskScore: Math.round(interventionRiskScore * 10) / 10,
    persScore: Math.round(persScore * 10) / 10,
    weights: { ceri: 0.50, project: 0.25, sensitivity: 0.15, intervention: 0.10 },
    explainability,
    sensitivityInputs: {
      governanceScore: govUsed,
      disasterLossHistory: disasterUsed,
      usedFallback,
      provenance,
    },
  };
}

function calculateProjectOverlay(riskScores: RiskScores, projectType: string): number {
  const sectorPenalties: Record<string, number> = {
    "Port": 15, "Dam": 20, "Power Plant": 18, "Industrial": 12, "Mining": 20,
    "Chemical Processing": 22, "Waste Management": 15, "Road": 10, "Bridge": 12,
    "Hotel": 8, "Solar": 5, "Wind": 6, "Geothermal": 10,
    "Agriculture": 7, "Aquaculture": 8, "Housing": 6,
    "Mangrove Restoration": 3, "Coral Reef Protection": 4, "Forest Conservation": 3,
    "Regulatory Capacity": 2, "Environmental Agency": 2,
    "Emergency Shelter": 5, "Early Warning System": 3,
  };

  const sectorPenalty = sectorPenalties[projectType] ?? 8;

  const envComplexity = (riskScores.environmentalRisk * 0.4) + (riskScores.infrastructureRisk * 0.3) + (riskScores.regulatoryRisk * 0.3);

  return clamp(sectorPenalty + (envComplexity * 0.5), 0, 100);
}

function calculateSensitivity(riskScores: RiskScores, governanceScore?: number, disasterLossHistory?: number): number {
  let sensitivity = riskScores.humanExposureRisk * 0.40;

  sensitivity += riskScores.regulatoryRisk * 0.25;

  if (governanceScore !== undefined) {
    sensitivity += (100 - governanceScore) * 0.20;
  } else {
    sensitivity += 50 * 0.20;
  }

  if (disasterLossHistory !== undefined) {
    sensitivity += disasterLossHistory * 0.15;
  } else {
    sensitivity += 40 * 0.15;
  }

  return clamp(sensitivity, 0, 100);
}

function calculateInterventionRisk(interventionType: InterventionType, riskScores: RiskScores): number {
  const profile = INTERVENTION_RISK_PROFILES[interventionType];
  let risk = profile.baseRisk;

  const envFactor = riskScores.environmentalRisk / 100;
  const infraFactor = riskScores.infrastructureRisk / 100;
  const confFactor = (100 - riskScores.dataConfidence) / 100;

  risk += envFactor * 15;
  risk += infraFactor * 10;
  risk += confFactor * 10;

  return clamp(risk, 0, 100);
}

export function buildInterventionRiskProfile(
  interventionType: InterventionType,
  riskScores: RiskScores,
): InterventionRiskProfile {
  const profile = INTERVENTION_RISK_PROFILES[interventionType];
  const adjustedRisk = calculateInterventionRisk(interventionType, riskScores);

  const riskDrivers = profile.riskDrivers.map(d => ({
    factor: d.factor,
    weight: d.weight,
    score: Math.round(adjustedRisk * d.weight * 10) / 10,
  }));

  const mitigationRecommendations = buildMitigationRecommendations(interventionType, riskScores);

  return {
    interventionType,
    baseRisk: profile.baseRisk,
    adjustedRisk: Math.round(adjustedRisk * 10) / 10,
    riskDrivers,
    typicalFailures: profile.typicalFailures,
    mitigationRecommendations,
  };
}

function buildMitigationRecommendations(interventionType: InterventionType, riskScores: RiskScores): string[] {
  const recs: string[] = [];

  if (riskScores.environmentalRisk > 60) {
    recs.push("Commission independent Environmental and Social Impact Assessment (ESIA) before project approval");
  }
  if (riskScores.regulatoryRisk > 50) {
    recs.push("Engage Strategic Environmental Assessment (SEA) framework for regulatory de-risking");
  }
  if (riskScores.dataConfidence < 60) {
    recs.push("Establish baseline monitoring network before capital deployment");
  }
  if (riskScores.humanExposureRisk > 50) {
    recs.push("Implement community engagement and grievance redress mechanism");
  }

  if (interventionType === "Physical Infrastructure") {
    recs.push("Include climate-resilient design standards in project specifications");
  } else if (interventionType === "Environmental") {
    recs.push("Establish ecological monitoring indicators with 5-year tracking commitment");
  } else if (interventionType === "Governance") {
    recs.push("Build institutional capacity plan with knowledge transfer milestones");
  } else if (interventionType === "Disaster") {
    recs.push("Integrate build-back-better standards into recovery specifications");
  } else if (interventionType === "Social/Programmatic") {
    recs.push("Design post-funding sustainability plan with local institutional anchoring");
  }

  return recs;
}

export function determineMonitoringIntensity(
  persScore: number,
  dataConfidence: number,
  interventionType: InterventionType,
  capitalMode: string,
): MonitoringIntensityResult {
  let level: MonitoringLevel;
  let frequency: string;
  const requirements: string[] = [];
  const triggers: string[] = [];

  if (persScore > 65 || dataConfidence < 40 || capitalMode === "Grant") {
    level = "INTENSIVE";
    frequency = "Monthly reporting, quarterly site visits";
    requirements.push("Real-time environmental monitoring dashboard");
    requirements.push("Independent third-party verification quarterly");
    requirements.push("Community feedback mechanism with monthly reporting");
    requirements.push("Financial disbursement tied to milestone achievement");
    triggers.push("Any single risk pillar exceeding 75/100");
    triggers.push("Data confidence dropping below 40%");
    triggers.push("Community grievance rate exceeding threshold");
  } else if (persScore > 40 || dataConfidence < 60 || capitalMode === "Blended") {
    level = "ENHANCED";
    frequency = "Quarterly reporting, semi-annual site visits";
    requirements.push("Environmental monitoring with quarterly data submission");
    requirements.push("Semi-annual independent review");
    requirements.push("Stakeholder engagement tracking");
    triggers.push("Risk score increase >10 points in any quarter");
    triggers.push("Missed reporting deadline");
    triggers.push("Environmental incident or community complaint");
  } else {
    level = "STANDARD";
    frequency = "Semi-annual reporting, annual site visits";
    requirements.push("Standard environmental compliance reporting");
    requirements.push("Annual independent audit");
    triggers.push("Significant change in project scope or environment");
    triggers.push("Regulatory change affecting project");
  }

  if (interventionType === "Disaster" || interventionType === "Environmental") {
    if (level === "STANDARD") {
      level = "ENHANCED";
      frequency = "Quarterly reporting, semi-annual site visits";
      requirements.push("Ecological/disaster monitoring indicators required");
    }
  }

  const reasoning = `PERS score ${persScore.toFixed(1)}/100 with ${dataConfidence.toFixed(0)}% data confidence under ${capitalMode} mode. ` +
    `${interventionType} interventions require ${level.toLowerCase()} monitoring to ensure effective deployment.`;

  return { level, frequency, requirements, triggers, reasoning };
}

export function recommendCapitalMode(
  persScore: number,
  dataConfidence: number,
  interventionType: InterventionType,
): "Loan" | "Blended" | "Grant" {
  if (persScore > 70 && dataConfidence < 50) return "Grant";
  if (persScore > 70 || dataConfidence < 40) return "Grant";

  if (persScore > 45 || dataConfidence < 60) return "Blended";

  if (interventionType === "Governance" || interventionType === "Disaster") {
    return persScore > 40 ? "Grant" : "Blended";
  }

  return "Loan";
}

export function getLenderFrameworkGuidance(framework: LenderFramework): {
  name: string;
  riskCategories: string[];
  eiaRequirement: string;
  seaGuidance: string;
  monitoringStandard: string;
} {
  const frameworks: Record<LenderFramework, ReturnType<typeof getLenderFrameworkGuidance>> = {
    "IDB ESPF": {
      name: "Inter-American Development Bank Environmental and Social Policy Framework",
      riskCategories: ["Category A (High)", "Category B (Moderate)", "Category C (Low)", "Category FI (Financial Intermediary)"],
      eiaRequirement: "Full EIA required for Category A; limited assessment for Category B",
      seaGuidance: "SEA recommended for programmatic and sectoral investments; ESIA required for project-level assessment",
      monitoringStandard: "Annual environmental and social monitoring report",
    },
    "CDB ESRP": {
      name: "Caribbean Development Bank Environmental and Social Review Procedures",
      riskCategories: ["Category A (Significant)", "Category B (Some)", "Category C (Minimal)"],
      eiaRequirement: "Full EIA for Category A; preliminary assessment for Category B",
      seaGuidance: "SEA encouraged for multi-project programmes; ESIA is primary project-level tool",
      monitoringStandard: "Semi-annual progress reports with environmental compliance",
    },
    "World Bank ESF": {
      name: "World Bank Environmental and Social Framework",
      riskCategories: ["High Risk", "Substantial Risk", "Moderate Risk", "Low Risk"],
      eiaRequirement: "Environmental and Social Assessment proportional to risk classification",
      seaGuidance: "Strategic Environmental and Social Assessment for policy and sectoral lending; ESIA for investment projects",
      monitoringStandard: "Environmental and Social Commitment Plan (ESCP) implementation",
    },
    "GCF": {
      name: "Green Climate Fund Environmental and Social Policy",
      riskCategories: ["Category A/I-1 (High)", "Category B/I-2 (Medium)", "Category C/I-3 (Minimal)"],
      eiaRequirement: "Full ESIA for Category A; simplified for Category B",
      seaGuidance: "SEA for programmatic approaches; ESIA for discrete projects",
      monitoringStandard: "Annual performance report with environmental and social safeguards",
    },
    "EIB": {
      name: "European Investment Bank Environmental and Social Standards",
      riskCategories: ["Screened In (Significant)", "Screened In (Moderate)", "Screened Out"],
      eiaRequirement: "EIA Directive compliance; full assessment for significant impact",
      seaGuidance: "SEA Directive compliance for plans and programmes; EIA for projects",
      monitoringStandard: "Promoter reporting per EIB environmental and social conditions",
    },
    "Equator Principles": {
      name: "Equator Principles (EP4)",
      riskCategories: ["Category A (Significant)", "Category B (Limited)", "Category C (Minimal)"],
      eiaRequirement: "Independent ESIA for Category A; assessment for Category B",
      seaGuidance: "Aligned with IFC Performance Standards; SEA relevant for sectoral assessment",
      monitoringStandard: "Independent monitoring for Category A; internal for Category B",
    },
  };

  return frameworks[framework];
}

function buildExplainability(
  ceri: number,
  overlay: number,
  sensitivity: number,
  interventionRisk: number,
  hasSEA: boolean,
  hasESIA: boolean,
  govUsed: number,
  disasterUsed: number,
  usedFallback: boolean,
  provenance?: SensitivityProvenance,
): string[] {
  const parts: string[] = [];

  parts.push(`CERI (Country Environmental Risk Index) contributes ${(ceri * 0.50).toFixed(1)} points (50% weight) — ${ceri < 40 ? "low" : ceri < 70 ? "moderate" : "high"} country-level risk.`);

  parts.push(`Project Overlay contributes ${(overlay * 0.25).toFixed(1)} points (25% weight) — sector-specific and environmental complexity factors.`);

  if (hasSEA) {
    parts.push("SEA framework presence applies 0.85× mitigation factor to project overlay, reducing regulatory risk component.");
  }
  if (hasESIA) {
    parts.push("ESIA completion applies 0.90× mitigation factor to project overlay, confirming environmental baseline assessment.");
  }

  const govSource = provenance?.governance.fallback ? "fallback default" : `live data (${provenance?.governance.source})`;
  const disasterSource = provenance?.disasterHistory.fallback ? "fallback default" : `live data (${provenance?.disasterHistory.source})`;
  parts.push(`Sensitivity contributes ${(sensitivity * 0.15).toFixed(1)} points (15% weight) — governance quality ${govUsed}/100 [${govSource}], disaster history ${disasterUsed}/100 [${disasterSource}].`);

  if (usedFallback && !provenance) {
    parts.push("WARNING: Sensitivity used hardcoded fallback values. Country-specific data not available.");
  }

  parts.push(`Intervention Risk contributes ${(interventionRisk * 0.10).toFixed(1)} points (10% weight) — delivery risk specific to intervention modality.`);

  return parts;
}
