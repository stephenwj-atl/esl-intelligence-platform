import { Router, type IRouter } from "express";
import { CreateProjectBody, GetProjectParams, DeleteProjectParams, RunScenarioParams, RunScenarioBody, GetProjectRiskHistoryParams } from "@workspace/api-zod";
import { db, projectsTable, riskHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { analyzeProject } from "../lib/risk-engine";
import { requireRole } from "../middleware/auth";
import { decryptProjectFields, encryptProjectSensitiveFields } from "../lib/project-encryption";
import {
  calculatePERS,
  buildInterventionRiskProfile,
  determineMonitoringIntensity,
  recommendCapitalMode,
  inferCategory,
  inferInterventionType,
  getLenderFrameworkGuidance,
  type ProjectCategory,
  type InterventionType,
  type LenderFramework,
} from "../lib/pers-engine";

const router: IRouter = Router();

function formatProject(rawProject: typeof projectsTable.$inferSelect) {
  const p = decryptProjectFields(rawProject);
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    projectType: p.projectType,
    projectCategory: p.projectCategory,
    interventionType: p.interventionType,
    capitalMode: p.capitalMode,
    lenderFramework: p.lenderFramework,
    latitude: p.latitude,
    longitude: p.longitude,
    investmentAmount: p.investmentAmount,
    inputs: {
      floodRisk: p.floodRisk,
      coastalExposure: p.coastalExposure,
      contaminationRisk: p.contaminationRisk,
      regulatoryComplexity: p.regulatoryComplexity,
      communitySensitivity: p.communitySensitivity,
      waterStress: p.waterStress,
      hasLabData: p.hasLabData,
      hasMonitoringData: p.hasMonitoringData,
      isIFCAligned: p.isIFCAligned,
      hasSEA: p.hasSEA,
      hasESIA: p.hasESIA,
    },
    riskScores: {
      environmentalRisk: p.environmentalRisk,
      infrastructureRisk: p.infrastructureRisk,
      humanExposureRisk: p.humanExposureRisk,
      regulatoryRisk: p.regulatoryRisk,
      dataConfidence: p.dataConfidence,
      overallRisk: p.overallRisk,
    },
    pers: {
      persScore: p.persScore,
      interventionRiskScore: p.interventionRiskScore,
      monitoringIntensity: p.monitoringIntensity,
      breakdown: p.persBreakdown,
      interventionRiskProfile: p.interventionRiskProfile,
    },
    financialRisk: {
      delayRiskPercent: p.delayRiskPercent,
      costOverrunPercent: p.costOverrunPercent,
      covenantBreachPercent: p.covenantBreachPercent,
      reputationalRisk: p.reputationalRisk,
    },
    decision: {
      outcome: p.decisionOutcome,
      conditions: p.decisionConditions ?? [],
      insight: p.decisionInsight,
    },
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/projects", async (_req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.id);
  res.json(projects.map(formatProject));
});

