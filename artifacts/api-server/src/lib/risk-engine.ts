interface RiskInputs {
  floodRisk: number;
  coastalExposure: number;
  contaminationRisk: number;
  regulatoryComplexity: number;
  communitySensitivity: number;
  waterStress: number;
  hasLabData: boolean;
  hasMonitoringData: boolean;
  isIFCAligned: boolean;
}

export interface RiskScores {
  environmentalRisk: number;
  infrastructureRisk: number;
  humanExposureRisk: number;
  regulatoryRisk: number;
  dataConfidence: number;
  overallRisk: number;
}

interface FinancialRisk {
  delayRiskPercent: number;
  costOverrunPercent: number;
  covenantBreachPercent: number;
  reputationalRisk: "Low" | "Medium" | "High";
}

interface Decision {
  outcome: "PROCEED" | "CONDITION" | "DECLINE";
  conditions: string[];
  insight: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function normalize(val: number, maxInput: number): number {
  return (val / maxInput) * 100;
}

export function calculateRiskScores(inputs: RiskInputs): RiskScores {
  const flood = normalize(inputs.floodRisk, 10);
  const coastal = normalize(inputs.coastalExposure, 10);
  const contamination = normalize(inputs.contaminationRisk, 10);
  const regulatory = normalize(inputs.regulatoryComplexity, 10);
  const community = normalize(inputs.communitySensitivity, 10);
  const water = normalize(inputs.waterStress, 10);

  const environmentalRisk = clamp(
    (flood * 0.25) + (contamination * 0.25) + (water * 0.20) + (coastal * 0.30),
    0, 100
  );

  const infrastructureRisk = clamp(
    (flood * 0.35) + (coastal * 0.35) + (regulatory * 0.30),
    0, 100
  );

  const humanExposureRisk = clamp(
    (community * 0.50) + (contamination * 0.50),
    0, 100
  );

  const regulatoryRisk = clamp(
    (regulatory * 0.60) + (community * 0.25) + (contamination * 0.15),
    0, 100
  );

  let dataConfidence = 40;
  if (inputs.hasLabData) dataConfidence += 20;
  if (inputs.hasMonitoringData) dataConfidence += 20;
  if (inputs.isIFCAligned) dataConfidence += 20;
  dataConfidence = clamp(dataConfidence, 0, 100);

  const rawOverall = (environmentalRisk * 0.30) +
    (infrastructureRisk * 0.25) +
    (humanExposureRisk * 0.20) +
    (regulatoryRisk * 0.25);

  const uncertaintyFactor = dataConfidence < 50 ? 0.20 : (dataConfidence < 70 ? 0.10 : 0);
  const overallRisk = clamp(rawOverall * (1 + uncertaintyFactor), 0, 100);

  return {
    environmentalRisk: Math.round(environmentalRisk * 10) / 10,
    infrastructureRisk: Math.round(infrastructureRisk * 10) / 10,
    humanExposureRisk: Math.round(humanExposureRisk * 10) / 10,
    regulatoryRisk: Math.round(regulatoryRisk * 10) / 10,
    dataConfidence: Math.round(dataConfidence * 10) / 10,
    overallRisk: Math.round(overallRisk * 10) / 10,
  };
}

export function calculateFinancialRisk(scores: RiskScores): FinancialRisk {
  let delayRiskPercent: number;
  if (scores.environmentalRisk > 70) {
    delayRiskPercent = 60 + (scores.environmentalRisk - 70) * 0.67;
  } else if (scores.environmentalRisk > 40) {
    delayRiskPercent = 25 + (scores.environmentalRisk - 40) * 1.17;
  } else {
    delayRiskPercent = scores.environmentalRisk * 0.625;
  }

  let costOverrunPercent: number;
  if (scores.infrastructureRisk > 70) {
    costOverrunPercent = 50 + (scores.infrastructureRisk - 70) * 0.67;
  } else if (scores.infrastructureRisk > 40) {
    costOverrunPercent = 20 + (scores.infrastructureRisk - 40) * 1.0;
  } else {
    costOverrunPercent = scores.infrastructureRisk * 0.5;
  }

  let covenantBreachPercent: number;
  if (scores.overallRisk > 70) {
    covenantBreachPercent = 55 + (scores.overallRisk - 70) * 0.5;
  } else if (scores.overallRisk > 40) {
    covenantBreachPercent = 20 + (scores.overallRisk - 40) * 1.17;
  } else {
    covenantBreachPercent = scores.overallRisk * 0.5;
  }

  if (scores.dataConfidence < 50) {
    delayRiskPercent *= 1.20;
    costOverrunPercent *= 1.20;
    covenantBreachPercent *= 1.20;
  }

  let reputationalRisk: "Low" | "Medium" | "High";
  if (scores.humanExposureRisk > 60 || scores.overallRisk > 70) {
    reputationalRisk = "High";
  } else if (scores.humanExposureRisk > 35 || scores.overallRisk > 45) {
    reputationalRisk = "Medium";
  } else {
    reputationalRisk = "Low";
  }

  return {
    delayRiskPercent: clamp(Math.round(delayRiskPercent), 0, 100),
    costOverrunPercent: clamp(Math.round(costOverrunPercent), 0, 100),
    covenantBreachPercent: clamp(Math.round(covenantBreachPercent), 0, 100),
    reputationalRisk,
  };
}

export function makeDecision(scores: RiskScores, inputs: RiskInputs): Decision {
  const conditions: string[] = [];
  let outcome: "PROCEED" | "CONDITION" | "DECLINE";

  if (scores.overallRisk > 70) {
    outcome = "DECLINE";
  } else if (scores.overallRisk > 40) {
    outcome = "CONDITION";
  } else {
    outcome = "PROCEED";
  }

  if (outcome === "CONDITION" || outcome === "DECLINE") {
    if (!inputs.hasMonitoringData) {
      conditions.push("Independent environmental monitoring required prior to investment commitment");
    }
    if (!inputs.hasLabData) {
      conditions.push("Independent laboratory validation of environmental baseline data required");
    }
    if (!inputs.isIFCAligned) {
      conditions.push("Alignment with IFC Performance Standards required for international financing");
    }
    if (scores.environmentalRisk > 50) {
      conditions.push("Environmental risk mitigation plan with quarterly reporting covenants");
    }
    if (scores.infrastructureRisk > 50) {
      conditions.push("Infrastructure resilience assessment and climate adaptation plan required");
    }
    if (scores.humanExposureRisk > 50) {
      conditions.push("Community engagement plan and social impact assessment required");
    }
    if (scores.regulatoryRisk > 50) {
      conditions.push("Strategic Environmental Assessment (SEA) or ESIA required before permitting — regulatory complexity demands pre-investment analysis");
    }
  }

  const insight = generateInsight(scores, inputs);

  return { outcome, conditions, insight };
}

function generateInsight(scores: RiskScores, inputs: RiskInputs): string {
  const parts: string[] = [];

  const highRisks: string[] = [];
  if (scores.environmentalRisk > 60) highRisks.push("environmental system risk");
  if (scores.infrastructureRisk > 60) highRisks.push("infrastructure vulnerability");
  if (scores.humanExposureRisk > 60) highRisks.push("human exposure risk");
  if (scores.regulatoryRisk > 60) highRisks.push("regulatory complexity");

  if (highRisks.length > 0) {
    parts.push(`Elevated ${highRisks.join(" and ")} detected in project assessment.`);
  }

  if (inputs.floodRisk > 6 && inputs.coastalExposure > 6) {
    parts.push("High flood and coastal exposure combined creates compounding infrastructure risk that may impact project timeline and costs.");
  }

  if (scores.dataConfidence < 50) {
    parts.push("Low data confidence significantly increases uncertainty in all risk projections. Independent monitoring and lab validation are critical to establish a reliable environmental baseline.");
  } else if (scores.dataConfidence < 70) {
    parts.push("Moderate data confidence suggests additional validation would strengthen the investment case.");
  }

  if (inputs.contaminationRisk > 6 && inputs.communitySensitivity > 6) {
    parts.push("Contamination risk combined with high community sensitivity creates elevated reputational and social license risk.");
  }

  if (inputs.waterStress > 7) {
    parts.push("Significant water stress may impact operational sustainability and trigger regulatory scrutiny.");
  }

  if (scores.overallRisk <= 40) {
    parts.push("Overall risk profile supports proceeding with standard due diligence protocols.");
  } else if (scores.overallRisk <= 70) {
    parts.push("Risk profile requires conditional approval with specific mitigation measures and enhanced monitoring.");
  } else {
    parts.push("Risk profile exceeds acceptable thresholds for investment. Fundamental risk mitigation required before reconsideration.");
  }

  return parts.join(" ");
}

export function analyzeProject(inputs: RiskInputs) {
  const riskScores = calculateRiskScores(inputs);
  const financialRisk = calculateFinancialRisk(riskScores);
  const decision = makeDecision(riskScores, inputs);
  return { riskScores, financialRisk, decision };
}
