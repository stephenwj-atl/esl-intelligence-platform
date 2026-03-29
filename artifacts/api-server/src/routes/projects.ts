import { Router, type IRouter } from "express";
import { CreateProjectBody, GetProjectParams, DeleteProjectParams, RunScenarioParams, RunScenarioBody, GetProjectRiskHistoryParams } from "@workspace/api-zod";
import { db, projectsTable, riskHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { analyzeProject } from "../lib/risk-engine";
import { requireRole } from "../middleware/auth";
import { decryptProjectFields, encryptProjectSensitiveFields } from "../lib/project-encryption";

const router: IRouter = Router();

function formatProject(rawProject: typeof projectsTable.$inferSelect) {
  const p = decryptProjectFields(rawProject);
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    projectType: p.projectType,
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
    },
    riskScores: {
      environmentalRisk: p.environmentalRisk,
      infrastructureRisk: p.infrastructureRisk,
      humanExposureRisk: p.humanExposureRisk,
      regulatoryRisk: p.regulatoryRisk,
      dataConfidence: p.dataConfidence,
      overallRisk: p.overallRisk,
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

  const [project] = await db.insert(projectsTable).values({
    name: input.name,
    country: input.country ?? "Jamaica",
    projectType: input.projectType,
    floodRisk: input.floodRisk,
    coastalExposure: input.coastalExposure,
    contaminationRisk: input.contaminationRisk,
    regulatoryComplexity: input.regulatoryComplexity,
    communitySensitivity: input.communitySensitivity,
    waterStress: input.waterStress,
    hasLabData: input.hasLabData ?? false,
    hasMonitoringData: input.hasMonitoringData ?? false,
    isIFCAligned: input.isIFCAligned ?? false,
    environmentalRisk: analysis.riskScores.environmentalRisk,
    infrastructureRisk: analysis.riskScores.infrastructureRisk,
    humanExposureRisk: analysis.riskScores.humanExposureRisk,
    regulatoryRisk: analysis.riskScores.regulatoryRisk,
    dataConfidence: analysis.riskScores.dataConfidence,
    overallRisk: analysis.riskScores.overallRisk,
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
