import type { SectorFamilyKey } from "./sector-families";

export interface MethodologyWeights {
  countryContext: number;
  projectOverlay: number;
  sensitivity: number;
  interventionRisk: number;
  outcomeRiskModifier: number;
  instrumentStructureModifier: number;
  confidenceInfluence: number;
}

export interface FamilyRelevance {
  hazard: number;
  biodiversity: number;
  governance: number;
  disasterHistory: number;
  communityVulnerability: number;
  outcomeComplexity: number;
  monitoringNeeds: number;
}

export interface MethodologyProfileDef {
  profileKey: string;
  name: string;
  sectorFamily: SectorFamilyKey | "universal";
  version: string;
  weights: MethodologyWeights;
  relevance: FamilyRelevance;
  capitalSuitability: string[];
  rationale: string;
  assumptions: string;
  knownLimitations: string;
}

export const METHODOLOGY_PROFILES: MethodologyProfileDef[] = [
  {
    profileKey: "PERS_DEFAULT_V1",
    name: "Universal Default Profile",
    sectorFamily: "universal",
    version: "V1",
    weights: {
      countryContext: 0.50,
      projectOverlay: 0.25,
      sensitivity: 0.15,
      interventionRisk: 0.10,
      outcomeRiskModifier: 0.0,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.5, biodiversity: 0.3, governance: 0.4,
      disasterHistory: 0.3, communityVulnerability: 0.4,
      outcomeComplexity: 0.5, monitoringNeeds: 0.5,
    },
    capitalSuitability: ["LOAN", "BLENDED", "GRANT"],
    rationale: "Balanced general-purpose profile. CERI dominance reflects that country-level environmental context is the strongest predictor of project-level risk in Caribbean SIDS. Overlay and sensitivity provide project-specific differentiation.",
    assumptions: "Assumes country context data is available from regional indices. Falls back to defaults (50th percentile) when live data is unavailable.",
    knownLimitations: "Does not differentiate by sector. Overlay weights are calibrated for infrastructure. Governance and disaster history use national-level proxies.",
  },
  {
    profileKey: "PERS_INFRA_V1",
    name: "Hard Infrastructure Profile",
    sectorFamily: "hard_infrastructure",
    version: "V1",
    weights: {
      countryContext: 0.40,
      projectOverlay: 0.30,
      sensitivity: 0.15,
      interventionRisk: 0.15,
      outcomeRiskModifier: 0.0,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.8, biodiversity: 0.2, governance: 0.3,
      disasterHistory: 0.5, communityVulnerability: 0.3,
      outcomeComplexity: 0.4, monitoringNeeds: 0.6,
    },
    capitalSuitability: ["LOAN", "BLENDED"],
    rationale: "Higher overlay weight reflects that site-specific hazard exposure (flood, coastal, seismic) is the primary risk differentiator for built assets. Higher intervention risk weight captures construction complexity and supply chain risks. Reduced country context weight because project-level engineering controls partially decouple from national indicators.",
    assumptions: "Assumes physical site inspection or remote sensing data is available for overlay calculation. Construction risk is estimated from project type penalty.",
    knownLimitations: "Does not model construction-phase vs. operation-phase risk separately. Supply chain risk is proxied by country context, not measured directly.",
  },
  {
    profileKey: "PERS_SOCIAL_V1",
    name: "Social Infrastructure Profile",
    sectorFamily: "soft_social_infrastructure",
    version: "V1",
    weights: {
      countryContext: 0.40,
      projectOverlay: 0.20,
      sensitivity: 0.25,
      interventionRisk: 0.15,
      outcomeRiskModifier: 0.05,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.4, biodiversity: 0.1, governance: 0.5,
      disasterHistory: 0.3, communityVulnerability: 0.7,
      outcomeComplexity: 0.6, monitoringNeeds: 0.5,
    },
    capitalSuitability: ["LOAN", "BLENDED", "GRANT"],
    rationale: "Higher sensitivity weight reflects community vulnerability as the dominant risk factor. Outcome risk modifier included because social infrastructure success depends on service uptake and operational sustainability, not just construction completion. Lower overlay because site hazards matter less than institutional and community factors.",
    assumptions: "Community vulnerability data is available from census or World Bank indicators. Institutional capacity is proxied by governance scores.",
    knownLimitations: "Service delivery quality post-construction is not modeled. Assumes community engagement reduces risk but does not measure engagement quality.",
  },
  {
    profileKey: "PERS_AGRI_V1",
    name: "Agriculture & Food Systems Profile",
    sectorFamily: "agriculture_food_systems",
    version: "V1",
    weights: {
      countryContext: 0.35,
      projectOverlay: 0.25,
      sensitivity: 0.20,
      interventionRisk: 0.10,
      outcomeRiskModifier: 0.10,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.6, biodiversity: 0.4, governance: 0.3,
      disasterHistory: 0.5, communityVulnerability: 0.5,
      outcomeComplexity: 0.7, monitoringNeeds: 0.5,
    },
    capitalSuitability: ["LOAN", "BLENDED", "GRANT"],
    rationale: "Outcome risk modifier is higher because agricultural success depends heavily on yield realization, market access, and climate variability — all external to the project design. Biodiversity relevance is elevated due to land use change and agrochemical impacts. Disaster history relevance reflects crop/livestock vulnerability to hurricanes and drought.",
    assumptions: "Soil quality and water availability data is accessible from SoilGrids and Aqueduct. Market access risk is not modeled directly.",
    knownLimitations: "Does not model commodity price risk. Land tenure is assumed secure but not verified. Seasonal climate variability is averaged, not modeled by season.",
  },
  {
    profileKey: "PERS_ECOSYSTEMS_V1",
    name: "Ecosystems & Natural Capital Profile",
    sectorFamily: "ecosystems_natural_capital",
    version: "V1",
    weights: {
      countryContext: 0.35,
      projectOverlay: 0.20,
      sensitivity: 0.20,
      interventionRisk: 0.10,
      outcomeRiskModifier: 0.15,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.20,
    },
    relevance: {
      hazard: 0.4, biodiversity: 0.9, governance: 0.4,
      disasterHistory: 0.3, communityVulnerability: 0.5,
      outcomeComplexity: 0.9, monitoringNeeds: 0.8,
    },
    capitalSuitability: ["GRANT", "BLENDED"],
    rationale: "Highest outcome risk modifier because ecosystem restoration outcomes are inherently uncertain — ecosystem response timelines are long (5-20 years), ecological success depends on complex interactions, and external stressors (climate, invasive species) may overwhelm interventions. Confidence influence is elevated because baseline data quality is critical for measuring ecological outcomes. Biodiversity relevance is near-maximum.",
    assumptions: "Protected area data available from WDPA. Ecosystem health baselines require field assessment. Carbon sequestration estimates use standard biomass models.",
    knownLimitations: "Ecosystem permanence risk is not modeled. Assumes climate trajectory follows RCP4.5; extreme scenarios may invalidate projections. Biodiversity outcomes require species-level monitoring not available from remote sensing alone.",
  },
  {
    profileKey: "PERS_GOVERNANCE_V1",
    name: "Governance & Institutional Profile",
    sectorFamily: "governance_institutional",
    version: "V1",
    weights: {
      countryContext: 0.45,
      projectOverlay: 0.10,
      sensitivity: 0.15,
      interventionRisk: 0.20,
      outcomeRiskModifier: 0.10,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.10,
    },
    relevance: {
      hazard: 0.1, biodiversity: 0.1, governance: 0.9,
      disasterHistory: 0.2, communityVulnerability: 0.3,
      outcomeComplexity: 0.8, monitoringNeeds: 0.4,
    },
    capitalSuitability: ["GRANT", "TECHNICAL_ASSISTANCE"],
    rationale: "Lowest overlay weight because governance/institutional projects have minimal site-specific physical risk. Country context weight remains high because institutional reform outcomes are heavily determined by political economy. Intervention risk is elevated because reform delivery depends on political will, institutional inertia, and capacity retention — factors with high uncertainty. Governance relevance is near-maximum.",
    assumptions: "Corruption Perceptions Index and World Bank Governance Indicators provide adequate proxy for institutional environment. Political stability is assumed constant during project period.",
    knownLimitations: "Political turnover risk is not modeled quantitatively. Reform sustainability post-project is assumed but not verifiable at assessment time. Institutional capacity metrics are proxied by national indices, not measured at agency level.",
  },
  {
    profileKey: "PERS_DISASTER_V1",
    name: "Disaster Response & Recovery Profile",
    sectorFamily: "disaster_response_recovery",
    version: "V1",
    weights: {
      countryContext: 0.35,
      projectOverlay: 0.20,
      sensitivity: 0.15,
      interventionRisk: 0.20,
      outcomeRiskModifier: 0.10,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.10,
    },
    relevance: {
      hazard: 0.7, biodiversity: 0.1, governance: 0.3,
      disasterHistory: 0.9, communityVulnerability: 0.6,
      outcomeComplexity: 0.5, monitoringNeeds: 0.7,
    },
    capitalSuitability: ["GRANT", "EMERGENCY"],
    rationale: "Disaster history relevance is near-maximum because recurrence probability is the primary risk factor. Intervention risk is elevated because disaster contexts create supply chain disruption, access constraints, and coordination complexity. Confidence influence is reduced because disaster response must proceed under data uncertainty — lower confidence should not automatically block urgent deployment.",
    assumptions: "EM-DAT and INFORM provide adequate disaster recurrence proxies. Build-back-better standards are available and enforceable. Logistics constraints can be estimated from country infrastructure indices.",
    knownLimitations: "Does not model compound disaster risk (e.g., hurricane followed by pandemic). Access constraints are estimated, not field-verified. Coordination complexity depends on number of actors, which is not modeled.",
  },
  {
    profileKey: "PERS_PROGRAMMATIC_V1",
    name: "Programmatic / Multi-Sector Profile",
    sectorFamily: "programmatic_multi_sector",
    version: "V1",
    weights: {
      countryContext: 0.40,
      projectOverlay: 0.15,
      sensitivity: 0.20,
      interventionRisk: 0.10,
      outcomeRiskModifier: 0.15,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.4, biodiversity: 0.3, governance: 0.5,
      disasterHistory: 0.4, communityVulnerability: 0.7,
      outcomeComplexity: 0.9, monitoringNeeds: 0.7,
    },
    capitalSuitability: ["GRANT", "BLENDED", "PROGRAMMATIC"],
    rationale: "Low overlay weight because programmatic interventions span multiple sites with lower site-specific dependency. High outcome risk modifier because multi-sector programs have complex results chains and coordination requirements. Community vulnerability relevance is elevated because programmatic success depends on community participation and institutional absorption capacity.",
    assumptions: "Program theory of change is coherent and has been validated by implementing entity. Multiple sub-project sites average out site-specific variability.",
    knownLimitations: "Does not model inter-sector coordination risk. Assumes implementing entity has adequate management capacity. Results chain complexity is proxied by outcome complexity index, not measured directly.",
  },
  {
    profileKey: "PERS_PRIVATE_SECTOR_V1",
    name: "Private Sector / Productive Investment Profile",
    sectorFamily: "private_sector_productive",
    version: "V1",
    weights: {
      countryContext: 0.33,
      projectOverlay: 0.27,
      sensitivity: 0.20,
      interventionRisk: 0.20,
      outcomeRiskModifier: 0.0,
      instrumentStructureModifier: 0.0,
      confidenceInfluence: 0.15,
    },
    relevance: {
      hazard: 0.6, biodiversity: 0.3, governance: 0.6,
      disasterHistory: 0.4, communityVulnerability: 0.3,
      outcomeComplexity: 0.4, monitoringNeeds: 0.5,
    },
    capitalSuitability: ["LOAN", "BLENDED", "GUARANTEE"],
    rationale: "Balanced exposure-governance profile for revenue-generating commercial assets. Higher overlay weight captures asset-specific site exposure and construction risk typical of productive investments. Elevated governance relevance reflects permitting, regulatory compliance, and operating license risks. Intervention risk captures implementation feasibility for private-sector delivery modalities. Country context weight is reduced because commercial ventures are partially insulated from macro-level institutional weaknesses through private governance structures.",
    assumptions: "Assumes commercial viability and revenue generation capacity are assessed independently of environmental risk. Asset valuation and market risk are not modeled — PERS captures environmental and social risk only. Permitting timelines are proxied by regulatory complexity scores.",
    knownLimitations: "Does not model commodity price risk, demand risk, or competitive dynamics. Revenue sustainability is assumed but not validated. Private governance quality is proxied by national governance scores, which may underestimate well-managed private entities.",
  },
];

export function getProfileForFamily(family: SectorFamilyKey): MethodologyProfileDef {
  const profile = METHODOLOGY_PROFILES.find(p => p.sectorFamily === family);
  return profile ?? METHODOLOGY_PROFILES.find(p => p.profileKey === "PERS_DEFAULT_V1")!;
}

export function getProfileByKey(key: string): MethodologyProfileDef | undefined {
  return METHODOLOGY_PROFILES.find(p => p.profileKey === key);
}

export function getAllProfiles(): MethodologyProfileDef[] {
  return METHODOLOGY_PROFILES;
}
