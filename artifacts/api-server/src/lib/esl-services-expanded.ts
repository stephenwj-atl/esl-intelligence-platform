import type { SectorFamilyKey } from "./sector-families";
import type { InstrumentType } from "./instrument-logic";

export interface ESLServiceCategory {
  key: string;
  name: string;
  description: string;
  typicalDeliverables: string[];
  relevantFamilies: SectorFamilyKey[];
  relevantInstruments: InstrumentType[];
  estimatedDurationWeeks: { min: number; max: number };
  estimatedFeeRangeUSD: { min: number; max: number };
}

export const ESL_SERVICE_CATALOG: ESLServiceCategory[] = [
  {
    key: "esia",
    name: "Environmental and Social Impact Assessment (ESIA)",
    description: "Comprehensive project-level assessment of environmental and social impacts, risks, and mitigation measures per IFC Performance Standards.",
    typicalDeliverables: ["ESIA Report", "Environmental and Social Management Plan (ESMP)", "Stakeholder Engagement Plan", "Monitoring Framework"],
    relevantFamilies: ["hard_infrastructure", "soft_social_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital", "private_sector_productive"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT", "GUARANTEE"],
    estimatedDurationWeeks: { min: 12, max: 24 },
    estimatedFeeRangeUSD: { min: 75000, max: 350000 },
  },
  {
    key: "eia",
    name: "Environmental Impact Assessment (EIA)",
    description: "Regulatory-grade EIA for permitting compliance under national environmental law. Required where local legislation mandates before construction.",
    typicalDeliverables: ["EIA Report", "Permit Application Package", "Environmental Monitoring Plan"],
    relevantFamilies: ["hard_infrastructure", "private_sector_productive", "agriculture_food_systems"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 8, max: 16 },
    estimatedFeeRangeUSD: { min: 40000, max: 200000 },
  },
  {
    key: "sea",
    name: "Strategic Environmental Assessment (SEA)",
    description: "Strategic-level assessment of policies, plans, and programmes. Provides upstream environmental intelligence before project-level decisions.",
    typicalDeliverables: ["SEA Report", "Strategic Options Assessment", "Cumulative Impact Analysis", "Policy Recommendations"],
    relevantFamilies: ["governance_institutional", "programmatic_multi_sector", "ecosystems_natural_capital"],
    relevantInstruments: ["GRANT", "TECHNICAL_ASSISTANCE", "PROGRAMMATIC"],
    estimatedDurationWeeks: { min: 16, max: 36 },
    estimatedFeeRangeUSD: { min: 100000, max: 500000 },
  },
  {
    key: "environmental_monitoring",
    name: "Environmental Monitoring Program Design",
    description: "Design and implementation of environmental monitoring systems including indicator selection, sampling protocols, and reporting frameworks.",
    typicalDeliverables: ["Monitoring Plan", "Indicator Framework", "Data Collection Protocols", "Reporting Templates"],
    relevantFamilies: ["hard_infrastructure", "ecosystems_natural_capital", "agriculture_food_systems", "disaster_response_recovery"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 6, max: 12 },
    estimatedFeeRangeUSD: { min: 30000, max: 120000 },
  },
  {
    key: "laboratory_testing",
    name: "Laboratory Testing and Validation",
    description: "Independent laboratory analysis of environmental samples (water, soil, air, biological) to establish baseline conditions and validate monitoring data.",
    typicalDeliverables: ["Laboratory Analysis Reports", "Quality Assurance Documentation", "Baseline Characterization"],
    relevantFamilies: ["hard_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 4, max: 10 },
    estimatedFeeRangeUSD: { min: 15000, max: 80000 },
  },
  {
    key: "climate_risk",
    name: "Climate Risk and Resilience Assessment",
    description: "Assessment of climate-related physical and transition risks using current and projected climate scenarios (RCP/SSP pathways).",
    typicalDeliverables: ["Climate Risk Assessment Report", "Adaptation Plan", "Resilience Investment Recommendations", "TCFD-aligned Disclosure"],
    relevantFamilies: ["hard_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital", "disaster_response_recovery", "soft_social_infrastructure"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT", "GUARANTEE"],
    estimatedDurationWeeks: { min: 8, max: 16 },
    estimatedFeeRangeUSD: { min: 50000, max: 200000 },
  },
  {
    key: "biodiversity_habitat",
    name: "Biodiversity and Habitat Assessment",
    description: "Assessment of biodiversity values, critical habitat identification, and biodiversity management plan development per IFC PS6.",
    typicalDeliverables: ["Biodiversity Baseline Survey", "Critical Habitat Assessment", "Biodiversity Action Plan", "No Net Loss Strategy"],
    relevantFamilies: ["ecosystems_natural_capital", "hard_infrastructure", "agriculture_food_systems"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 10, max: 20 },
    estimatedFeeRangeUSD: { min: 60000, max: 250000 },
  },
  {
    key: "watershed_hydrology",
    name: "Watershed and Hydrology Assessment",
    description: "Hydrological analysis, watershed characterization, and water resource assessment for water-dependent projects.",
    typicalDeliverables: ["Hydrological Study", "Watershed Management Plan", "Water Balance Analysis", "Flood Risk Assessment"],
    relevantFamilies: ["hard_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 8, max: 16 },
    estimatedFeeRangeUSD: { min: 45000, max: 180000 },
  },
  {
    key: "contamination_remediation",
    name: "Contamination Assessment and Remediation",
    description: "Phase I/II environmental site assessments, contamination characterization, and remediation planning.",
    typicalDeliverables: ["Phase I ESA", "Phase II Investigation", "Remedial Action Plan", "Risk-Based Corrective Action"],
    relevantFamilies: ["hard_infrastructure", "private_sector_productive"],
    relevantInstruments: ["LOAN", "BLENDED"],
    estimatedDurationWeeks: { min: 6, max: 20 },
    estimatedFeeRangeUSD: { min: 35000, max: 300000 },
  },
  {
    key: "stakeholder_social_impact",
    name: "Stakeholder Engagement and Social Impact Assessment",
    description: "Social baseline studies, stakeholder identification and engagement, social impact assessment, and grievance mechanism design per IFC PS1/PS4.",
    typicalDeliverables: ["Social Baseline Report", "Stakeholder Engagement Plan", "Social Impact Assessment", "Grievance Redress Mechanism"],
    relevantFamilies: ["hard_infrastructure", "soft_social_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital", "programmatic_multi_sector"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT", "PROGRAMMATIC"],
    estimatedDurationWeeks: { min: 8, max: 16 },
    estimatedFeeRangeUSD: { min: 40000, max: 150000 },
  },
  {
    key: "resettlement_livelihood",
    name: "Resettlement and Livelihood Restoration",
    description: "Resettlement Action Plans, livelihood restoration programs, and economic displacement mitigation per IFC PS5.",
    typicalDeliverables: ["Resettlement Action Plan (RAP)", "Livelihood Restoration Plan", "Census and Asset Inventory", "Compensation Framework"],
    relevantFamilies: ["hard_infrastructure", "ecosystems_natural_capital"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 12, max: 24 },
    estimatedFeeRangeUSD: { min: 80000, max: 400000 },
  },
  {
    key: "governance_institutional",
    name: "Governance and Institutional Systems Support",
    description: "Institutional capacity assessment, environmental governance gap analysis, and reform implementation support.",
    typicalDeliverables: ["Institutional Assessment", "Capacity Building Plan", "Governance Gap Analysis", "Reform Implementation Roadmap"],
    relevantFamilies: ["governance_institutional", "programmatic_multi_sector"],
    relevantInstruments: ["GRANT", "TECHNICAL_ASSISTANCE"],
    estimatedDurationWeeks: { min: 8, max: 24 },
    estimatedFeeRangeUSD: { min: 50000, max: 200000 },
  },
  {
    key: "baseline_monitoring_design",
    name: "Baseline and Monitoring System Design",
    description: "Design of comprehensive environmental and social baseline data collection and long-term monitoring systems.",
    typicalDeliverables: ["Baseline Data Collection Plan", "Monitoring System Architecture", "Data Management Protocols", "M&E Framework"],
    relevantFamilies: ["ecosystems_natural_capital", "agriculture_food_systems", "programmatic_multi_sector", "governance_institutional"],
    relevantInstruments: ["GRANT", "TECHNICAL_ASSISTANCE", "BLENDED"],
    estimatedDurationWeeks: { min: 6, max: 14 },
    estimatedFeeRangeUSD: { min: 35000, max: 120000 },
  },
  {
    key: "audit_verification",
    name: "Audit and Verification Services",
    description: "Independent environmental and social audit, compliance verification, and performance assessment against framework requirements.",
    typicalDeliverables: ["Compliance Audit Report", "Performance Assessment", "Corrective Action Plan", "Verification Statement"],
    relevantFamilies: ["hard_infrastructure", "soft_social_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital", "private_sector_productive"],
    relevantInstruments: ["LOAN", "BLENDED", "GRANT", "GUARANTEE"],
    estimatedDurationWeeks: { min: 3, max: 8 },
    estimatedFeeRangeUSD: { min: 20000, max: 80000 },
  },
  {
    key: "emergency_environmental",
    name: "Emergency Environmental Response",
    description: "Rapid environmental assessment, emergency containment, and post-disaster environmental recovery planning.",
    typicalDeliverables: ["Rapid Environmental Assessment", "Emergency Response Plan", "Environmental Recovery Plan", "Debris Management Strategy"],
    relevantFamilies: ["disaster_response_recovery"],
    relevantInstruments: ["EMERGENCY", "GRANT"],
    estimatedDurationWeeks: { min: 2, max: 8 },
    estimatedFeeRangeUSD: { min: 25000, max: 150000 },
  },
  {
    key: "transition_validation",
    name: "Transition Validation and Readiness Assessment",
    description: "Assessment of project readiness for instrument transition (e.g., grant to loan, blended to commercial). Validates risk reduction milestones and bankability criteria.",
    typicalDeliverables: ["Transition Readiness Report", "Risk Reduction Verification", "Bankability Assessment", "Condition Compliance Review"],
    relevantFamilies: ["hard_infrastructure", "agriculture_food_systems", "ecosystems_natural_capital", "private_sector_productive"],
    relevantInstruments: ["BLENDED", "GRANT"],
    estimatedDurationWeeks: { min: 4, max: 10 },
    estimatedFeeRangeUSD: { min: 30000, max: 100000 },
  },
];

export function getServicesForContext(
  sectorFamily: SectorFamilyKey,
  instrumentType: InstrumentType,
): ESLServiceCategory[] {
  return ESL_SERVICE_CATALOG.filter(
    s => s.relevantFamilies.includes(sectorFamily) && s.relevantInstruments.includes(instrumentType)
  );
}

export function recommendServices(
  sectorFamily: SectorFamilyKey,
  instrumentType: InstrumentType,
  persScore: number,
  dataConfidence: number,
  riskFactors: { environmentalRisk: number; humanExposureRisk: number; regulatoryRisk: number },
): { service: ESLServiceCategory; priority: "critical" | "recommended" | "optional"; reasoning: string }[] {
  const available = getServicesForContext(sectorFamily, instrumentType);
  const result: { service: ESLServiceCategory; priority: "critical" | "recommended" | "optional"; reasoning: string }[] = [];

  for (const svc of available) {
    let priority: "critical" | "recommended" | "optional" = "optional";
    let reasoning = "";

    if (svc.key === "esia" && persScore > 50) {
      priority = "critical";
      reasoning = "PERS >50 requires comprehensive ESIA for risk characterization and funder compliance.";
    } else if (svc.key === "eia" && riskFactors.regulatoryRisk > 50) {
      priority = "critical";
      reasoning = "Regulatory risk >50 indicates EIA is likely mandatory for permitting.";
    } else if (svc.key === "sea" && (instrumentType === "GRANT" || instrumentType === "PROGRAMMATIC") && persScore > 40) {
      priority = "recommended";
      reasoning = "Strategic assessment provides upstream intelligence critical for grant/programmatic interventions.";
    } else if (svc.key === "climate_risk" && persScore > 45) {
      priority = "recommended";
      reasoning = "Climate risk assessment needed given elevated PERS score in Caribbean context.";
    } else if (svc.key === "biodiversity_habitat" && sectorFamily === "ecosystems_natural_capital") {
      priority = "critical";
      reasoning = "Biodiversity assessment is essential for ecosystem/natural capital projects.";
    } else if (svc.key === "stakeholder_social_impact" && riskFactors.humanExposureRisk > 50) {
      priority = "critical";
      reasoning = "Human exposure risk >50 requires stakeholder engagement and social impact assessment.";
    } else if (svc.key === "environmental_monitoring" && dataConfidence < 60) {
      priority = "recommended";
      reasoning = "Low data confidence requires monitoring program to establish reliable baseline.";
    } else if (svc.key === "laboratory_testing" && dataConfidence < 50) {
      priority = "recommended";
      reasoning = "Very low data confidence — independent lab validation needed to establish baseline.";
    } else if (svc.key === "emergency_environmental" && sectorFamily === "disaster_response_recovery") {
      priority = "critical";
      reasoning = "Emergency environmental response is essential for disaster recovery projects.";
    } else if (svc.key === "transition_validation" && instrumentType === "BLENDED") {
      priority = "recommended";
      reasoning = "Transition validation required for blended finance to assess readiness for instrument transition.";
    } else if (svc.key === "governance_institutional" && sectorFamily === "governance_institutional") {
      priority = "critical";
      reasoning = "Institutional systems support is core to governance sector family.";
    } else {
      reasoning = "Available for this project context based on sector family and instrument type.";
    }

    result.push({ service: svc, priority, reasoning });
  }

  result.sort((a, b) => {
    const order = { critical: 0, recommended: 1, optional: 2 };
    return order[a.priority] - order[b.priority];
  });

  return result;
}
