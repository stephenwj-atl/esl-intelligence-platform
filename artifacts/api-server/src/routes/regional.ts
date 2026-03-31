import { Router, type IRouter } from "express";
import { db, regionalDataTable, regionalIndicesTable, sectorBenchmarksTable, projectsTable, dataSourceFreshnessTable, ingestionRunsTable, rawDataCacheTable } from "@workspace/db";
import { eq, desc, avg, count, sql, gt, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/regional/data", async (req, res) => {
  const { country, type } = req.query;
  let query = db.select().from(regionalDataTable);

  if (country && typeof country === "string") {
    query = query.where(eq(regionalDataTable.country, country)) as any;
  }

  const data = await query;
  const filtered = type && typeof type === "string"
    ? data.filter(d => d.datasetType === type)
    : data;

  res.json(filtered);
});

router.get("/regional/indices", async (_req, res) => {
  const indices = await db.select().from(regionalIndicesTable).orderBy(regionalIndicesTable.country, regionalIndicesTable.year);

  const byCountry: Record<string, any> = {};
  for (const row of indices) {
    if (!byCountry[row.country]) {
      byCountry[row.country] = { country: row.country, current: null, trend: [] };
    }
    byCountry[row.country].trend.push({
      year: row.year,
      riskScore: row.riskScore,
      infrastructureScore: row.infrastructureScore,
      waterStressScore: row.waterStressScore,
      confidence: row.confidence,
    });
  }

  for (const c of Object.values(byCountry)) {
    const latest = c.trend[c.trend.length - 1];
    c.current = latest;
  }

  const ceriValues = Object.values(byCountry).map((c: any) => c.current.riskScore);
  const ceriAvg = ceriValues.length > 0 ? Math.round((ceriValues.reduce((a: number, b: number) => a + b, 0) / ceriValues.length) * 10) / 10 : 0;
  const confValues = Object.values(byCountry).map((c: any) => c.current.confidence);
  const avgConfidence = confValues.length > 0 ? Math.round((confValues.reduce((a: number, b: number) => a + b, 0) / confValues.length) * 10) / 10 : 0;

  res.json({
    ceri: ceriAvg,
    avgConfidence,
    countriesCount: Object.keys(byCountry).length,
    countries: Object.values(byCountry),
  });
});

router.get("/regional/indices/:country", async (req, res) => {
  const { country } = req.params;
  const indices = await db.select().from(regionalIndicesTable)
    .where(eq(regionalIndicesTable.country, country))
    .orderBy(regionalIndicesTable.year);

  if (indices.length === 0) {
    res.status(404).json({ message: "Country not found" });
    return;
  }

  const current = indices[indices.length - 1];
  res.json({ country, current, trend: indices });
});

router.get("/regional/benchmarks/sector", async (_req, res) => {
  const data = await db.select().from(sectorBenchmarksTable).orderBy(sectorBenchmarksTable.sector, sectorBenchmarksTable.year);

  const bySector: Record<string, any> = {};
  for (const row of data) {
    const key = `${row.sector}-${row.metric}`;
    if (!bySector[key]) {
      bySector[key] = { sector: row.sector, metric: row.metric, current: null, trend: [] };
    }
    bySector[key].trend.push({
      year: row.year,
      avgRisk: row.avgRisk,
      avgConfidence: row.avgConfidence,
      sampleSize: row.sampleSize,
    });
  }

  for (const s of Object.values(bySector)) {
    s.current = s.trend[s.trend.length - 1];
  }

  res.json(Object.values(bySector));
});

