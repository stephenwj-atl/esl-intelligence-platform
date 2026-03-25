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

router.get("/portfolio/intelligence", async (_req, res) => {
  const projects = await db.select().from(projectsTable);

  if (projects.length === 0) {
    res.json({ patterns: [], insights: [] });
    return;
  }

  const patterns: Array<{
    category: string;
    finding: string;
    affectedProjects: string[];
    riskImpact: string;
  }> = [];

  const byCountry = new Map<string, typeof projects>();
  for (const p of projects) {
    const list = byCountry.get(p.country) || [];
    list.push(p);
    byCountry.set(p.country, list);
  }

  for (const [country, countryProjects] of byCountry) {
    if (countryProjects.length >= 2) {
      const avgRisk = countryProjects.reduce((s, p) => s + p.overallRisk, 0) / countryProjects.length;
      if (avgRisk > 50) {
        patterns.push({
          category: "Geographic Concentration",
          finding: `${countryProjects.length} projects in ${country} with average risk of ${Math.round(avgRisk)}. Geographic concentration amplifies systemic risk.`,
          affectedProjects: countryProjects.map(p => p.name),
          riskImpact: avgRisk > 60 ? "high" : "medium",
        });
      }
    }
  }

  const byType = new Map<string, typeof projects>();
  for (const p of projects) {
    const list = byType.get(p.projectType) || [];
    list.push(p);
    byType.set(p.projectType, list);
  }

  for (const [type, typeProjects] of byType) {
    if (typeProjects.length >= 2) {
      const avgRisk = typeProjects.reduce((s, p) => s + p.overallRisk, 0) / typeProjects.length;
      const highCoastal = typeProjects.filter(p => p.coastalExposure > 5);
      if (highCoastal.length >= 2) {
        patterns.push({
          category: "Sector Risk Pattern",
          finding: `${type} projects in coastal zones show ${Math.round(((avgRisk - 30) / 30) * 100)}% higher risk than baseline. ${highCoastal.length} of ${typeProjects.length} ${type} projects have elevated coastal exposure.`,
          affectedProjects: highCoastal.map(p => p.name),
          riskImpact: avgRisk > 55 ? "high" : "medium",
        });
      }
    }
  }

  const noMonitoring = projects.filter(p => !p.hasMonitoringData);
  if (noMonitoring.length >= 2) {
    const avgRiskNoMon = noMonitoring.reduce((s, p) => s + p.overallRisk, 0) / noMonitoring.length;
    const withMonitoring = projects.filter(p => p.hasMonitoringData);
    const avgRiskWithMon = withMonitoring.length > 0
      ? withMonitoring.reduce((s, p) => s + p.overallRisk, 0) / withMonitoring.length
      : 0;
    patterns.push({
      category: "Data Quality Gap",
      finding: `Projects without monitoring data show average risk of ${Math.round(avgRiskNoMon)} vs ${Math.round(avgRiskWithMon)} for monitored projects. ${noMonitoring.length} projects lack monitoring.`,
      affectedProjects: noMonitoring.map(p => p.name),
      riskImpact: "high",
    });
  }

  const noLab = projects.filter(p => !p.hasLabData);
  if (noLab.length >= 2) {
    patterns.push({
      category: "Validation Deficit",
      finding: `${noLab.length} of ${projects.length} projects lack independent laboratory validation. This undermines data confidence across ${Math.round(noLab.length / projects.length * 100)}% of the portfolio.`,
      affectedProjects: noLab.map(p => p.name),
      riskImpact: "medium",
    });
  }

  const highFlood = projects.filter(p => p.floodRisk > 5 && p.coastalExposure > 5);
  if (highFlood.length >= 2) {
    patterns.push({
      category: "Climate Vulnerability",
      finding: `${highFlood.length} projects face compounding flood and coastal risk. Combined exposure creates systemic vulnerability to climate events.`,
      affectedProjects: highFlood.map(p => p.name),
      riskImpact: "high",
    });
  }

  const insights: string[] = [];

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskCapital = projects.filter(p => p.overallRisk > 70).reduce((s, p) => s + p.investmentAmount, 0);
  if (highRiskCapital > 0) {
    insights.push(`$${Math.round(highRiskCapital)}M (${Math.round(highRiskCapital / totalCapital * 100)}%) of capital is allocated to high-risk projects exceeding decline thresholds.`);
  }

  const lowConfProjects = projects.filter(p => p.dataConfidence < 60);
  if (lowConfProjects.length > 0) {
    insights.push(`${lowConfProjects.length} projects have data confidence below 60%, adding uncertainty penalties to risk calculations.`);
  }

  const solarCoastal = projects.filter(p => p.projectType === "Solar" && p.coastalExposure > 5);
  if (solarCoastal.length > 0) {
    insights.push(`Solar projects in coastal zones show ${Math.round(solarCoastal.reduce((s, p) => s + p.overallRisk, 0) / solarCoastal.length)}% average risk — consider inland alternatives.`);
  }

  const noIFC = projects.filter(p => !p.isIFCAligned);
  if (noIFC.length > projects.length * 0.5) {
    insights.push(`${Math.round(noIFC.length / projects.length * 100)}% of portfolio not aligned with IFC Performance Standards — limits international financing options.`);
  }

  res.json({ patterns, insights });
});

