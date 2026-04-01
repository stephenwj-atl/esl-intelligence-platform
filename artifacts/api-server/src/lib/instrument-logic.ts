export type InstrumentType =
  | "LOAN"
  | "GRANT"
  | "BLENDED"
  | "GUARANTEE"
  | "TECHNICAL_ASSISTANCE"
  | "PROGRAMMATIC"
  | "EMERGENCY";

export type GrantDecisionSignal =
  | "PROCEED"
  | "PROCEED_WITH_CONTROLS"
  | "RESEQUENCE"
  | "NARROW_SCOPE"
  | "DEFER_PENDING_BASELINE"
  | "DO_NOT_FUND";

export type LoanDecisionSignal = "PROCEED" | "CONDITION" | "DECLINE";

export type BlendedLabel =
  | "GRANT_FIRST"
  | "BLENDED_NOW"
  | "LOAN_READY_AFTER_VALIDATION"
  | "STRUCTURE_NOT_YET_BANKABLE";

export type DecisionSignal = LoanDecisionSignal | GrantDecisionSignal;

export interface InstrumentAssessment {
  instrumentType: InstrumentType;
  decisionSignal: DecisionSignal;
  structureRiskScore: number;
  reasoning: string[];
  conditions: string[];
  blendedLabel?: BlendedLabel;
}

interface ScoreInputs {
  persScore: number;
  dataConfidence: number;
  outcomeDeliveryScore: number;
  implementationCapacity: number;
  disbursementReadiness: number;
}

export function assessInstrument(
  instrumentType: InstrumentType,
  inputs: ScoreInputs,
): InstrumentAssessment {
  switch (instrumentType) {
    case "LOAN": return assessLoan(inputs);
    case "GRANT": return assessGrant(inputs);
    case "BLENDED": return assessBlended(inputs);
    case "GUARANTEE": return assessGuarantee(inputs);
    case "TECHNICAL_ASSISTANCE": return assessTA(inputs);
    case "PROGRAMMATIC": return assessProgrammatic(inputs);
    case "EMERGENCY": return assessEmergency(inputs);
  }
}

