import { Router, type IRouter } from "express";
import { db, projectsTable, portfoliosTable, portfolioProjectsTable, pipelinesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { analyzeProject } from "../lib/risk-engine";
import { calculateCapitalMode, calculateBlendedGrantPercent } from "./financial";
import { requireRole } from "../middleware/auth";
import { decryptProjectFields, encryptProjectSensitiveFields } from "../lib/project-encryption";

const router: IRouter = Router();

const FRAMEWORK_OPTIONS = [
  { id: "ifc-ps", name: "IFC Performance Standards (PS1-PS8)", category: "International" },
  { id: "equator", name: "Equator Principles", category: "International" },
  { id: "gcf", name: "Green Climate Fund Investment Framework", category: "Climate Finance" },
  { id: "paris", name: "Paris Agreement Alignment", category: "Climate Finance" },
  { id: "idb-sustainability", name: "IDB Invest Sustainability Policy", category: "Regional DFI" },
  { id: "cdb-environmental", name: "CDB Environmental & Social Review", category: "Regional DFI" },
  { id: "central-bank-env", name: "Central Bank Environmental Risk Policy", category: "Commercial Banking" },
  { id: "basel-climate", name: "Basel Climate Risk Framework", category: "Commercial Banking" },
  { id: "unfccc-safeguards", name: "UNFCCC Environmental & Social Safeguards", category: "Climate Finance" },
  { id: "caricom-resilience", name: "CARICOM Climate Resilience Standards", category: "Regional" },
];

function checkFrameworkCompliance(project: { overallRisk: number; dataConfidence: number; hasLabData: boolean; hasMonitoringData: boolean; isIFCAligned: boolean; coastalExposure: number; floodRisk: number; contaminationRisk: number; waterStress: number; regulatoryComplexity: number; communitySensitivity: number; environmentalRisk: number; humanExposureRisk: number; regulatoryRisk: number; infrastructureRisk: number; [key: string]: unknown }, frameworks: string[]): { framework: string; status: "PASS" | "FAIL" | "PARTIAL"; gaps: string[] }[] {
  return frameworks.map(fw => {
    const gaps: string[] = [];

    if (fw === "ifc-ps" || fw === "equator") {
      if (!project.isIFCAligned) gaps.push("IFC alignment not established");
      if (project.environmentalRisk > 60) gaps.push("Environmental risk exceeds threshold");
      if (project.humanExposureRisk > 50) gaps.push("Community impact assessment needed");
      if (!project.hasMonitoringData) gaps.push("Monitoring data required");
    }
    if (fw === "gcf" || fw === "paris") {
      if (project.overallRisk > 65) gaps.push("Risk exceeds climate fund threshold");
      if (project.dataConfidence < 60) gaps.push("Insufficient data confidence for climate finance");
      if (!project.hasLabData) gaps.push("Lab validation required for climate fund compliance");
    }
    if (fw === "idb-sustainability" || fw === "cdb-environmental") {
      if (project.regulatoryRisk > 50) gaps.push("Regulatory complexity needs assessment");
      if (project.environmentalRisk > 55) gaps.push("Environmental risk above DFI threshold");
      if (!project.hasMonitoringData) gaps.push("Monitoring infrastructure required");
    }
    if (fw === "central-bank-env" || fw === "basel-climate") {
      if (project.overallRisk > 60) gaps.push("Risk exceeds prudential threshold");
      if (project.coastalExposure > 6) gaps.push("Coastal exposure above bank risk appetite");
      if (project.floodRisk > 6) gaps.push("Flood exposure above bank risk appetite");
    }
    if (fw === "unfccc-safeguards") {
      if (!project.isIFCAligned) gaps.push("IFC alignment required for UNFCCC");
      if (project.humanExposureRisk > 40) gaps.push("Social safeguard assessment needed");
      if (project.contaminationRisk > 5) gaps.push("Contamination remediation plan required");
    }
    if (fw === "caricom-resilience") {
      if (project.floodRisk > 5) gaps.push("Flood resilience plan required");
      if (project.coastalExposure > 5) gaps.push("Coastal adaptation strategy needed");
      if (project.waterStress > 6) gaps.push("Water resource management plan required");
    }

    const status = gaps.length === 0 ? "PASS" : gaps.length <= 2 ? "PARTIAL" : "FAIL";
    const fwInfo = FRAMEWORK_OPTIONS.find(f => f.id === fw);
    return { framework: fwInfo?.name || fw, status, gaps };
  });
}

router.get("/pipelines/frameworks", (_req, res) => {
  res.json(FRAMEWORK_OPTIONS);
});

router.get("/pipelines", async (_req, res) => {
  const pipelines = await db.select().from(pipelinesTable).orderBy(pipelinesTable.createdAt);
  res.json(pipelines);
});

router.post("/pipelines", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const { name, description, orgType, frameworks, thresholds, capitalModeDefault, capitalConstraints } = req.body;

  if (!name) {
    res.status(400).json({ message: "Pipeline name is required" });
    return;
  }

  const [portfolio] = await db.insert(portfoliosTable).values({
    name: `Pipeline: ${name}`,
  }).returning();

  const [pipeline] = await db.insert(pipelinesTable).values({
    name,
    description: description || null,
    orgType: orgType || "DFI",
    frameworks: frameworks || [],
    thresholds: thresholds || {},
    capitalModeDefault: capitalModeDefault || "Blended",
    capitalConstraints: capitalConstraints || {},
    portfolioId: portfolio.id,
  }).returning();

  res.status(201).json(pipeline);
});