router.get("/portfolio/confidence", async (_req, res) => {
  const projects = await db.select().from(projectsTable);

  if (projects.length === 0) {
    res.json({
      overallScore: 0,
      labValidationPercent: 0,
      monitoringPercent: 0,
      ifcAlignedPercent: 0,
      projectsWithLowConfidence: 0,
      insight: "No projects in portfolio.",
    });
    return;
  }

  const labCount = projects.filter(p => p.hasLabData).length;
  const monCount = projects.filter(p => p.hasMonitoringData).length;
  const ifcCount = projects.filter(p => p.isIFCAligned).length;
  const lowConfCount = projects.filter(p => p.dataConfidence < 60).length;

  const labPct = Math.round(labCount / projects.length * 100);
  const monPct = Math.round(monCount / projects.length * 100);
  const ifcPct = Math.round(ifcCount / projects.length * 100);

  const overallScore = Math.round(projects.reduce((s, p) => s + p.dataConfidence, 0) / projects.length * 10) / 10;

  const insightParts: string[] = [];
  if (overallScore < 60) {
    insightParts.push(`Portfolio confidence is LOW at ${overallScore}%.`);
  } else if (overallScore < 75) {
    insightParts.push(`Portfolio confidence is MODERATE at ${overallScore}%.`);
  } else {
    insightParts.push(`Portfolio confidence is STRONG at ${overallScore}%.`);
  }

  if (lowConfCount > 0) {
    insightParts.push(`Risk is elevated due to low data confidence across ${Math.round(lowConfCount / projects.length * 100)}% of assets.`);
  }
  if (monPct < 60) {
    insightParts.push(`Only ${monPct}% of projects have monitoring data — a critical gap for ongoing risk assessment.`);
  }
  if (ifcPct < 50) {
    insightParts.push(`Only ${ifcPct}% of projects are IFC-aligned — limiting access to international development financing.`);
  }

  res.json({
    overallScore,
    labValidationPercent: labPct,
    monitoringPercent: monPct,
    ifcAlignedPercent: ifcPct,
    projectsWithLowConfidence: lowConfCount,
    insight: insightParts.join(" "),
  });
});

router.get("/portfolio/decision", async (_req, res) => {
  const projects = await db.select().from(projectsTable);

  if (projects.length === 0) {
    res.json({
      outcome: "PROCEED_WITH_PORTFOLIO",
      weightedRisk: 0,
      confidenceIndex: 0,
      highRiskCapitalPercent: 0,
      conditions: [],
      insight: "No projects in portfolio.",
    });
    return;
  }

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);
  const weightedRisk = totalCapital > 0
    ? projects.reduce((s, p) => s + p.overallRisk * p.investmentAmount, 0) / totalCapital
    : 0;
  const confidenceIndex = projects.reduce((s, p) => s + p.dataConfidence, 0) / projects.length;
  const highRiskCapital = projects.filter(p => p.overallRisk > 70).reduce((s, p) => s + p.investmentAmount, 0);
  const highRiskCapitalPercent = totalCapital > 0 ? Math.round(highRiskCapital / totalCapital * 100) : 0;

  let outcome: string;
  const conditions: string[] = [];

  if (weightedRisk > 65 || highRiskCapitalPercent > 40) {
    outcome = "REDUCE_EXPOSURE";
    conditions.push("Immediate reduction of high-risk asset exposure required");
    conditions.push("Capital reallocation to lower-risk assets recommended");
    if (highRiskCapitalPercent > 40) {
      conditions.push(`${highRiskCapitalPercent}% of capital in high-risk tier exceeds 25% threshold`);
    }
  } else if (weightedRisk > 55 || highRiskCapitalPercent > 25) {
    outcome = "REBALANCE_PORTFOLIO";
    conditions.push("Portfolio rebalancing recommended to reduce concentration risk");
    if (confidenceIndex < 60) {
      conditions.push("Data confidence improvement needed across portfolio");
    }
    conditions.push("Quarterly risk reassessment required");
  } else if (weightedRisk > 40 || confidenceIndex < 60) {
    outcome = "PROCEED_WITH_CONDITIONS";
    if (confidenceIndex < 60) {
      conditions.push("Enhance data confidence through monitoring and lab validation");
    }
    conditions.push("Semi-annual portfolio risk review required");
    const declineProjects = projects.filter(p => p.decisionOutcome === "DECLINE");
    if (declineProjects.length > 0) {
      conditions.push(`Address ${declineProjects.length} project(s) with DECLINE signals`);
    }
  } else {
    outcome = "PROCEED_WITH_PORTFOLIO";
  }

  const insightParts: string[] = [];
  insightParts.push(`Portfolio weighted risk: ${Math.round(weightedRisk * 10) / 10}/100.`);
  insightParts.push(`Data confidence index: ${Math.round(confidenceIndex * 10) / 10}%.`);
  if (highRiskCapitalPercent > 0) {
    insightParts.push(`${highRiskCapitalPercent}% of capital ($${Math.round(highRiskCapital)}M) in high-risk tier.`);
  }
  const proceedCount = projects.filter(p => p.decisionOutcome === "PROCEED").length;
  insightParts.push(`${proceedCount} of ${projects.length} projects carry PROCEED signals.`);

  res.json({
    outcome,
    weightedRisk: Math.round(weightedRisk * 10) / 10,
    confidenceIndex: Math.round(confidenceIndex * 10) / 10,
    highRiskCapitalPercent,
    conditions,
    insight: insightParts.join(" "),
  });
});

export default router;
