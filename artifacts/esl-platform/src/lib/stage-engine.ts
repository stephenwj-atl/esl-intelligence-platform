export interface Stage {
  id: number;
  name: string;
  shortName: string;
}

export const STAGES: Stage[] = [
  { id: 1, name: "Intake Screening", shortName: "Screening" },
  { id: 2, name: "Baseline Data Formation", shortName: "Baseline" },
  { id: 3, name: "Risk Characterisation", shortName: "Risk" },
  { id: 4, name: "Decision and Capital Sequencing", shortName: "Decision" },
  { id: 5, name: "Deployment Control", shortName: "Control" },
  { id: 6, name: "Transition Validation", shortName: "Validation" },
  { id: 7, name: "Risk Resolution", shortName: "Resolution" },
];

export const TAB_STAGE_MAP: Record<string, string> = {
  decision: "Stage 4: Decision",
  structure: "Stage 5: Control",
  financial: "Stage 4–5",
  impact: "Stage 3–4",
  drivers: "Stage 3: Risk",
  evidence: "Stage 2: Baseline",
  scenario: "Stage 3–5",
  monitoring: "Stage 6: Validation",
  esl: "Stage 5–7",
  report: "Stage 4–7",
  audit: "Stage 5–7",
};

export interface ProjectStageData {
  inputs: {
    hasLabData: boolean;
    hasMonitoringData: boolean;
    isIFCAligned: boolean;
  };
  riskScores: {
    overallRisk: number;
    dataConfidence: number;
  };
  decision: {
    outcome: string;
  };
}

export interface StageResult {
  currentStage: number;
  stageName: string;
  nextStage: string | null;
  blockingConditions: string[];
  completedStages: number[];
}

export function determineStage(project: ProjectStageData): StageResult {
  const completedStages: number[] = [];
  const blockingConditions: string[] = [];

  const screened = project.riskScores.overallRisk >= 0 && project.decision.outcome !== "";
  if (!screened) {
    blockingConditions.push("Initial screening not complete");
    return {
      currentStage: 1,
      stageName: STAGES[0].name,
      nextStage: STAGES[1].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(1);

  const hasBaseline = project.inputs.hasLabData || project.inputs.hasMonitoringData;
  const baselineComplete = hasBaseline && project.riskScores.dataConfidence >= 40;

  if (!baselineComplete) {
    if (!project.inputs.hasLabData) blockingConditions.push("Missing lab validation data");
    if (!project.inputs.hasMonitoringData) blockingConditions.push("Monitoring not established");
    if (project.riskScores.dataConfidence < 40) blockingConditions.push("Data confidence below threshold (< 40%)");
    return {
      currentStage: 2,
      stageName: STAGES[1].name,
      nextStage: STAGES[2].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(2);

  const riskCalculated = project.riskScores.dataConfidence >= 50;
  if (!riskCalculated) {
    if (project.riskScores.dataConfidence < 50) blockingConditions.push("Data confidence below decision threshold (< 50%)");
    if (!project.inputs.isIFCAligned) blockingConditions.push("IFC standards alignment pending");
    return {
      currentStage: 3,
      stageName: STAGES[2].name,
      nextStage: STAGES[3].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(3);

  const decisionMade = project.decision.outcome === "PROCEED" || project.decision.outcome === "CONDITION";
  if (!decisionMade) {
    blockingConditions.push("Risk too high for capital deployment");
    if (project.riskScores.overallRisk > 70) blockingConditions.push("Overall risk exceeds DECLINE threshold (> 70)");
    return {
      currentStage: 4,
      stageName: STAGES[3].name,
      nextStage: STAGES[4].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(4);

  const conditionsDefined = project.decision.outcome === "PROCEED" ||
    (project.decision.outcome === "CONDITION" && project.riskScores.dataConfidence >= 60);
  if (!conditionsDefined) {
    if (project.decision.outcome === "CONDITION") blockingConditions.push("Conditions precedent not yet satisfied");
    if (project.riskScores.dataConfidence < 60) blockingConditions.push("Confidence insufficient for deployment control");
    return {
      currentStage: 5,
      stageName: STAGES[4].name,
      nextStage: STAGES[5].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(5);

  const validationComplete = project.inputs.hasMonitoringData &&
    project.inputs.hasLabData &&
    project.inputs.isIFCAligned &&
    project.riskScores.dataConfidence >= 70;
  if (!validationComplete) {
    if (!project.inputs.hasMonitoringData) blockingConditions.push("Ongoing monitoring not confirmed");
    if (!project.inputs.isIFCAligned) blockingConditions.push("IFC validation pending");
    if (project.riskScores.dataConfidence < 70) blockingConditions.push("Confidence below validation threshold (< 70%)");
    return {
      currentStage: 6,
      stageName: STAGES[5].name,
      nextStage: STAGES[6].name,
      blockingConditions,
      completedStages,
    };
  }
  completedStages.push(6);

  if (project.riskScores.overallRisk > 40) {
    blockingConditions.push("Residual risk requires active reduction");
  }

  completedStages.push(7);
  return {
    currentStage: 7,
    stageName: STAGES[6].name,
    nextStage: null,
    blockingConditions,
    completedStages,
  };
}

export function determineScenarioStageImpact(
  beforeProject: ProjectStageData,
  afterProject: ProjectStageData
): { beforeStage: number; afterStage: number; stagesUnlocked: number } {
  const before = determineStage(beforeProject);
  const after = determineStage(afterProject);
  return {
    beforeStage: before.currentStage,
    afterStage: after.currentStage,
    stagesUnlocked: after.currentStage - before.currentStage,
  };
}