router.get("/pipelines/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid pipeline ID" }); return; }

  const [pipeline] = await db.select().from(pipelinesTable).where(eq(pipelinesTable.id, id));
  if (!pipeline) { res.status(404).json({ message: "Pipeline not found" }); return; }

  res.json(pipeline);
});

router.delete("/pipelines/:id", requireRole("Admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid pipeline ID" }); return; }

  const [deleted] = await db.delete(pipelinesTable).where(eq(pipelinesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ message: "Pipeline not found" }); return; }

  res.json({ message: "Pipeline deleted" });
});

router.post("/pipelines/:id/upload", requireRole("Investment Officer", "Admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid pipeline ID" }); return; }

  const [pipeline] = await db.select().from(pipelinesTable).where(eq(pipelinesTable.id, id));
  if (!pipeline) { res.status(404).json({ message: "Pipeline not found" }); return; }

  const { projects: csvProjects } = req.body;
  if (!Array.isArray(csvProjects) || csvProjects.length === 0) {
    res.status(400).json({ message: "No projects provided. Send { projects: [...] }" });
    return;
  }

  const results: any[] = [];
  const errors: { row: number; name: string; error: string }[] = [];

  const clampNum = (v: any, min: number, max: number, fallback: number): number => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };
  const parseBool = (v: any): boolean => v === true || v === "true" || v === "yes" || v === "1";

  for (let i = 0; i < csvProjects.length; i++) {
    const row = csvProjects[i];
    try {
      const name = String(row.name || row.projectName || "").trim() || `Project ${i + 1}`;
      const country = String(row.country || "Jamaica").trim();
      const projectType = String(row.projectType || row.type || row.sector || "Infrastructure").trim();
      const investmentAmount = clampNum(row.investmentAmount || row.amount || row.investment, 0.1, 10000, 10);

      const floodRisk = clampNum(row.floodRisk, 0, 10, 5);
      const coastalExposure = clampNum(row.coastalExposure, 0, 10, 5);
      const contaminationRisk = clampNum(row.contaminationRisk, 0, 10, 5);
      const regulatoryComplexity = clampNum(row.regulatoryComplexity, 0, 10, 5);
      const communitySensitivity = clampNum(row.communitySensitivity, 0, 10, 5);
      const waterStress = clampNum(row.waterStress, 0, 10, 5);
      const hasLabData = parseBool(row.hasLabData);
      const hasMonitoringData = parseBool(row.hasMonitoringData);
      const isIFCAligned = parseBool(row.isIFCAligned);

      const analysis = analyzeProject({
        floodRisk, coastalExposure, contaminationRisk,
        regulatoryComplexity, communitySensitivity, waterStress,
        hasLabData, hasMonitoringData, isIFCAligned,
      });

      const [project] = await db.insert(projectsTable).values({
        name, country, projectType,
        floodRisk, coastalExposure, contaminationRisk,
        regulatoryComplexity, communitySensitivity, waterStress,
        hasLabData, hasMonitoringData, isIFCAligned,
        environmentalRisk: analysis.riskScores.environmentalRisk,
        infrastructureRisk: analysis.riskScores.infrastructureRisk,
        humanExposureRisk: analysis.riskScores.humanExposureRisk,
        regulatoryRisk: analysis.riskScores.regulatoryRisk,
        dataConfidence: analysis.riskScores.dataConfidence,
        overallRisk: analysis.riskScores.overallRisk,
        ...encryptProjectSensitiveFields(analysis, investmentAmount),
      }).returning();

      if (pipeline.portfolioId) {
        await db.insert(portfolioProjectsTable).values({
          portfolioId: pipeline.portfolioId,
          projectId: project.id,
          investmentAmount,
          stage: "Screening",
        });
      }

      results.push({
        id: project.id,
        name: project.name,
        country: project.country,
        projectType: project.projectType,
        investmentAmount,
        overallRisk: project.overallRisk,
        dataConfidence: project.dataConfidence,
        decision: analysis.decision.outcome,
      });
    } catch (err) {
      errors.push({ row: i + 1, name: row.name || `Row ${i + 1}`, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  const totalLinked = pipeline.portfolioId
    ? (await db.select().from(portfolioProjectsTable).where(eq(portfolioProjectsTable.portfolioId, pipeline.portfolioId))).length
    : results.length;

  await db.update(pipelinesTable)
    .set({ projectCount: totalLinked, status: "screened" })
    .where(eq(pipelinesTable.id, id));

  res.status(201).json({
    pipeline: { id: pipeline.id, name: pipeline.name },
    uploaded: results.length,
    totalProjects: totalLinked,
    errors: errors.length,
    errorDetails: errors,
    projects: results,
  });
});

router.get("/pipelines/:id/screening", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid pipeline ID" }); return; }

  const [pipeline] = await db.select().from(pipelinesTable).where(eq(pipelinesTable.id, id));
  if (!pipeline) { res.status(404).json({ message: "Pipeline not found" }); return; }
  if (!pipeline.portfolioId) { res.status(404).json({ message: "No portfolio associated" }); return; }

  const links = await db.select().from(portfolioProjectsTable).where(eq(portfolioProjectsTable.portfolioId, pipeline.portfolioId));
  const projectIds = links.map(l => l.projectId);

  if (projectIds.length === 0) {
    res.json({ pipeline, projects: [], summary: {} });
    return;
  }

  const allProjects = await db.select().from(projectsTable);
  const projects = allProjects.filter(p => projectIds.includes(p.id)).map(decryptProjectFields);

  const thresholds = pipeline.thresholds as any || {};
  const maxRisk = thresholds.maxRisk || 100;
  const minConfidence = thresholds.minConfidence || 0;

  const screenedProjects = projects.map(p => {
    const mode = calculateCapitalMode(p);
    const grantPercent = calculateBlendedGrantPercent(p);
    const loanPercent = 100 - grantPercent;

    const passesRisk = p.overallRisk <= maxRisk;
    const passesConfidence = p.dataConfidence >= minConfidence;
    const passesThresholds = passesRisk && passesConfidence;

    const frameworkCompliance = checkFrameworkCompliance(p, (pipeline.frameworks as string[]) || []);
    const frameworkPass = frameworkCompliance.every(f => f.status !== "FAIL");
    const frameworkGaps = frameworkCompliance.filter(f => f.status !== "PASS").length;

    let screeningResult: "ELIGIBLE" | "CONDITIONAL" | "INELIGIBLE" = "ELIGIBLE";
    if (!passesThresholds || !frameworkPass) screeningResult = "INELIGIBLE";
    else if (frameworkCompliance.some(f => f.status === "PARTIAL") || p.decisionOutcome === "CONDITION") screeningResult = "CONDITIONAL";

    return {
      id: p.id,
      name: p.name,
      country: p.country,
      projectType: p.projectType,
      investmentAmount: p.investmentAmount,
      overallRisk: p.overallRisk,
      dataConfidence: p.dataConfidence,
      environmentalRisk: p.environmentalRisk,
      infrastructureRisk: p.infrastructureRisk,
      humanExposureRisk: p.humanExposureRisk,
      regulatoryRisk: p.regulatoryRisk,
      decision: p.decisionOutcome,
      recommendedMode: mode,
      blendedSplit: { grantPercent, loanPercent, grantAmount: Math.round(p.investmentAmount * grantPercent / 100 * 10) / 10, loanAmount: Math.round(p.investmentAmount * loanPercent / 100 * 10) / 10 },
      frameworkCompliance,
      frameworkGaps,
      passesThresholds,
      screeningResult,
    };
  });

  screenedProjects.sort((a, b) => {
    const order = { ELIGIBLE: 0, CONDITIONAL: 1, INELIGIBLE: 2 };
    if (order[a.screeningResult] !== order[b.screeningResult]) return order[a.screeningResult] - order[b.screeningResult];
    return a.overallRisk - b.overallRisk;
  });

  const eligible = screenedProjects.filter(p => p.screeningResult === "ELIGIBLE");
  const conditional = screenedProjects.filter(p => p.screeningResult === "CONDITIONAL");
  const ineligible = screenedProjects.filter(p => p.screeningResult === "INELIGIBLE");

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);
  const eligibleCapital = eligible.reduce((s, p) => s + p.investmentAmount, 0);
  const conditionalCapital = conditional.reduce((s, p) => s + p.investmentAmount, 0);

  const totalGrantComponent = screenedProjects.reduce((s, p) => s + p.blendedSplit.grantAmount, 0);
  const totalLoanComponent = screenedProjects.reduce((s, p) => s + p.blendedSplit.loanAmount, 0);
  const avgGrantPercent = screenedProjects.length > 0 ? Math.round(screenedProjects.reduce((s, p) => s + p.blendedSplit.grantPercent, 0) / screenedProjects.length) : 0;

  res.json({
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      orgType: pipeline.orgType,
      frameworks: pipeline.frameworks,
      thresholds: pipeline.thresholds,
      capitalModeDefault: pipeline.capitalModeDefault,
      capitalConstraints: pipeline.capitalConstraints,
    },
    summary: {
      total: projects.length,
      eligible: eligible.length,
      conditional: conditional.length,
      ineligible: ineligible.length,
      totalCapital: Math.round(totalCapital * 10) / 10,
      eligibleCapital: Math.round(eligibleCapital * 10) / 10,
      conditionalCapital: Math.round(conditionalCapital * 10) / 10,
      avgRisk: Math.round(projects.reduce((s, p) => s + p.overallRisk, 0) / projects.length * 10) / 10,
      avgConfidence: Math.round(projects.reduce((s, p) => s + p.dataConfidence, 0) / projects.length * 10) / 10,
      capitalAllocation: {
        totalGrantComponent: Math.round(totalGrantComponent * 10) / 10,
        totalLoanComponent: Math.round(totalLoanComponent * 10) / 10,
        avgGrantPercent,
      },
    },
    projects: screenedProjects,
  });
});

export default router;
