import type { InstrumentType } from "./instrument-logic";

export interface FunderFramework {
  key: string;
  displayName: string;
  instrumentRelevance: InstrumentType[];
  safeguardEmphasis: {
    environmental: "high" | "medium" | "low";
    social: "high" | "medium" | "low";
    climate: "high" | "medium" | "low";
    biodiversity: "high" | "medium" | "low";
    gender: "high" | "medium" | "low";
  };
  reportingStyle: string;
  baselineExpectations: string;
  disbursementControls: string;
  resultsFrameworkEmphasis: string;
  permissibilityCues: string[];
  typicalConditions: string[];
  categoryMapping: string;
  notes: string;
  limitations: string;
  recommendationModifiers: {
    persThresholdAdjustment: number;
    confidenceMinimum: number;
    monitoringEmphasis: "standard" | "enhanced" | "intensive";
    theoryOfChangeScrutiny: "standard" | "enhanced" | "rigorous";
    transitionExpectation: "not_applicable" | "encouraged" | "required";
  };
}

export const FUNDER_FRAMEWORKS: FunderFramework[] = [
  {
    key: "idb",
    displayName: "Inter-American Development Bank (IDB)",
    instrumentRelevance: ["LOAN", "GRANT", "BLENDED", "TECHNICAL_ASSISTANCE"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "medium", gender: "high" },
    reportingStyle: "IDB Environmental and Social Performance Framework (ESPF). Semi-annual progress reports. Environmental and social compliance reports required at key milestones.",
    baselineExpectations: "ESIA or equivalent required for Category A/B. Baseline environmental conditions documented. Stakeholder engagement plan mandatory. Climate risk screening for all projects.",
    disbursementControls: "Milestone-based with safeguard compliance conditions. No-objection process for procurement. Fiduciary conditions on first disbursement.",
    resultsFrameworkEmphasis: "Development effectiveness matrix. Core sector indicators required. Gender and diversity results tracking. Climate finance tracking for tagged operations.",
    permissibilityCues: ["IDB exclusion list applies", "Free Prior Informed Consent (FPIC) for indigenous peoples", "No involuntary resettlement without RAP", "Climate vulnerability screening mandatory"],
    typicalConditions: ["ESIA approved before first disbursement", "ESMP implementation plan in place", "Stakeholder engagement plan disclosed", "Quarterly E&S monitoring reports", "Independent mid-term review"],
    categoryMapping: "Category A: significant adverse impacts. Category B: limited impacts. Category C: minimal impacts. FI: financial intermediary operations.",
    notes: "IDB applies ESPF (2021) to sovereign-guaranteed operations. IDB Invest applies IFC Performance Standards to non-sovereign operations.",
    limitations: "ESL platform models IDB sovereign lending safeguards. IDB Invest private-sector logic uses IFC PS alignment. Country systems equivalence is not modeled.",
    recommendationModifiers: { persThresholdAdjustment: 0, confidenceMinimum: 55, monitoringEmphasis: "enhanced", theoryOfChangeScrutiny: "enhanced", transitionExpectation: "encouraged" },
  },
  {
    key: "idb_invest",
    displayName: "IDB Invest",
    instrumentRelevance: ["LOAN", "GUARANTEE", "BLENDED"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "high", gender: "medium" },
    reportingStyle: "IFC Performance Standards alignment. Annual monitoring reports. Independent E&S audit at defined intervals.",
    baselineExpectations: "Full IFC PS compliance for Category A. Cumulative impact assessment for significant operations. Biodiversity offset strategy where critical habitat affected.",
    disbursementControls: "Covenant-based with environmental and social action plan milestones. Conditions precedent to first disbursement.",
    resultsFrameworkEmphasis: "DELTA (Development Effectiveness Learning, Tracking, and Assessment). Private-sector development impact metrics. IRIS+ alignment encouraged.",
    permissibilityCues: ["IFC exclusion list", "PS6 critical habitat triggers mandatory biodiversity assessment", "Labor audit for supply chain operations", "Greenhouse gas quantification for significant emitters"],
    typicalConditions: ["ESAP fully costed and time-bound", "Annual E&S compliance report", "Covenant triggers for material non-compliance", "Third-party E&S audit at project mid-point"],
    categoryMapping: "Category A/B/C/FI per IFC screening. Risk categorization drives supervision intensity.",
    notes: "Applies IFC Performance Standards directly. More rigorous for private-sector operations. Additionality assessment required.",
    limitations: "ESL models general IFC PS alignment. Sector-specific IFC guidance notes (e.g., mining, agribusiness) are not modeled individually.",
    recommendationModifiers: { persThresholdAdjustment: -5, confidenceMinimum: 60, monitoringEmphasis: "intensive", theoryOfChangeScrutiny: "standard", transitionExpectation: "not_applicable" },
  },
  {
    key: "cdb",
    displayName: "Caribbean Development Bank (CDB)",
    instrumentRelevance: ["LOAN", "GRANT", "BLENDED", "TECHNICAL_ASSISTANCE"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "medium", gender: "high" },
    reportingStyle: "CDB Environmental and Social Review Procedures (ESRP). Quarterly progress reports. Annual environmental and social performance reviews.",
    baselineExpectations: "ESIA for Category A. Environmental analysis for Category B. Climate and disaster risk screening for all projects. Gender analysis required.",
    disbursementControls: "Milestone-based. Procurement per CDB guidelines. National competitive bidding for most contracts. Prior review thresholds.",
    resultsFrameworkEmphasis: "CDB Results Monitoring Framework. Caribbean-specific development indicators. Climate resilience metrics for tagged operations. Poverty reduction indicators.",
    permissibilityCues: ["CDB environmental policy compliance", "Disaster risk reduction integration", "Gender mainstreaming mandatory", "Small Island Developing States (SIDS) vulnerability considered"],
    typicalConditions: ["Environmental clearance from national authority", "ESIA/EA approved by CDB", "Stakeholder consultation records", "Semi-annual E&S monitoring", "Build-back-better for reconstruction"],
    categoryMapping: "Category A: significant impacts. Category B: less significant. Category C: minimal. Uses CDB ESRP screening.",
    notes: "Primary Caribbean multilateral development bank. Deep knowledge of SIDS-specific challenges. Climate and disaster resilience is core mandate.",
    limitations: "ESL models CDB safeguard posture at a general level. Country-specific CDB programming priorities are not modeled.",
    recommendationModifiers: { persThresholdAdjustment: 5, confidenceMinimum: 50, monitoringEmphasis: "enhanced", theoryOfChangeScrutiny: "enhanced", transitionExpectation: "encouraged" },
  },
  {
    key: "world_bank",
    displayName: "World Bank (IBRD/IDA)",
    instrumentRelevance: ["LOAN", "GRANT", "BLENDED", "TECHNICAL_ASSISTANCE", "PROGRAMMATIC"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "high", gender: "high" },
    reportingStyle: "Environmental and Social Framework (ESF). Implementation Status Reports (ISR). Independent Evaluation Group (IEG) post-completion reviews.",
    baselineExpectations: "Environmental and Social Commitment Plan (ESCP) required. Stakeholder Engagement Plan (SEP) mandatory. Labor Management Procedures. ESS compliance across 10 standards.",
    disbursementControls: "Disbursement-linked indicators (DLIs) for PforR. Traditional milestone-based for IPF. Prior review thresholds. Retroactive financing limited.",
    resultsFrameworkEmphasis: "Project Development Objectives (PDO) indicators mandatory. Core sector indicators. Corporate results scorecard. IDA results measurement system.",
    permissibilityCues: ["ESF 10 Environmental and Social Standards", "ESS7 Indigenous Peoples/Sub-Saharan African Historically Underserved Traditional Local Communities", "ESS5 Land Acquisition", "Climate co-benefits tracking", "Grievance mechanism mandatory"],
    typicalConditions: ["ESCP agreed before Board approval", "SEP disclosed 30 days before appraisal", "LMP in place before construction", "Borrower institutional capacity assessment", "Third-party monitoring for high-risk"],
    categoryMapping: "High Risk, Substantial Risk, Moderate Risk, Low Risk. Risk classification drives ESF application intensity.",
    notes: "Most comprehensive safeguard framework in development finance. ESF replaced legacy safeguard policies in 2018. Dual lending: IBRD (market-rate) and IDA (concessional).",
    limitations: "ESL models general ESF posture. Project-specific ESS application is determined by WB task team, not the platform. Inspection Panel complaints are not modeled.",
    recommendationModifiers: { persThresholdAdjustment: -5, confidenceMinimum: 60, monitoringEmphasis: "intensive", theoryOfChangeScrutiny: "rigorous", transitionExpectation: "not_applicable" },
  },
  {
    key: "gcf",
    displayName: "Green Climate Fund (GCF)",
    instrumentRelevance: ["GRANT", "BLENDED", "LOAN", "GUARANTEE"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "high", gender: "high" },
    reportingStyle: "GCF Environmental and Social Policy. Annual performance reports. Mid-term and terminal evaluations. Gender action plan reporting.",
    baselineExpectations: "Climate rationale mandatory — must demonstrate climate impact. ESIA for Category A/intermediation-1. Gender assessment and action plan required. Indigenous peoples plan where relevant.",
    disbursementControls: "Funded Activity Agreement (FAA) conditions. GCF Board conditions. Accredited entity fiduciary requirements. Co-financing arrangements.",
    resultsFrameworkEmphasis: "GCF results management framework. Paradigm shift potential scoring. Core GCF indicators: tCO2eq avoided, beneficiaries, climate-resilient assets. Investment criteria scoring.",
    permissibilityCues: ["Climate rationale must be primary", "Paradigm shift potential assessed", "Country ownership via NDA no-objection", "Gender action plan mandatory", "SIDS/LDC priority access"],
    typicalConditions: ["NDA no-objection letter", "Gender action plan approved", "ESIA/ESMP for Category A/B", "FAA executed", "Co-financing confirmed", "Monitoring and accountability framework"],
    categoryMapping: "Category A (high risk), Category B (medium risk), Category C (minimal risk), Intermediation 1/2/3.",
    notes: "Primary global climate fund. Caribbean SIDS have preferential access. 50:50 allocation between mitigation and adaptation. Paradigm shift potential is key assessment criterion.",
    limitations: "ESL does not model GCF investment criteria scoring (paradigm shift, sustainable development, needs of recipient). Climate rationale assessment requires sector-specific expertise beyond environmental risk.",
    recommendationModifiers: { persThresholdAdjustment: 10, confidenceMinimum: 45, monitoringEmphasis: "enhanced", theoryOfChangeScrutiny: "rigorous", transitionExpectation: "encouraged" },
  },
  {
    key: "gef",
    displayName: "Global Environment Facility (GEF)",
    instrumentRelevance: ["GRANT", "BLENDED", "TECHNICAL_ASSISTANCE"],
    safeguardEmphasis: { environmental: "high", social: "medium", climate: "high", biodiversity: "high", gender: "medium" },
    reportingStyle: "GEF Monitoring Policy. Project Implementation Reports (PIR). Terminal Evaluation. GEF IEO reviews.",
    baselineExpectations: "GEF focal area strategy alignment. Co-financing requirements (minimum ratios). Environmental and social safeguards per agency policies. Global environmental benefits quantification.",
    disbursementControls: "GEF agency-managed per implementing agency policies. GEF Secretariat review for major budget changes.",
    resultsFrameworkEmphasis: "GEF core indicators (GEBs). Hectares under management. Species benefiting. Chemicals reduced/eliminated. tCO2eq mitigated.",
    permissibilityCues: ["Must address global environmental benefits", "Focal area strategy alignment required", "Country eligibility and endorsement", "Co-financing ratios must be met", "STAP screening for scientific merit"],
    typicalConditions: ["GEF CEO endorsement", "Co-financing letters confirmed", "Agency safeguard clearance", "GEF core indicator targets established", "Knowledge management plan"],
    categoryMapping: "Uses implementing agency categorization (WB, UNDP, UNEP, etc.). GEF applies policy on environmental and social safeguards.",
    notes: "Primary biodiversity and environmental fund. Caribbean SIDS eligible under SIDS focal area. Incremental cost principle applies. Co-financing typically 3:1 or higher.",
    limitations: "ESL models general GEF safeguard posture. GEF focal area strategy alignment requires program-level analysis not captured by project-level PERS.",
    recommendationModifiers: { persThresholdAdjustment: 10, confidenceMinimum: 45, monitoringEmphasis: "standard", theoryOfChangeScrutiny: "rigorous", transitionExpectation: "not_applicable" },
  },
  {
    key: "adaptation_fund",
    displayName: "Adaptation Fund",
    instrumentRelevance: ["GRANT", "TECHNICAL_ASSISTANCE"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "medium", gender: "high" },
    reportingStyle: "AF Environmental and Social Policy. Annual performance reports. Mid-term review. Terminal evaluation. Gender mainstreaming reporting.",
    baselineExpectations: "Concrete adaptation focus required. Environmental and social assessment proportionate to risk. Community-level vulnerability assessment. Gender analysis.",
    disbursementControls: "Tranche-based disbursement. NIE/MIE fiduciary management. AF Board review for significant scope changes.",
    resultsFrameworkEmphasis: "AF strategic results framework. Core outcome/output indicators. Concrete adaptation outputs. Direct beneficiaries (disaggregated by gender). Ecosystem resilience.",
    permissibilityCues: ["Concrete adaptation projects only", "Vulnerability reduction must be measurable", "SIDS/LDC priority", "Direct access modality encouraged", "Community engagement mandatory"],
    typicalConditions: ["Designated Authority endorsement", "E&S assessment approved", "Gender assessment complete", "Community consultation records", "Adaptation rationale documented"],
    categoryMapping: "Category A (significant risk), Category B (moderate risk), Category C (low risk). Environmental and Social Policy compliance.",
    notes: "Dedicated adaptation fund under UNFCCC/Paris Agreement. Caribbean SIDS are priority recipients. Supports both NIE (national) and MIE (multilateral) access.",
    limitations: "ESL does not model AF readiness assessment or NIE accreditation requirements. Concrete adaptation metrics require sector-specific assessment.",
    recommendationModifiers: { persThresholdAdjustment: 15, confidenceMinimum: 40, monitoringEmphasis: "standard", theoryOfChangeScrutiny: "enhanced", transitionExpectation: "not_applicable" },
  },
  {
    key: "eib",
    displayName: "European Investment Bank (EIB)",
    instrumentRelevance: ["LOAN", "GUARANTEE", "BLENDED"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "high", gender: "medium" },
    reportingStyle: "EIB Environmental and Social Standards. Annual monitoring reports. Completion reports. EIB Complaints Mechanism.",
    baselineExpectations: "EU EIA Directive alignment. Climate risk and vulnerability assessment. Paris alignment screening. Biodiversity standards per EU Taxonomy where applicable.",
    disbursementControls: "Covenant-based. Conditions precedent. Financial covenant compliance. Annual environmental and social reporting.",
    resultsFrameworkEmphasis: "EIB results measurement framework. Additionality assessment. EU policy objectives tracking. Climate action indicators.",
    permissibilityCues: ["EU exclusion list applies", "Paris alignment mandatory", "EU Taxonomy screening for climate", "EIB carbon footprint methodology", "Human rights due diligence"],
    typicalConditions: ["EIA approved by competent authority", "Climate risk assessment complete", "Annual E&S compliance certificate", "Financial covenants maintained", "Paris alignment verified"],
    categoryMapping: "Uses EU EIA Directive categories. EIB applies own E&S standards to operations outside EU.",
    notes: "Largest multilateral lender by volume. Active in Caribbean through EU-ACP programming. Strong climate mandate (50%+ climate/environment by 2025).",
    limitations: "ESL models general EIB E&S posture. EU-specific regulatory requirements (Habitats Directive, Water Framework Directive) may not apply directly in Caribbean.",
    recommendationModifiers: { persThresholdAdjustment: -5, confidenceMinimum: 60, monitoringEmphasis: "enhanced", theoryOfChangeScrutiny: "standard", transitionExpectation: "not_applicable" },
  },
  {
    key: "equator_principles",
    displayName: "Equator Principles (EP4)",
    instrumentRelevance: ["LOAN", "GUARANTEE", "BLENDED"],
    safeguardEmphasis: { environmental: "high", social: "high", climate: "high", biodiversity: "high", gender: "medium" },
    reportingStyle: "EP Annual reporting to EP Association. ESAP progress reporting. Independent review for Category A. Client annual monitoring reports.",
    baselineExpectations: "IFC Performance Standards compliance. ESIA for Category A. Cumulative impact assessment for significant projects. Climate risk assessment per TCFD for all Category A and as-appropriate Category B.",
    disbursementControls: "Covenant-based per individual EPFI policies. Material breach provisions. Independent E&S monitoring for Category A.",
    resultsFrameworkEmphasis: "EP4 Principle compliance. IFC PS alignment tracking. TCFD-aligned climate disclosure. Informed Consultation and Participation documentation.",
    permissibilityCues: ["IFC PS 1-8 compliance", "Free Prior Informed Consent for affected Indigenous Peoples", "TCFD climate risk for Category A", "Independent E&S review for Category A", "Designated countries concept for national law assessment"],
    typicalConditions: ["ESIA completed and disclosed", "ESAP agreed with client", "Independent E&S consultant appointed (Cat A)", "Covenants in loan agreement", "Annual E&S compliance certificate"],
    categoryMapping: "Category A (significant impacts), Category B (limited impacts), Category C (minimal impacts). Thresholds: >$10M for project finance.",
    notes: "Voluntary framework for commercial banks. Over 130 EPFIs globally. Applies to project finance, project-related corporate loans, bridge loans, and project-related refinance/acquisition.",
    limitations: "EP4 is a framework, not a funder. Individual EPFI application varies. ESL models general EP4 compliance requirements, not individual bank policies.",
    recommendationModifiers: { persThresholdAdjustment: -5, confidenceMinimum: 60, monitoringEmphasis: "intensive", theoryOfChangeScrutiny: "standard", transitionExpectation: "not_applicable" },
  },
];