router.get("/regional/benchmarks/project/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const countryIndices = await db.select().from(regionalIndicesTable)
    .where(eq(regionalIndicesTable.country, project.country))
    .orderBy(desc(regionalIndicesTable.year));
  const latestIndex = countryIndices[0] || null;

  const sectorBenchmarks = await db.select().from(sectorBenchmarksTable)
    .where(eq(sectorBenchmarksTable.sector, project.projectType))
    .orderBy(desc(sectorBenchmarksTable.year));

  const sectorOverall = sectorBenchmarks.find(s => s.metric === "Overall Risk");

  const allProjects = await db.select().from(projectsTable);
  const sameCountryProjects = allProjects.filter(p => p.country === project.country);
  const sameSectorProjects = allProjects.filter(p => p.projectType === project.projectType);
  const allRisks = allProjects.map(p => p.overallRisk).sort((a, b) => a - b);
  const projectRisk = project.overallRisk;
  const percentile = Math.round((allRisks.filter(r => r <= projectRisk).length / allRisks.length) * 100);

  const regionalAvg = latestIndex ? latestIndex.riskScore : null;
  const sectorAvg = sectorOverall ? sectorOverall.avgRisk : null;
  const regionDiff = regionalAvg ? Math.round(((projectRisk - regionalAvg) / regionalAvg) * 100) : null;
  const sectorDiff = sectorAvg ? Math.round(((projectRisk - sectorAvg) / sectorAvg) * 100) : null;

  const regionalData = await db.select().from(regionalDataTable)
    .where(eq(regionalDataTable.country, project.country));

  const datasetAvgs: Record<string, number> = {};
  const grouped: Record<string, number[]> = {};
  for (const d of regionalData) {
    if (!grouped[d.datasetType]) grouped[d.datasetType] = [];
    grouped[d.datasetType].push(d.value);
  }
  for (const [k, vals] of Object.entries(grouped)) {
    datasetAvgs[k] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  res.json({
    project: { id: project.id, name: project.name, country: project.country, sector: project.projectType, risk: projectRisk },
    regional: {
      country: project.country,
      avgRisk: regionalAvg,
      diff: regionDiff,
      diffLabel: regionDiff !== null ? (regionDiff > 0 ? `${regionDiff}% above regional baseline` : `${Math.abs(regionDiff)}% below regional baseline`) : null,
      datasetAverages: datasetAvgs,
    },
    sector: {
      name: project.projectType,
      avgRisk: sectorAvg,
      diff: sectorDiff,
      diffLabel: sectorDiff !== null ? (sectorDiff > 0 ? `${sectorDiff}% above sector average` : `${Math.abs(sectorDiff)}% below sector average`) : null,
      sampleSize: sectorOverall?.sampleSize || 0,
    },
    percentile,
    percentileLabel: `Top ${100 - percentile}% highest-risk assets`,
    countryProjectCount: sameCountryProjects.length,
    sectorProjectCount: sameSectorProjects.length,
  });
});

router.get("/regional/benchmarks/portfolio", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  if (allProjects.length === 0) { res.json({ portfolioAvg: 0, regionalAvg: 0, diff: 0 }); return; }

  const portfolioRisks = allProjects.map(p => p.overallRisk);
  const portfolioAvg = Math.round((portfolioRisks.reduce((a, b) => a + b, 0) / portfolioRisks.length) * 10) / 10;

  const latestIndices = await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, 2025));
  const regionalRisks = latestIndices.map(i => i.riskScore);
  const regionalAvg = regionalRisks.length > 0 ? Math.round((regionalRisks.reduce((a, b) => a + b, 0) / regionalRisks.length) * 10) / 10 : 0;

  const diff = regionalAvg ? Math.round(((portfolioAvg - regionalAvg) / regionalAvg) * 100) : 0;

  res.json({
    portfolioAvg,
    regionalAvg,
    diff,
    diffLabel: diff > 0 ? `Portfolio ${diff}% above regional baseline` : `Portfolio ${Math.abs(diff)}% below regional baseline`,
    portfolioProjects: allProjects.length,
    countriesBenchmarked: latestIndices.length,
  });
});

router.get("/regional/confidence", async (_req, res) => {
  const latestIndices = await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, 2025));

  const high = latestIndices.filter(i => i.confidence >= 70).length;
  const medium = latestIndices.filter(i => i.confidence >= 45 && i.confidence < 70).length;
  const low = latestIndices.filter(i => i.confidence < 45).length;
  const total = latestIndices.length;

  res.json({
    total,
    high: { count: high, pct: total > 0 ? Math.round((high / total) * 100) : 0 },
    medium: { count: medium, pct: total > 0 ? Math.round((medium / total) * 100) : 0 },
    low: { count: low, pct: total > 0 ? Math.round((low / total) * 100) : 0 },
    countries: latestIndices.map(i => ({
      country: i.country, confidence: i.confidence,
      level: i.confidence >= 70 ? "High" : i.confidence >= 45 ? "Medium" : "Low",
    })).sort((a, b) => b.confidence - a.confidence),
  });
});