function assessLoan(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, dataConfidence } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: LoanDecisionSignal;
  if (persScore > 70) {
    signal = "DECLINE";
    reasoning.push("PERS exceeds 70 — risk level too high for commercial lending without significant restructuring.");
  } else if (persScore > 40) {
    signal = "CONDITION";
    reasoning.push("PERS in conditional range (40-70) — loan feasible with enhanced due diligence and covenant protections.");
  } else {
    signal = "PROCEED";
    reasoning.push("PERS below 40 — risk profile supports standard lending terms.");
  }

  if (dataConfidence < 50) {
    conditions.push("Independent baseline verification required before first disbursement.");
    reasoning.push("Low data confidence increases pricing uncertainty.");
  }

  const structureRisk = clamp(persScore * 0.6 + (100 - dataConfidence) * 0.4, 0, 100);

  if (persScore > 50) conditions.push("Quarterly environmental monitoring covenant required.");
  if (persScore > 60) conditions.push("Climate resilience assessment mandatory pre-commitment.");

  return { instrumentType: "LOAN", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function assessGrant(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, dataConfidence, outcomeDeliveryScore, implementationCapacity, disbursementReadiness } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: GrantDecisionSignal;

  if (persScore > 85 && implementationCapacity < 30) {
    signal = "DO_NOT_FUND";
    reasoning.push("Extreme risk combined with very low implementation capacity — grant capital unlikely to achieve any outcomes.");
  } else if (persScore > 70 && outcomeDeliveryScore > 50) {
    signal = "PROCEED_WITH_CONTROLS";
    reasoning.push("High environmental risk but outcome delivery is feasible with enhanced controls. Grant rationale: risk is precisely why concessional capital is needed.");
    conditions.push("Monthly progress reporting with outcome verification.");
    conditions.push("Independent mid-term review at 50% disbursement.");
    conditions.push("Environmental and social safeguards monitoring quarterly.");
  } else if (persScore > 70 && outcomeDeliveryScore <= 50) {
    signal = "NARROW_SCOPE";
    reasoning.push("High risk and weak outcome delivery confidence. Recommend reducing scope to achievable outcomes before committing full grant.");
    conditions.push("Phased scope with initial pilot.");
  } else if (disbursementReadiness < 40) {
    signal = "DEFER_PENDING_BASELINE";
    reasoning.push("Disbursement readiness too low — baseline data, safeguard assessments, or procurement readiness not yet sufficient.");
    conditions.push("Complete baseline assessment before grant activation.");
  } else if (persScore > 55 || dataConfidence < 50) {
    signal = "PROCEED_WITH_CONTROLS";
    reasoning.push("Moderate-to-elevated risk — grant can proceed with enhanced monitoring and milestone-based disbursement.");
    conditions.push("Milestone-based disbursement with quarterly verification.");
  } else if (outcomeDeliveryScore < 40 && implementationCapacity < 50) {
    signal = "RESEQUENCE";
    reasoning.push("Outcome delivery confidence low. Recommend sequencing: capacity building first, then full program deployment.");
    conditions.push("Technical assistance component before program activities.");
  } else {
    signal = "PROCEED";
    reasoning.push("Risk profile and outcome confidence support standard grant deployment.");
  }

  const structureRisk = clamp(
    persScore * 0.3 + (100 - outcomeDeliveryScore) * 0.3 + (100 - implementationCapacity) * 0.2 + (100 - disbursementReadiness) * 0.2,
    0, 100
  );

  return { instrumentType: "GRANT", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function assessBlended(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, dataConfidence, outcomeDeliveryScore, implementationCapacity, disbursementReadiness } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: DecisionSignal;
  let blendedLabel: BlendedLabel;

  if (persScore > 80 && implementationCapacity < 30) {
    signal = "DO_NOT_FUND";
    blendedLabel = "STRUCTURE_NOT_YET_BANKABLE";
    reasoning.push("Risk too high for even blended structuring. Grant component would absorb all risk without transition pathway.");
  } else if (persScore > 65) {
    signal = "PROCEED_WITH_CONTROLS";
    blendedLabel = "GRANT_FIRST";
    reasoning.push("High risk but blended structure can absorb it: grant component provides first-loss protection, debt enters after risk reduction milestones.");
    conditions.push("Grant-first sequencing: concessional capital deploys before commercial tranche.");
    conditions.push("Transition trigger: PERS must reduce below 50 before debt activation.");
  } else if (persScore > 40) {
    signal = "CONDITION";
    blendedLabel = "BLENDED_NOW";
    reasoning.push("Moderate risk — blended structure appropriate. Define clear grant/debt split and transition conditions.");
    conditions.push("Define milestone-based transition from concessional to commercial terms.");
  } else {
    signal = "PROCEED";
    blendedLabel = "LOAN_READY_AFTER_VALIDATION";
    reasoning.push("Low risk — blended structure may not be necessary. Consider whether pure loan or grant is more efficient.");
  }

  if (disbursementReadiness < 35 && blendedLabel !== "STRUCTURE_NOT_YET_BANKABLE") {
    blendedLabel = "STRUCTURE_NOT_YET_BANKABLE";
    reasoning.push("Disbursement readiness too low for deployment — structure is not yet bankable.");
  }

  const structureRisk = clamp(
    persScore * 0.35 + (100 - dataConfidence) * 0.20 + (100 - outcomeDeliveryScore) * 0.25 + (100 - disbursementReadiness) * 0.20,
    0, 100
  );

  if (persScore > 50) {
    const grantShare = Math.min(80, 30 + (persScore - 50) * 1.5);
    reasoning.push(`Recommended grant component: ${Math.round(grantShare)}% to absorb initial risk.`);
  }

  return { instrumentType: "BLENDED", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions, blendedLabel };
}

function assessGuarantee(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, dataConfidence } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: DecisionSignal;
  if (persScore > 75) {
    signal = "DECLINE";
    reasoning.push("Risk too high for guarantee product — potential call rate exceeds acceptable threshold.");
  } else if (persScore > 40) {
    signal = "CONDITION";
    reasoning.push("Guarantee feasible with premium adjustment and coverage limits.");
    conditions.push("Cap guarantee coverage at 50% of exposure.");
    conditions.push("Annual risk reassessment required.");
  } else {
    signal = "PROCEED";
    reasoning.push("Risk profile supports standard guarantee terms.");
  }

  const structureRisk = clamp(persScore * 0.7 + (100 - dataConfidence) * 0.3, 0, 100);

  return { instrumentType: "GUARANTEE", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function assessTA(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, implementationCapacity, outcomeDeliveryScore } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: DecisionSignal;
  if (implementationCapacity < 20) {
    signal = "DEFER_PENDING_BASELINE";
    reasoning.push("Implementation capacity too low for TA absorption. Recommend institutional readiness assessment first.");
  } else if (persScore > 60 && outcomeDeliveryScore < 40) {
    signal = "NARROW_SCOPE";
    reasoning.push("High risk environment with weak outcome confidence. Focus TA on specific, achievable deliverables.");
  } else {
    signal = "PROCEED";
    reasoning.push("TA deployment appropriate — knowledge transfer and capacity building can proceed.");
  }

  const structureRisk = clamp((100 - implementationCapacity) * 0.5 + persScore * 0.3 + (100 - outcomeDeliveryScore) * 0.2, 0, 100);

  return { instrumentType: "TECHNICAL_ASSISTANCE", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function assessProgrammatic(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, outcomeDeliveryScore, implementationCapacity, disbursementReadiness } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: DecisionSignal;
  if (persScore > 75 && outcomeDeliveryScore < 30) {
    signal = "DO_NOT_FUND";
    reasoning.push("Programmatic risk too high with very weak outcome chain. Program design needs fundamental rework.");
  } else if (disbursementReadiness < 35) {
    signal = "DEFER_PENDING_BASELINE";
    reasoning.push("Program not yet ready for deployment. Baseline assessments and institutional readiness incomplete.");
  } else if (persScore > 55) {
    signal = "PROCEED_WITH_CONTROLS";
    reasoning.push("Programmatic deployment with enhanced safeguards and staged rollout.");
    conditions.push("Phased deployment: start with 2-3 pilot sites before scaling.");
    conditions.push("Quarterly results framework review.");
  } else {
    signal = "PROCEED";
    reasoning.push("Program risk profile supports standard deployment.");
  }

  const structureRisk = clamp(
    persScore * 0.25 + (100 - outcomeDeliveryScore) * 0.30 + (100 - implementationCapacity) * 0.25 + (100 - disbursementReadiness) * 0.20,
    0, 100
  );

  return { instrumentType: "PROGRAMMATIC", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function assessEmergency(inputs: ScoreInputs): InstrumentAssessment {
  const { persScore, implementationCapacity } = inputs;
  const reasoning: string[] = [];
  const conditions: string[] = [];

  let signal: DecisionSignal;
  if (implementationCapacity < 15) {
    signal = "NARROW_SCOPE";
    reasoning.push("Emergency deployment capacity critically low. Narrow to life-safety essentials only.");
  } else if (persScore > 80) {
    signal = "PROCEED_WITH_CONTROLS";
    reasoning.push("Extreme risk environment — emergency deployment must proceed but with maximum safeguards. Confidence penalties are reduced for emergency instruments.");
    conditions.push("Build-back-better compliance required.");
    conditions.push("Post-emergency environmental assessment within 90 days.");
  } else {
    signal = "PROCEED";
    reasoning.push("Emergency deployment approved. Standard rapid-response protocols apply.");
  }

  const structureRisk = clamp(persScore * 0.4 + (100 - implementationCapacity) * 0.6, 0, 100);

  return { instrumentType: "EMERGENCY", decisionSignal: signal, structureRiskScore: round(structureRisk), reasoning, conditions };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round(val: number): number {
  return Math.round(val * 10) / 10;
}