router.post("/projects", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }
  const input = parsed.data;

  const hasSEA = input.hasSEA ?? false;
  const hasESIA = input.hasESIA ?? false;

  const analysis = analyzeProject({
    floodRisk: input.floodRisk,
    coastalExposure: input.coastalExposure,
    contaminationRisk: input.contaminationRisk,
    regulatoryComplexity: input.regulatoryComplexity,
    communitySensitivity: input.communitySensitivity,
    waterStress: input.waterStress,
    hasLabData: input.hasLabData ?? false,
    hasMonitoringData: input.hasMonitoringData ?? false,
    isIFCAligned: input.isIFCAligned ?? false,
  });

  const category = (input.projectCategory as ProjectCategory) ?? inferCategory(input.projectType);
  const intervention = (input.interventionType as InterventionType) ?? inferInterventionType(category);

  const persBreakdown = calculatePERS(
    analysis.riskScores,
    intervention,
    input.projectType,
    hasSEA,
    hasESIA,
  );

  const interventionProfile = buildInterventionRiskProfile(intervention, analysis.riskScores);
  const capitalMode = recommendCapitalMode(persBreakdown.persScore, analysis.riskScores.dataConfidence, intervention);
  const monitoring = determineMonitoringIntensity(persBreakdown.persScore, analysis.riskScores.dataConfidence, intervention, capitalMode);

  const [project] = await db.insert(projectsTable).values({
    name: input.name,
    country: input.country ?? "Jamaica",
    projectType: input.projectType,
    projectCategory: category,
    interventionType: intervention,
    capitalMode,
    lenderFramework: input.lenderFramework ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    floodRisk: input.floodRisk,
    coastalExposure: input.coastalExposure,
    contaminationRisk: input.contaminationRisk,
    regulatoryComplexity: input.regulatoryComplexity,
    communitySensitivity: input.communitySensitivity,
    waterStress: input.waterStress,
    hasLabData: input.hasLabData ?? false,
    hasMonitoringData: input.hasMonitoringData ?? false,
    isIFCAligned: input.isIFCAligned ?? false,
    hasSEA,
    hasESIA,
    environmentalRisk: analysis.riskScores.environmentalRisk,
    infrastructureRisk: analysis.riskScores.infrastructureRisk,
    humanExposureRisk: analysis.riskScores.humanExposureRisk,
    regulatoryRisk: analysis.riskScores.regulatoryRisk,
    dataConfidence: analysis.riskScores.dataConfidence,
    overallRisk: analysis.riskScores.overallRisk,
    persScore: persBreakdown.persScore,
    interventionRiskScore: interventionProfile.adjustedRisk,
    monitoringIntensity: monitoring.level,
    persBreakdown,
    interventionRiskProfile: interventionProfile,
    ...encryptProjectSensitiveFields(analysis, input.investmentAmount),
  }).returning();

  res.status(201).json(formatProject(project));
});

router.get("/projects/:id", async (req, res) => {
  const parsed = GetProjectParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.json(formatProject(project));
});

router.get("/projects/:id/pers-assessment", async (req, res) => {
  const parsed = GetProjectParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const p = decryptProjectFields(project);
  const category = (p.projectCategory as ProjectCategory) ?? inferCategory(p.projectType);
  const intervention = (p.interventionType as InterventionType) ?? inferInterventionType(category);

  const riskScores = {
    environmentalRisk: p.environmentalRisk,
    infrastructureRisk: p.infrastructureRisk,
    humanExposureRisk: p.humanExposureRisk,
    regulatoryRisk: p.regulatoryRisk,
    dataConfidence: p.dataConfidence,
    overallRisk: p.overallRisk,
  };

  const persBreakdown = calculatePERS(riskScores, intervention, p.projectType, p.hasSEA, p.hasESIA);
  const interventionProfile = buildInterventionRiskProfile(intervention, riskScores);
  const capitalMode = p.capitalMode ?? recommendCapitalMode(persBreakdown.persScore, p.dataConfidence, intervention);
  const monitoring = determineMonitoringIntensity(persBreakdown.persScore, p.dataConfidence, intervention, capitalMode);

  const lenderGuidance = p.lenderFramework
    ? getLenderFrameworkGuidance(p.lenderFramework as LenderFramework)
    : null;

  res.json({
    projectId: p.id,
    projectName: p.name,
    country: p.country,
    projectType: p.projectType,
    projectCategory: category,
    interventionType: intervention,
    persBreakdown,
    interventionRiskProfile: interventionProfile,
    capitalMode,
    monitoringIntensity: monitoring,
    lenderFramework: lenderGuidance,
    decision: {
      outcome: p.decisionOutcome,
      persScore: persBreakdown.persScore,
      capitalRecommendation: capitalMode,
      monitoringLevel: monitoring.level,
    },
  });
});