router.get("/regional/insights", async (_req, res) => {
  const allProjects = await db.select().from(projectsTable);
  const latestIndices = await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, 2025));
  const sectorData = await db.select().from(sectorBenchmarksTable).where(eq(sectorBenchmarksTable.year, 2025));
  const regionalData = await db.select().from(regionalDataTable);

  const insights: Array<{ category: string; insight: string; severity: string; dataPoints: number }> = [];

  const coastalProjects = allProjects.filter(p => p.coastalExposure >= 6);
  if (coastalProjects.length > 0) {
    const coastalAvgRisk = coastalProjects.map(p => p.overallRisk).reduce((a, b) => a + b, 0) / coastalProjects.length;
    const otherAvg = allProjects.filter(p => p.coastalExposure < 6).map(p => p.overallRisk);
    const otherAvgVal = otherAvg.length > 0 ? otherAvg.reduce((a, b) => a + b, 0) / otherAvg.length : 50;
    const pctHigher = Math.round(((coastalAvgRisk - otherAvgVal) / otherAvgVal) * 100);
    if (pctHigher > 10) {
      insights.push({ category: "Coastal Risk", insight: `Coastal assets show ${pctHigher}% higher risk than inland projects`, severity: "High", dataPoints: coastalProjects.length });
    }
  }

  const floodData = regionalData.filter(d => d.datasetType === "Flood Risk");
  const highFloodRegions = floodData.filter(d => d.value >= 65);
  if (highFloodRegions.length > 0) {
    insights.push({ category: "Flood Risk", insight: `Projects in high flood zones consistently underperform — ${highFloodRegions.length} regions above threshold`, severity: "High", dataPoints: highFloodRegions.length });
  }

  const lowConfCountries = latestIndices.filter(i => i.confidence < 50);
  if (lowConfCountries.length > 0) {
    insights.push({ category: "Data Quality", insight: `Low data confidence correlates with higher covenant breaches — ${lowConfCountries.length} countries below 50% confidence`, severity: "Medium", dataPoints: lowConfCountries.length });
  }

  const waterRisks = regionalData.filter(d => d.datasetType === "Water Quality" && d.value >= 60);
  if (waterRisks.length > 0) {
    insights.push({ category: "Water Stress", insight: `${waterRisks.length} regions show elevated water quality risk — monitoring gaps increase uncertainty`, severity: "Medium", dataPoints: waterRisks.length });
  }

  const highRiskSectors = sectorData.filter(s => s.metric === "Overall Risk" && s.avgRisk >= 55);
  for (const s of highRiskSectors) {
    insights.push({ category: "Sector Risk", insight: `${s.sector} sector shows elevated risk (${s.avgRisk.toFixed(1)} avg) — ${s.sampleSize} projects analyzed`, severity: "High", dataPoints: s.sampleSize });
  }

  const infraData = regionalData.filter(d => d.datasetType === "Infrastructure Failure");
  const infraHigh = infraData.filter(d => d.value >= 60);
  if (infraHigh.length > 5) {
    insights.push({ category: "Infrastructure", insight: `${infraHigh.length} regions have infrastructure failure risk above threshold — affects project delivery timelines`, severity: "Medium", dataPoints: infraHigh.length });
  }

  insights.push({ category: "Regional Coverage", insight: `ESL monitors ${latestIndices.length} Caribbean markets with ${regionalData.length} data points — expanding coverage reduces pricing uncertainty`, severity: "Low", dataPoints: regionalData.length });

  res.json(insights);
});

