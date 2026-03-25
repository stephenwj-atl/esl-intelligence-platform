import { Router, type IRouter } from "express";
import { CreateProjectBody, GetProjectParams, DeleteProjectParams } from "@workspace/api-zod";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { analyzeProject } from "../lib/risk-engine";

const router: IRouter = Router();

function formatProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    projectType: p.projectType,
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

router.post("/projects", async (req, res) => {
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
    delayRiskPercent: analysis.financialRisk.delayRiskPercent,
    costOverrunPercent: analysis.financialRisk.costOverrunPercent,
    covenantBreachPercent: analysis.financialRisk.covenantBreachPercent,
    reputationalRisk: analysis.financialRisk.reputationalRisk,
    decisionOutcome: analysis.decision.outcome,
    decisionConditions: analysis.decision.conditions,
    decisionInsight: analysis.decision.insight,
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

router.delete("/projects/:id", async (req, res) => {
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

export default router;
