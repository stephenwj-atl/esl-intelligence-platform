import type { RiskScores } from "./risk-engine";
import type { SectorFamilyKey } from "./sector-families";
import { lookupSectorFamily } from "./sector-families";
import { getProfileForFamily, getProfileByKey, type MethodologyProfileDef } from "./methodology-profiles";
import type { InstrumentType, BlendedLabel } from "./instrument-logic";
import { assessInstrument } from "./instrument-logic";
import type { SensitivityProvenance } from "./country-data-lookup";
import {
  calculatePERS,
  inferCategory,
  inferInterventionType,
  buildInterventionRiskProfile,
  determineMonitoringIntensity,
  recommendCapitalMode,
  type PERSBreakdown,
  type InterventionRiskProfile,
  type MonitoringIntensityResult,
} from "./pers-engine";

export interface LayeredScores {
  countryContextScore: number;
  projectExposureScore: number;
  sectorSensitivityScore: number;
  interventionDeliveryScore: number;
  instrumentStructureScore: number;
  outcomeDeliveryScore: number;
  confidenceScore: number;
  persBaseScore: number;
  persFinalScore: number;
}

export interface LayeredBreakdown {
  layeredScores: LayeredScores;
  profileUsed: string;
  profileName: string;
  sectorFamily: SectorFamilyKey;
  instrumentType: InstrumentType;
  instrumentAssessment: {
    decisionSignal: string;
    structureRiskScore: number;
    reasoning: string[];
    conditions: string[];
  };
  weights: {
    countryContext: number;
    projectOverlay: number;
    sensitivity: number;
    interventionRisk: number;
    outcomeRiskModifier: number;
    instrumentStructureModifier: number;
  };
  familyRelevance: {
    hazard: number;
    biodiversity: number;
    governance: number;
    disasterHistory: number;
    communityVulnerability: number;
    outcomeComplexity: number;
  };
  explainability: string[];
  disbursementReadiness: string;
  transitionReadiness: string;
  blendedLabel?: BlendedLabel;
}