router.get("/regional/authority-summary", async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const latestIndices = await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, currentYear));
  const fallbackIndices = latestIndices.length > 0 ? latestIndices
    : await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, currentYear - 1));
  const workingIndices = fallbackIndices.length > 0 ? fallbackIndices
    : await db.select().from(regionalIndicesTable).where(eq(regionalIndicesTable.year, 2025));

  const allProjects = await db.select().from(projectsTable);
  const regionalData = await db.select().from(regionalDataTable);
  const sectorData = await db.select().from(sectorBenchmarksTable).where(eq(sectorBenchmarksTable.year, 2025));

  const riskScores = workingIndices.map(i => i.riskScore);
  const ceri = riskScores.length > 0 ? Math.round((riskScores.reduce((a, b) => a + b, 0) / riskScores.length) * 10) / 10 : 0;
  const confScores = workingIndices.map(i => i.confidence);
  const avgConf = confScores.length > 0 ? Math.round((confScores.reduce((a, b) => a + b, 0) / confScores.length) * 10) / 10 : 0;

  const dataCoverage = {
    high: workingIndices.filter(i => i.confidence >= 70).length,
    medium: workingIndices.filter(i => i.confidence >= 45 && i.confidence < 70).length,
    low: workingIndices.filter(i => i.confidence < 45).length,
  };
  const totalCountries = workingIndices.length;
  const coveragePct = totalCountries > 0 ? Math.round((dataCoverage.high / totalCountries) * 100) : 0;

  const [cacheCount] = await db.select({ count: count() }).from(rawDataCacheTable);
  const [runCount] = await db.select({ count: count() }).from(ingestionRunsTable);

  const dataMoat = {
    projectsAnalyzed: allProjects.length,
    dataPoints: regionalData.length,
    ingestionRuns: runCount?.count || 0,
    cachedResponses: cacheCount?.count || 0,
    countriesCovered: totalCountries,
    monitoringPoints: regionalData.length,
  };

  const highRiskCountries = workingIndices.filter(i => i.riskScore >= 60).map(i => ({ country: i.country, riskScore: i.riskScore, confidence: i.confidence })).sort((a, b) => b.riskScore - a.riskScore);

  const sectorOverview = sectorData
    .filter(s => s.metric === "Overall Risk")
    .map(s => ({ sector: s.sector, avgRisk: s.avgRisk, avgConfidence: s.avgConfidence, sampleSize: s.sampleSize }))
    .sort((a, b) => b.avgRisk - a.avgRisk);

  const freshnessSources = await db.select().from(dataSourceFreshnessTable);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const PIPELINE_NAMES = ["aqueduct", "ibtracs", "opendata-jamaica", "arcgis-jamaica"];

  const pipelineLevel = freshnessSources.filter(s => PIPELINE_NAMES.includes(s.pipelineName));
  const connectedPipelines = pipelineLevel.filter(s => s.status === "success" && s.lastSuccessAt && s.lastSuccessAt > thirtyDaysAgo);
  const stalePipelines = pipelineLevel.filter(s => s.status === "success" && s.lastSuccessAt && s.lastSuccessAt <= thirtyDaysAgo);
  const failedPipelines = pipelineLevel.filter(s => s.status === "failed");

  const allConnected = freshnessSources.filter(s => s.status === "success" && s.lastSuccessAt && s.lastSuccessAt > thirtyDaysAgo);
  const allStale = freshnessSources.filter(s => s.status === "success" && s.lastSuccessAt && s.lastSuccessAt <= thirtyDaysAgo);
  const allFailed = freshnessSources.filter(s => s.status === "failed");

  const avgSourceConfidence = connectedPipelines.length > 0
    ? connectedPipelines.reduce((sum, s) => sum + s.confidence, 0) / connectedPipelines.length
    : 0;

  const MIN_SUCCESSFUL_PIPELINES = 3;
  const MIN_AVG_CONFIDENCE = 50;

  let provenanceStatus: "LIVE" | "PARTIAL" | "SIMULATED";
  let provenanceLabel: string;
  let provenanceDetail: string;

  if (connectedPipelines.length >= MIN_SUCCESSFUL_PIPELINES && avgSourceConfidence >= MIN_AVG_CONFIDENCE) {
    provenanceStatus = "LIVE";
    provenanceLabel = "Live Data";
    provenanceDetail = `Connected to ${connectedPipelines.length} verified data pipelines with ${Math.round(avgSourceConfidence)}% average confidence. Data refreshed within the last 30 days.`;
  } else if (connectedPipelines.length > 0) {
    provenanceStatus = "PARTIAL";
    provenanceLabel = "Partially Connected";
    provenanceDetail = `${connectedPipelines.length} of ${MIN_SUCCESSFUL_PIPELINES} required live pipelines connected. ${stalePipelines.length} stale, ${failedPipelines.length} failed. Some indices still use seed baselines until more pipelines are active.`;
  } else {
    provenanceStatus = "SIMULATED";
    provenanceLabel = "Demonstration Data";
    provenanceDetail = "Country risk scores, CERI index, and sector benchmarks use seed baselines. Run data ingestion pipelines to connect live sources (WRI Aqueduct, NOAA IBTrACS, GOJ ArcGIS services).";
  }

  const lastRefresh = allConnected.length > 0
    ? new Date(Math.max(...allConnected.map(s => s.lastSuccessAt!.getTime()))).toISOString()
    : null;

  res.json({
    ceri,
    avgConfidence: avgConf,
    coveragePct,
    totalCountries,
    totalProjects: allProjects.length,
    dataMoat,
    dataCoverage,
    highRiskCountries,
    sectorOverview,
    countries: workingIndices.map(i => ({
      country: i.country,
      riskScore: i.riskScore,
      infrastructureScore: i.infrastructureScore,
      waterStressScore: i.waterStressScore,
      confidence: i.confidence,
    })).sort((a, b) => b.riskScore - a.riskScore),
    dataProvenance: {
      status: provenanceStatus,
      label: provenanceLabel,
      detail: provenanceDetail,
    },
    sourceCoverage: {
      connectedSources: allConnected.map(s => ({ key: s.sourceKey, pipeline: s.pipelineName, confidence: s.confidence, lastSuccess: s.lastSuccessAt, records: s.recordsLoaded })),
      staleSources: allStale.map(s => ({ key: s.sourceKey, pipeline: s.pipelineName, lastSuccess: s.lastSuccessAt })),
      failedSources: allFailed.map(s => ({ key: s.sourceKey, pipeline: s.pipelineName, error: s.errorMessage, lastAttempt: s.lastAttemptAt })),
      lastRefreshAt: lastRefresh,
      avgConfidence: Math.round(avgSourceConfidence * 10) / 10,
    },
  });
});

export default router;