export function getFunderFramework(key: string): FunderFramework | undefined {
  return FUNDER_FRAMEWORKS.find(f => f.key === key);
}

export function getAllFunderFrameworks(): FunderFramework[] {
  return FUNDER_FRAMEWORKS;
}

export interface FunderRecommendation {
  safeguardsPackage: string[];
  additionalConditions: string[];
  requiredEvidence: string[];
  reportingCadence: string;
  monitoringEmphasis: string;
  disbursementControlEmphasis: string;
  theoryOfChangeScrutiny: string;
  transitionExpectations: string;
  warnings: string[];
}

export function applyFunderToProject(
  frameworkKey: string,
  persScore: number,
  dataConfidence: number,
  instrumentType: InstrumentType,
): FunderRecommendation | null {
  const fw = getFunderFramework(frameworkKey);
  if (!fw) return null;

  const safeguardsPackage: string[] = [];
  const additionalConditions: string[] = [...fw.typicalConditions];
  const requiredEvidence: string[] = [];
  const warnings: string[] = [];

  if (fw.safeguardEmphasis.environmental === "high") {
    safeguardsPackage.push("Full environmental assessment (ESIA or equivalent)");
    requiredEvidence.push("Approved ESIA/EIA report");
  }
  if (fw.safeguardEmphasis.social === "high") {
    safeguardsPackage.push("Social impact assessment with stakeholder engagement");
    requiredEvidence.push("Stakeholder engagement plan and consultation records");
  }
  if (fw.safeguardEmphasis.climate === "high") {
    safeguardsPackage.push("Climate risk and vulnerability assessment");
    requiredEvidence.push("Climate risk screening report");
  }
  if (fw.safeguardEmphasis.biodiversity === "high") {
    safeguardsPackage.push("Biodiversity baseline and critical habitat screening");
    requiredEvidence.push("Biodiversity assessment report");
  }
  if (fw.safeguardEmphasis.gender === "high") {
    safeguardsPackage.push("Gender analysis and action plan");
    requiredEvidence.push("Gender assessment report");
  }

  const mods = fw.recommendationModifiers;

  if (dataConfidence < mods.confidenceMinimum) {
    warnings.push(`Data confidence (${dataConfidence}%) below ${fw.displayName} minimum threshold (${mods.confidenceMinimum}%). Independent baseline verification required.`);
    additionalConditions.push("Independent baseline verification before first disbursement");
  }

  const adjustedPers = persScore - mods.persThresholdAdjustment;
  if (adjustedPers > 70) {
    warnings.push(`Adjusted PERS (${Math.round(adjustedPers)}) exceeds high-risk threshold under ${fw.displayName} framework.`);
  }

  if (!fw.instrumentRelevance.includes(instrumentType)) {
    warnings.push(`${fw.displayName} does not typically support ${instrumentType} instruments.`);
  }

  const reportingCadence = mods.monitoringEmphasis === "intensive" ? "Monthly progress + quarterly E&S compliance"
    : mods.monitoringEmphasis === "enhanced" ? "Quarterly progress + semi-annual E&S compliance"
    : "Semi-annual progress + annual E&S compliance";

  return {
    safeguardsPackage,
    additionalConditions,
    requiredEvidence,
    reportingCadence,
    monitoringEmphasis: mods.monitoringEmphasis,
    disbursementControlEmphasis: fw.disbursementControls,
    theoryOfChangeScrutiny: mods.theoryOfChangeScrutiny,
    transitionExpectations: mods.transitionExpectation === "required" ? "Transition pathway mandatory for blended finance"
      : mods.transitionExpectation === "encouraged" ? "Transition pathway assessment encouraged"
      : "Not applicable for this framework",
    warnings,
  };
}
