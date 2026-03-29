import { Router, type IRouter } from "express";
import {
  CreatePortfolioBody,
  GetPortfolioParams,
  DeletePortfolioParams,
  AddProjectToPortfolioParams,
  AddProjectToPortfolioBody,
  RemoveProjectFromPortfolioParams,
} from "@workspace/api-zod";
import { db, portfoliosTable, portfolioProjectsTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decryptField } from "../lib/encryption";
import { requireRole } from "../middleware/auth";

const router: IRouter = Router();

async function getPortfolioWithProjects(portfolioId: number) {
  const [portfolio] = await db.select().from(portfoliosTable).where(eq(portfoliosTable.id, portfolioId));
  if (!portfolio) return null;

  const entries = await db
    .select({
      id: portfolioProjectsTable.id,
      projectId: portfolioProjectsTable.projectId,
      investmentAmount: portfolioProjectsTable.investmentAmount,
      stage: portfolioProjectsTable.stage,
      projectName: projectsTable.name,
      projectType: projectsTable.projectType,
      country: projectsTable.country,
      riskScore: projectsTable.overallRisk,
      dataConfidence: projectsTable.dataConfidence,
      decision: projectsTable.decisionOutcome,
    })
    .from(portfolioProjectsTable)
    .innerJoin(projectsTable, eq(portfolioProjectsTable.projectId, projectsTable.id))
    .where(eq(portfolioProjectsTable.portfolioId, portfolioId));

  const totalInvestment = entries.reduce((s, e) => s + e.investmentAmount, 0);
  const weightedRisk = totalInvestment > 0
    ? entries.reduce((s, e) => s + e.riskScore * e.investmentAmount, 0) / totalInvestment
    : 0;
  const avgConfidence = entries.length > 0
    ? entries.reduce((s, e) => s + e.dataConfidence, 0) / entries.length
    : 0;

  return {
    id: portfolio.id,
    name: portfolio.name,
    projects: entries.map(e => ({
      id: e.id,
      projectId: e.projectId,
      projectName: e.projectName,
      projectType: e.projectType,
      country: e.country,
      investmentAmount: e.investmentAmount,
      stage: e.stage,
      riskScore: e.riskScore,
      dataConfidence: e.dataConfidence,
      decision: decryptField(e.decision) || e.decision,
    })),
    metrics: {
      totalInvestment: Math.round(totalInvestment * 10) / 10,
      weightedRisk: Math.round(weightedRisk * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      projectCount: entries.length,
    },
    createdAt: portfolio.createdAt.toISOString(),
  };
}

router.get("/portfolios", async (_req, res) => {
  const portfolios = await db.select().from(portfoliosTable).orderBy(portfoliosTable.id);
  const results = [];
  for (const p of portfolios) {
    const full = await getPortfolioWithProjects(p.id);
    if (full) results.push(full);
  }
  res.json(results);
});

router.post("/portfolios", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const parsed = CreatePortfolioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const [portfolio] = await db.insert(portfoliosTable).values({ name: parsed.data.name }).returning();
  const full = await getPortfolioWithProjects(portfolio.id);
  res.status(201).json(full);
});

router.get("/portfolios/:id", async (req, res) => {
  const parsed = GetPortfolioParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid portfolio ID" });
    return;
  }

  const full = await getPortfolioWithProjects(parsed.data.id);
  if (!full) {
    res.status(404).json({ message: "Portfolio not found" });
    return;
  }

  res.json(full);
});

router.delete("/portfolios/:id", requireRole("Admin"), async (req, res) => {
  const parsed = DeletePortfolioParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid portfolio ID" });
    return;
  }

  const [deleted] = await db.delete(portfoliosTable).where(eq(portfoliosTable.id, parsed.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ message: "Portfolio not found" });
    return;
  }

  res.status(204).send();
});

router.post("/portfolios/:id/projects", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const paramsParsed = AddProjectToPortfolioParams.safeParse({ id: req.params.id });
  if (!paramsParsed.success) {
    res.status(400).json({ message: "Invalid portfolio ID" });
    return;
  }

  const bodyParsed = AddProjectToPortfolioBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ message: bodyParsed.error.message });
    return;
  }

  const [portfolio] = await db.select().from(portfoliosTable).where(eq(portfoliosTable.id, paramsParsed.data.id));
  if (!portfolio) {
    res.status(404).json({ message: "Portfolio not found" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, bodyParsed.data.projectId));
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (bodyParsed.data.investmentAmount < 0) {
    res.status(400).json({ message: "Investment amount must be non-negative" });
    return;
  }

  const [existing] = await db
    .select()
    .from(portfolioProjectsTable)
    .where(
      and(
        eq(portfolioProjectsTable.portfolioId, paramsParsed.data.id),
        eq(portfolioProjectsTable.projectId, bodyParsed.data.projectId),
      ),
    );
  if (existing) {
    res.status(409).json({ message: "Project already in portfolio" });
    return;
  }

  await db.insert(portfolioProjectsTable).values({
    portfolioId: paramsParsed.data.id,
    projectId: bodyParsed.data.projectId,
    investmentAmount: bodyParsed.data.investmentAmount,
    stage: bodyParsed.data.stage,
  });

  const full = await getPortfolioWithProjects(paramsParsed.data.id);
  res.status(201).json(full);
});

router.delete("/portfolios/:id/projects/:projectId", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const parsed = RemoveProjectFromPortfolioParams.safeParse({
    id: req.params.id,
    projectId: req.params.projectId,
  });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  const [deleted] = await db
    .delete(portfolioProjectsTable)
    .where(
      and(
        eq(portfolioProjectsTable.portfolioId, parsed.data.id),
        eq(portfolioProjectsTable.projectId, parsed.data.projectId),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ message: "Project not in portfolio" });
    return;
  }

  const full = await getPortfolioWithProjects(parsed.data.id);
  res.json(full);
});

export default router;