router.get("/methodology/pers", (_req, res) => {
  res.json({
    name: "Project Environmental Risk Score (PERS)",
    version: "1.0.0",
    formula: "(CERI × 0.50) + (ProjectOverlay × 0.25) + (Sensitivity × 0.15) + (InterventionRisk × 0.10)",
    components: {
      ceri: {
        weight: 0.50,
        description: "Country Environmental Risk Index — composite of environmental, infrastructure, human exposure, and regulatory risk scores",
        subWeights: { environmental: 0.30, infrastructure: 0.25, humanExposure: 0.20, regulatory: 0.25 },
      },
      projectOverlay: {
        weight: 0.25,
        description: "Sector-specific complexity overlay. Reduced by 0.85× if SEA framework exists, 0.90× if ESIA completed.",
        seaMitigationFactor: 0.85,
        esiaMitigationFactor: 0.90,
        note: "SEA/ESIA are primary investment guidance tools; EIA is permitting compliance only",
      },
      sensitivity: {
        weight: 0.15,
        description: "Human exposure, governance quality (CPI), and disaster loss history",
        subWeights: { humanExposure: 0.40, regulatory: 0.25, governance: 0.20, disasterHistory: 0.15 },
      },
      interventionRisk: {
        weight: 0.10,
        description: "Delivery risk specific to intervention modality",
        profiles: ["Physical Infrastructure", "Social/Programmatic", "Environmental", "Governance", "Disaster"],
      },
    },
    decisionThresholds: {
      PROCEED: "PERS < 40",
      CONDITION: "PERS 40–70",
      DECLINE: "PERS > 70",
    },
    capitalModes: {
      Loan: "Low risk (PERS < 45), high confidence (>60%)",
      Blended: "Moderate risk (PERS 45–70) or moderate confidence gaps",
      Grant: "High risk (PERS > 70), low confidence (<50%)",
    },
    monitoringIntensity: {
      STANDARD: "PERS < 40, confidence ≥ 60%, Loan mode",
      ENHANCED: "PERS 40–65, or confidence 40–60%, or Blended mode",
      INTENSIVE: "PERS > 65, or confidence < 40%, or Grant mode",
    },
    lenderFrameworks: ["IDB ESPF", "CDB ESRP", "World Bank ESF", "GCF", "EIB", "Equator Principles"],
    projectCategories: [
      "Hard Infrastructure", "Soft Infrastructure", "Climate & Environment",
      "Agriculture & Food Security", "Governance & Institutional", "Disaster Response & Recovery",
    ],
  });
});

router.delete("/projects/:id", requireRole("Admin"), async (req, res) => {
  const parsed = DeleteProjectParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const [deleted] = await db.delete(projectsTable).where(eq(projectsTable.id, parsed.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.status(204).send();
});

router.post("/projects/:id/scenario", async (req, res) => {
  const paramsParsed = RunScenarioParams.safeParse({ id: req.params.id });
  if (!paramsParsed.success) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const bodyParsed = RunScenarioBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ message: bodyParsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, paramsParsed.data.id));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const beforeInputs = {
    floodRisk: project.floodRisk,
    coastalExposure: project.coastalExposure,
    contaminationRisk: project.contaminationRisk,
    regulatoryComplexity: project.regulatoryComplexity,
    communitySensitivity: project.communitySensitivity,
    waterStress: project.waterStress,
    hasLabData: project.hasLabData,
    hasMonitoringData: project.hasMonitoringData,
    isIFCAligned: project.isIFCAligned,
  };
  const before = analyzeProject(beforeInputs);

  const scenarioData = bodyParsed.data;
  const afterInputs = {
    floodRisk: scenarioData.floodRisk ?? project.floodRisk,
    coastalExposure: scenarioData.coastalExposure ?? project.coastalExposure,
    contaminationRisk: scenarioData.contaminationRisk ?? project.contaminationRisk,
    regulatoryComplexity: scenarioData.regulatoryComplexity ?? project.regulatoryComplexity,
    communitySensitivity: scenarioData.communitySensitivity ?? project.communitySensitivity,
    waterStress: scenarioData.waterStress ?? project.waterStress,
    hasLabData: scenarioData.hasLabData ?? project.hasLabData,
    hasMonitoringData: scenarioData.hasMonitoringData ?? project.hasMonitoringData,
    isIFCAligned: scenarioData.isIFCAligned ?? project.isIFCAligned,
  };
  const after = analyzeProject(afterInputs);

  res.json({ before, after });
});

router.get("/projects/:id/risk-history", async (req, res) => {
  const parsed = GetProjectRiskHistoryParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const history = await db
    .select({
      month: riskHistoryTable.month,
      overallRisk: riskHistoryTable.overallRisk,
      dataConfidence: riskHistoryTable.dataConfidence,
    })
    .from(riskHistoryTable)
    .where(eq(riskHistoryTable.projectId, parsed.data.id))
    .orderBy(asc(riskHistoryTable.month));

  res.json(history);
});

export default router;