export interface FullAssessmentResult {
  riskScores: RiskScores;
  persBreakdown: PERSBreakdown;
  interventionRiskProfile: InterventionRiskProfile;
  monitoringIntensity: MonitoringIntensityResult;
  capitalMode: string;
  layeredBreakdown: LayeredBreakdown;
  decisionOutcome: string;
  decisionSignal: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round(val: number): number {
  return Math.round(val * 10) / 10;
}

export function calculateLayeredPERS(
  riskScores: RiskScores,
  projectType: string,
  hasSEA: boolean,
  hasESIA: boolean,
  instrumentType: InstrumentType,
  governanceScore?: number,
  disasterLossHistory?: number,
  informRiskScore?: number,
  provenance?: SensitivityProvenance,
  outcomeInputs?: {
    outcomeDeliveryRisk: number;
    implementationCapacity: number;
    disbursementReadiness: number;
  },
  profileOverride?: string,
): FullAssessmentResult {
  const sectorFamily = lookupSectorFamily(projectType);
  const profile = profileOverride
    ? (getProfileByKey(profileOverride) ?? getProfileForFamily(sectorFamily))
    : getProfileForFamily(sectorFamily);

  const category = inferCategory(projectType);
  const interventionType = inferInterventionType(category);

  const persBreakdown = calculatePERS(
    riskScores,
    interventionType,
    projectType,
    hasSEA,
    hasESIA,
    governanceScore,
    disasterLossHistory,
    provenance,
  );

  const interventionRiskProfile = buildInterventionRiskProfile(interventionType, riskScores);

  const countryContextScore = calculateCountryContext(riskScores, governanceScore, informRiskScore, profile);
  const projectExposureScore = calculateProjectExposure(riskScores, projectType, hasSEA, hasESIA, profile);
  const sectorSensitivityScore = calculateSectorSensitivity(riskScores, governanceScore, disasterLossHistory, profile);
  const interventionDeliveryScore = calculateInterventionDelivery(interventionType, riskScores, profile);

  const oc = outcomeInputs ?? { outcomeDeliveryRisk: 50, implementationCapacity: 60, disbursementReadiness: 55 };

  const outcomeDeliveryScore = clamp(
    oc.outcomeDeliveryRisk * profile.relevance.outcomeComplexity +
    (100 - oc.implementationCapacity) * (1 - profile.relevance.outcomeComplexity),
    0, 100
  );

  const instrumentAssessment = assessInstrument(instrumentType, {
    persScore: persBreakdown.persScore,
    dataConfidence: riskScores.dataConfidence,
    outcomeDeliveryScore: 100 - oc.outcomeDeliveryRisk,
    implementationCapacity: oc.implementationCapacity,
    disbursementReadiness: oc.disbursementReadiness,
  });

  const instrumentStructureScore = instrumentAssessment.structureRiskScore;

  const w = profile.weights;
  let persFinal = clamp(
    countryContextScore * w.countryContext +
    projectExposureScore * w.projectOverlay +
    sectorSensitivityScore * w.sensitivity +
    interventionDeliveryScore * w.interventionRisk +
    outcomeDeliveryScore * w.outcomeRiskModifier +
    instrumentStructureScore * w.instrumentStructureModifier,
    0, 100
  );

  if (riskScores.dataConfidence < 50) {
    persFinal *= (1 + w.confidenceInfluence);
    persFinal = clamp(persFinal, 0, 100);
  }

  const capitalMode = recommendCapitalMode(
    persFinal,
    riskScores.dataConfidence,
    interventionType,
  );

  const resolvedCapitalMode = instrumentType === "GRANT" ? "Grant"
    : instrumentType === "LOAN" ? "Loan"
    : instrumentType === "BLENDED" ? "Blended"
    : capitalMode;

  const monitoringIntensity = determineMonitoringIntensity(
    persFinal,
    riskScores.dataConfidence,
    interventionType,
    resolvedCapitalMode,
  );

  const disbursementReadiness = oc.disbursementReadiness >= 70 ? "READY"
    : oc.disbursementReadiness >= 40 ? "CONDITIONALLY_READY"
    : "NOT_READY";

  const transitionReadiness = persFinal < 45 && riskScores.dataConfidence > 60 ? "LOAN_READY"
    : persFinal < 60 && riskScores.dataConfidence > 50 ? "BLENDED_ELIGIBLE"
    : persFinal < 75 ? "GRANT_PHASE"
    : "PRE_READINESS";

  const explainability = buildLayeredExplainability(
    profile, countryContextScore, projectExposureScore, sectorSensitivityScore,
    interventionDeliveryScore, instrumentStructureScore, outcomeDeliveryScore,
    persFinal, instrumentType, sectorFamily, hasSEA, hasESIA,
  );

  const layeredScores: LayeredScores = {
    countryContextScore: round(countryContextScore),
    projectExposureScore: round(projectExposureScore),
    sectorSensitivityScore: round(sectorSensitivityScore),
    interventionDeliveryScore: round(interventionDeliveryScore),
    instrumentStructureScore: round(instrumentStructureScore),
    outcomeDeliveryScore: round(outcomeDeliveryScore),
    confidenceScore: round(riskScores.dataConfidence),
    persBaseScore: round(persBreakdown.persScore),
    persFinalScore: round(persFinal),
  };

  const loanEquivDecision = persFinal > 70 ? "DECLINE" : persFinal > 40 ? "CONDITION" : "PROCEED";

  return {
    riskScores,
    persBreakdown,
    interventionRiskProfile,
    monitoringIntensity,
    capitalMode: resolvedCapitalMode,
    layeredBreakdown: {
      layeredScores,
      profileUsed: profile.profileKey,
      profileName: profile.name,
      sectorFamily,
      instrumentType,
      instrumentAssessment: {
        decisionSignal: instrumentAssessment.decisionSignal,
        structureRiskScore: instrumentAssessment.structureRiskScore,
        reasoning: instrumentAssessment.reasoning,
        conditions: instrumentAssessment.conditions,
      },
      weights: {
        countryContext: w.countryContext,
        projectOverlay: w.projectOverlay,
        sensitivity: w.sensitivity,
        interventionRisk: w.interventionRisk,
        outcomeRiskModifier: w.outcomeRiskModifier,
        instrumentStructureModifier: w.instrumentStructureModifier,
      },
      familyRelevance: {
        hazard: profile.relevance.hazard,
        biodiversity: profile.relevance.biodiversity,
        governance: profile.relevance.governance,
        disasterHistory: profile.relevance.disasterHistory,
        communityVulnerability: profile.relevance.communityVulnerability,
        outcomeComplexity: profile.relevance.outcomeComplexity,
      },
      explainability,
      disbursementReadiness,
      transitionReadiness,
      blendedLabel: instrumentAssessment.blendedLabel,
    },
    decisionOutcome: loanEquivDecision,
    decisionSignal: instrumentAssessment.decisionSignal,
  };
}

function calculateCountryContext(
  riskScores: RiskScores,
  governanceScore: number | undefined,
  informRiskScore: number | undefined,
  profile: MethodologyProfileDef,
): number {
  const gov = governanceScore ?? 50;
  const inform = informRiskScore ?? 50;
  const envRisk = riskScores.overallRisk;

  const govWeight = profile.relevance.governance;
  const hazardWeight = profile.relevance.hazard;
  const remaining = 1 - govWeight - hazardWeight;

  return clamp(
    (100 - gov) * govWeight + inform * hazardWeight + envRisk * Math.max(remaining, 0.1),
    0, 100
  );
}

function calculateProjectExposure(
  riskScores: RiskScores,
  projectType: string,
  hasSEA: boolean,
  hasESIA: boolean,
  profile: MethodologyProfileDef,
): number {
  const sectorPenalties: Record<string, number> = {
    "Port": 15, "Dam": 20, "Power Plant": 18, "Industrial": 12, "Mining": 20,
    "Chemical Processing": 22, "Waste Management": 15, "Road": 10, "Bridge": 12,
    "Roads": 10, "Airport": 12, "Industrial Park": 12,
    "Energy Generation": 15, "Transmission": 10, "Substation": 8,
    "Water Treatment": 8, "Wastewater": 10, "Drainage": 8,
    "Flood Defense": 10, "Solid Waste": 12, "Housing": 6,
    "Hotel": 8, "Tourism Resort": 8, "Solar": 5, "Wind": 6, "Geothermal": 10,
    "Agriculture": 7, "Irrigation": 7, "Agro-Processing": 6, "Fisheries": 8,
    "Aquaculture": 8, "Value Chain": 5, "Food Security Program": 4,
    "Mangrove Restoration": 3, "Reef Restoration": 4, "Coral Reef Protection": 4,
    "Watershed Management": 4, "Forestry": 5, "Reforestation": 3,
    "Forest Conservation": 3, "Coastal Resilience": 5,
    "Biodiversity Protection": 3, "Nature-Based Solutions": 3,
    "Regulatory Capacity": 2, "Environmental Agency": 2, "Environmental Governance": 2,
    "Policy Reform": 2, "Technical Assistance": 2, "Institutional Strengthening": 2,
    "Public Financial Management": 2, "Land Administration": 3,
    "Emergency Shelter": 5, "Post-Hurricane Reconstruction": 8,
    "Resilience Retrofits": 6, "Debris Clearance": 4,
    "Resilience Program": 5, "Community Adaptation": 4,
    "Livelihoods Program": 3, "Urban Upgrading": 6,
    "Manufacturing": 10, "Agro-Industrial": 8, "Logistics Facility": 8,
    "Commercial Renewable Energy": 6, "Export-Oriented": 8,
    "Hospital": 6, "School": 5, "Clinic": 4, "Community Center": 3,
    "Training Center": 4, "Health Network": 3,
    "Food Processing": 6, "Cold Chain": 5, "Storage & Cold Chain": 5,
  };

  const sectorPenalty = sectorPenalties[projectType] ?? 8;

  const envComplexity =
    riskScores.environmentalRisk * profile.relevance.hazard +
    riskScores.infrastructureRisk * (1 - profile.relevance.hazard) * 0.6;

  let exposure = clamp(sectorPenalty + envComplexity * 0.5, 0, 100);

  if (hasSEA) exposure *= 0.85;
  if (hasESIA) exposure *= 0.90;

  return clamp(exposure, 0, 100);
}

function calculateSectorSensitivity(
  riskScores: RiskScores,
  governanceScore: number | undefined,
  disasterLossHistory: number | undefined,
  profile: MethodologyProfileDef,
): number {
  const gov = governanceScore ?? 50;
  const disaster = disasterLossHistory ?? 40;

  return clamp(
    riskScores.humanExposureRisk * profile.relevance.communityVulnerability * 0.5 +
    riskScores.regulatoryRisk * 0.15 +
    (100 - gov) * profile.relevance.governance * 0.2 +
    disaster * profile.relevance.disasterHistory * 0.15,
    0, 100
  );
}

function calculateInterventionDelivery(
  interventionType: string,
  riskScores: RiskScores,
  profile: MethodologyProfileDef,
): number {
  const baseRisks: Record<string, number> = {
    "Physical Infrastructure": 35,
    "Social/Programmatic": 25,
    "Environmental": 30,
    "Governance": 40,
    "Disaster": 45,
  };

  const base = baseRisks[interventionType] ?? 30;
  const envFactor = riskScores.environmentalRisk / 100;
  const confFactor = (100 - riskScores.dataConfidence) / 100;

  return clamp(
    base + envFactor * 15 * profile.relevance.hazard + confFactor * 10,
    0, 100
  );
}

function buildLayeredExplainability(
  profile: MethodologyProfileDef,
  countryContext: number,
  projectExposure: number,
  sectorSensitivity: number,
  interventionDelivery: number,
  instrumentStructure: number,
  outcomeDelivery: number,
  persFinal: number,
  instrumentType: InstrumentType,
  sectorFamily: SectorFamilyKey,
  hasSEA: boolean,
  hasESIA: boolean,
): string[] {
  const w = profile.weights;
  const parts: string[] = [];

  parts.push(`Methodology: ${profile.name} (${profile.profileKey}) — sector family: ${sectorFamily}.`);

  parts.push(`Country Context contributes ${round(countryContext * w.countryContext)} points (${(w.countryContext * 100).toFixed(0)}% weight) — governance quality, INFORM risk, and environmental baseline.`);

  parts.push(`Project Exposure contributes ${round(projectExposure * w.projectOverlay)} points (${(w.projectOverlay * 100).toFixed(0)}% weight) — site-specific hazard and sector complexity.`);

  if (hasSEA) parts.push("SEA framework applies 0.85× mitigation to project exposure.");
  if (hasESIA) parts.push("ESIA completion applies 0.90× mitigation to project exposure.");

  parts.push(`Sector Sensitivity contributes ${round(sectorSensitivity * w.sensitivity)} points (${(w.sensitivity * 100).toFixed(0)}% weight) — community vulnerability, governance quality, disaster history.`);

  parts.push(`Intervention Delivery Risk contributes ${round(interventionDelivery * w.interventionRisk)} points (${(w.interventionRisk * 100).toFixed(0)}% weight) — delivery modality risk.`);

  if (w.outcomeRiskModifier > 0) {
    parts.push(`Outcome Delivery Risk contributes ${round(outcomeDelivery * w.outcomeRiskModifier)} points (${(w.outcomeRiskModifier * 100).toFixed(0)}% weight) — theory of change credibility and implementation capacity.`);
  }

  if (w.instrumentStructureModifier > 0) {
    parts.push(`Instrument Structure Risk contributes ${round(instrumentStructure * w.instrumentStructureModifier)} points (${(w.instrumentStructureModifier * 100).toFixed(0)}% weight) — instrument-specific risk factors.`);
  }

  parts.push(`Final PERS: ${round(persFinal)}/100 under ${instrumentType} instrument logic.`);

  return parts;
}
