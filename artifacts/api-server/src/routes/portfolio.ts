import { Router, type IRouter } from "express";
import { db, projectsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/portfolio/summary", async (_req, res) => {
  const projects = await db.select().from(projectsTable);

  if (projects.length === 0) {
    res.json({
      totalCapital: 0,
      avgRisk: 0,
      exposureAtRisk: 0,
      avgConfidence: 0,
      projectCount: 0,
      proceedCount: 0,
      conditionCount: 0,
      declineCount: 0,
      riskDistribution: [],
      capitalByRiskLevel: { low: 0, medium: 0, high: 0 },
      alerts: [],
    });
    return;
  }

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);
  const avgRisk = Math.round((projects.reduce((s, p) => s + p.overallRisk, 0) / projects.length) * 10) / 10;
  const avgConfidence = Math.round((projects.reduce((s, p) => s + p.dataConfidence, 0) / projects.length) * 10) / 10;

  const atRiskProjects = projects.filter(p => p.overallRisk > 40);
  const exposureAtRisk = atRiskProjects.reduce((s, p) => s + p.investmentAmount, 0);

  const proceedCount = projects.filter(p => p.decisionOutcome === "PROCEED").length;
  const conditionCount = projects.filter(p => p.decisionOutcome === "CONDITION").length;
  const declineCount = projects.filter(p => p.decisionOutcome === "DECLINE").length;

  const buckets = ["0-20", "20-40", "40-60", "60-80", "80-100"];
  const riskDistribution = buckets.map(bucket => {
    const [lo, hi] = bucket.split("-").map(Number);
    const count = projects.filter(p => p.overallRisk >= lo && p.overallRisk < hi).length;
    return { bucket, count };
  });
  const lastBucket = riskDistribution[riskDistribution.length - 1];
  lastBucket.count += projects.filter(p => p.overallRisk === 100).length;

  const capitalByRiskLevel = {
    low: Math.round(projects.filter(p => p.overallRisk <= 40).reduce((s, p) => s + p.investmentAmount, 0) * 10) / 10,
    medium: Math.round(projects.filter(p => p.overallRisk > 40 && p.overallRisk <= 70).reduce((s, p) => s + p.investmentAmount, 0) * 10) / 10,
    high: Math.round(projects.filter(p => p.overallRisk > 70).reduce((s, p) => s + p.investmentAmount, 0) * 10) / 10,
  };

  const alertProjects = projects
    .filter(p => p.overallRisk > 55 || p.dataConfidence < 50)
    .sort((a, b) => b.overallRisk - a.overallRisk)
    .slice(0, 5);

  const alerts = alertProjects.map(p => {
    const issues: string[] = [];
    if (p.floodRisk > 6) issues.push("high flood risk");
    if (p.coastalExposure > 6) issues.push("high coastal exposure");
    if (p.contaminationRisk > 5) issues.push("contamination concerns");
    if (p.dataConfidence < 50) issues.push("low validation data");
    if (p.regulatoryComplexity > 6) issues.push("regulatory complexity");

    const actions: string[] = [];
    if (!p.hasMonitoringData) actions.push("require monitoring");
    if (!p.hasLabData) actions.push("require lab validation");
    if (!p.isIFCAligned) actions.push("align with IFC standards");
    if (p.overallRisk > 70) actions.push("reassess investment thesis");

    return {
      projectId: p.id,
      projectName: p.name,
      riskScore: p.overallRisk,
      confidence: p.dataConfidence,
      investmentAmount: p.investmentAmount,
      issue: issues.join(" + ") || "elevated overall risk",
      action: actions.join(", ") || "enhance due diligence",
    };
  });

  res.json({
    totalCapital: Math.round(totalCapital * 10) / 10,
    avgRisk,
    exposureAtRisk: Math.round(exposureAtRisk * 10) / 10,
    avgConfidence,
    projectCount: projects.length,
    proceedCount,
    conditionCount,
    declineCount,
    riskDistribution,
    capitalByRiskLevel,
    alerts,
  });
});

router.get("/portfolio/optimize", async (_req, res) => {
  const projects = await db.select().from(projectsTable);

  if (projects.length === 0) {
    res.json({
      currentPortfolioRisk: 0,
      optimizedPortfolioRisk: 0,
      riskReductionPercent: 0,
      recommendations: [],
    });
    return;
  }

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);
  const weightedRisk = totalCapital > 0
    ? projects.reduce((s, p) => s + (p.overallRisk * p.investmentAmount), 0) / totalCapital
    : 0;

  const recommendations: Array<{
    projectId: number;
    projectName: string;
    action: string;
    detail: string;
    riskImpact: number;
  }> = [];

  const highRiskProjects = projects
    .filter(p => p.overallRisk > 60)
    .sort((a, b) => b.overallRisk * b.investmentAmount - a.overallRisk * a.investmentAmount);

  for (const p of highRiskProjects) {
    if (p.overallRisk > 70) {
      recommendations.push({
        projectId: p.id,
        projectName: p.name,
        action: "reduce_exposure",
        detail: `Reduce exposure to ${p.name} ($${p.investmentAmount}M) — risk score ${p.overallRisk} exceeds threshold`,
        riskImpact: Math.round((p.overallRisk - 50) * (p.investmentAmount / totalCapital) * 100) / 100,
      });
    } else {
      recommendations.push({
        projectId: p.id,
        projectName: p.name,
        action: "require_mitigation",
        detail: `Require mitigation for ${p.name} — add monitoring and lab validation to reduce risk from ${p.overallRisk}`,
        riskImpact: Math.round((p.overallRisk - 40) * 0.3 * (p.investmentAmount / totalCapital) * 100) / 100,
      });
    }
  }

  const lowRiskProjects = projects
    .filter(p => p.overallRisk < 35 && p.dataConfidence > 70)
    .sort((a, b) => a.overallRisk - b.overallRisk);

  for (const p of lowRiskProjects) {
    recommendations.push({
      projectId: p.id,
      projectName: p.name,
      action: "increase_allocation",
      detail: `Increase allocation to ${p.name} ($${p.investmentAmount}M) — strong risk profile (${p.overallRisk}) with high confidence (${p.dataConfidence}%)`,
      riskImpact: Math.round(-(p.investmentAmount / totalCapital) * 5 * 100) / 100,
    });
  }

  const totalRiskReduction = recommendations.reduce((s, r) => s + Math.max(0, r.riskImpact), 0);
  const optimizedRisk = Math.max(0, Math.round((weightedRisk - totalRiskReduction) * 10) / 10);

  res.json({
    currentPortfolioRisk: Math.round(weightedRisk * 10) / 10,
    optimizedPortfolioRisk: optimizedRisk,
    riskReductionPercent: weightedRisk > 0 ? Math.round((totalRiskReduction / weightedRisk) * 1000) / 10 : 0,
    recommendations,
  });
});

export default router;
