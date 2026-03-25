import { Router, type IRouter } from "express";
import { db, covenantsTable, esapItemsTable, monitoringEventsTable, auditLogsTable, frameworkAlignmentsTable, projectsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function generateFrameworkAlignment(project: any) {
  const alignments: Array<{framework: string; standard: string; status: string; gap: string | null; severity: string}> = [];
  
  const ps1Status = project.hasMonitoringData ? "Compliant" : "Partial";
  const ps1Gap = project.hasMonitoringData ? null : "Missing ESMS documentation";
  alignments.push({ framework: "IFC", standard: "PS1 - Assessment & Management", status: ps1Status, gap: ps1Gap, severity: project.hasMonitoringData ? "Low" : "High" });

  const ps2Status = project.communitySensitivity < 5 ? "Compliant" : "Partial";
  alignments.push({ framework: "IFC", standard: "PS2 - Labor & Working Conditions", status: ps2Status, gap: ps2Status === "Partial" ? "Community labor impact assessment needed" : null, severity: ps2Status === "Partial" ? "Medium" : "Low" });

  const ps3Status = project.contaminationRisk < 4 && project.hasLabData ? "Compliant" : project.contaminationRisk >= 7 ? "Non-Compliant" : "Partial";
  const ps3Gap = ps3Status === "Compliant" ? null : project.contaminationRisk >= 7 ? "Critical contamination — remediation plan required" : "Waste management gaps identified";
  alignments.push({ framework: "IFC", standard: "PS3 - Resource Efficiency & Pollution", status: ps3Status, gap: ps3Gap, severity: ps3Status === "Non-Compliant" ? "Critical" : ps3Status === "Partial" ? "Medium" : "Low" });

  const ps4Status = project.communitySensitivity < 5 ? "Compliant" : "Partial";
  alignments.push({ framework: "IFC", standard: "PS4 - Community Health & Safety", status: ps4Status, gap: ps4Status === "Partial" ? "Community health impact study incomplete" : null, severity: ps4Status === "Partial" ? "High" : "Low" });

  const ps5Status = project.projectType === "Hotel" || project.projectType === "Port" ? "Partial" : "Compliant";
  alignments.push({ framework: "IFC", standard: "PS5 - Land Acquisition & Resettlement", status: ps5Status, gap: ps5Status === "Partial" ? "Resettlement action plan pending" : null, severity: ps5Status === "Partial" ? "Medium" : "Low" });

  const ps6Status = project.environmentalRisk < 40 ? "Compliant" : "Partial";
  alignments.push({ framework: "IFC", standard: "PS6 - Biodiversity Conservation", status: ps6Status, gap: ps6Status === "Partial" ? "Biodiversity baseline assessment incomplete" : null, severity: ps6Status === "Partial" ? "High" : "Low" });

  const ps7Status = "Not Applicable";
  alignments.push({ framework: "IFC", standard: "PS7 - Indigenous Peoples", status: ps7Status, gap: null, severity: "Low" });

  const ps8Status = project.projectType === "Hotel" || project.projectType === "Port" ? "Partial" : "Not Applicable";
  alignments.push({ framework: "IFC", standard: "PS8 - Cultural Heritage", status: ps8Status, gap: ps8Status === "Partial" ? "Cultural heritage screening required" : null, severity: ps8Status === "Partial" ? "Medium" : "Low" });

  const epStatus = project.investmentAmount >= 10 ? "Applicable" : "Below Threshold";
  const epGaps = project.isIFCAligned ? "Aligned" : "EP4 categorization pending";
  alignments.push({ framework: "Equator Principles", standard: "EP4 - Project Finance", status: epStatus, gap: epStatus === "Applicable" ? epGaps : null, severity: project.isIFCAligned ? "Low" : "Medium" });

  const idbStatus = project.hasMonitoringData && project.hasLabData ? "Aligned" : "Gaps Identified";
  alignments.push({ framework: "IDB Invest", standard: "E&S Sustainability Policy", status: idbStatus, gap: idbStatus === "Gaps Identified" ? "Environmental data requirements not met" : null, severity: idbStatus === "Gaps Identified" ? "High" : "Low" });

  return alignments;
}

function generateCovenants(project: any) {
  const covenants: Array<{category: string; description: string; triggerCondition: string; status: string}> = [];
  
  if (project.contaminationRisk >= 5 || !project.hasLabData) {
    covenants.push({
      category: "Environmental",
      description: "Independent water quality monitoring required quarterly to ISO 17025 standard",
      triggerCondition: "Contamination risk elevated or lab data absent",
      status: project.hasLabData ? "In Progress" : "Pending"
    });
  }
  
  if (project.floodRisk >= 5) {
    covenants.push({
      category: "Environmental",
      description: "Flood risk mitigation infrastructure must be installed prior to drawdown",
      triggerCondition: "Flood risk score exceeds threshold",
      status: "Pending"
    });
  }

  if (!project.hasMonitoringData) {
    covenants.push({
      category: "Environmental",
      description: "Continuous environmental monitoring system deployment within 60 days",
      triggerCondition: "No monitoring data available",
      status: "Pending"
    });
  }

  if (project.communitySensitivity >= 5) {
    covenants.push({
      category: "Social",
      description: "Community stakeholder engagement plan required prior to construction",
      triggerCondition: "Community sensitivity exceeds threshold",
      status: "Pending"
    });
  }

  if (project.coastalExposure >= 5) {
    covenants.push({
      category: "Environmental",
      description: "Coastal resilience assessment and adaptation plan required",
      triggerCondition: "High coastal exposure risk",
      status: "Pending"
    });
  }

  if (!project.isIFCAligned) {
    covenants.push({
      category: "Monitoring",
      description: "Alignment with IFC Performance Standards required within 180 days",
      triggerCondition: "Project not currently IFC-aligned",
      status: "Pending"
    });
  }

  covenants.push({
    category: "Monitoring",
    description: "Quarterly E&S monitoring reports submitted to lender",
    triggerCondition: "Standard monitoring obligation",
    status: project.hasMonitoringData ? "Met" : "Pending"
  });

  if (project.regulatoryComplexity >= 6) {
    covenants.push({
      category: "Social",
      description: "Regulatory compliance audit by independent third party annually",
      triggerCondition: "High regulatory complexity",
      status: "Pending"
    });
  }

  return covenants;
}

function generateEsapItems(project: any) {
  const items: Array<{action: string; owner: string; deadline: string; status: string; evidence: string | null}> = [];

  if (!project.hasLabData) {
    items.push({ action: "Conduct independent laboratory testing of soil and water samples", owner: "Sponsor", deadline: "90 days", status: "Not Started", evidence: null });
  }
  if (!project.hasMonitoringData) {
    items.push({ action: "Deploy continuous environmental monitoring stations", owner: "Sponsor", deadline: "60 days", status: "Not Started", evidence: null });
  }
  if (!project.isIFCAligned) {
    items.push({ action: "Complete IFC Performance Standards gap analysis", owner: "E&S Consultant", deadline: "120 days", status: "In Progress", evidence: null });
  }
  if (project.contaminationRisk >= 5) {
    items.push({ action: "Conduct Phase II environmental site assessment", owner: "Environmental Consultant", deadline: "60 days", status: "Not Started", evidence: null });
  }
  if (project.floodRisk >= 5) {
    items.push({ action: "Develop flood risk mitigation and drainage plan", owner: "Civil Engineer", deadline: "90 days", status: "Not Started", evidence: null });
  }
  if (project.communitySensitivity >= 5) {
    items.push({ action: "Conduct community stakeholder consultation sessions", owner: "Social Specialist", deadline: "45 days", status: "In Progress", evidence: null });
  }
  if (project.coastalExposure >= 5) {
    items.push({ action: "Complete coastal vulnerability and climate adaptation assessment", owner: "Climate Consultant", deadline: "120 days", status: "Not Started", evidence: null });
  }
  items.push({ action: "Prepare Environmental & Social Management System (ESMS)", owner: "Sponsor", deadline: "180 days", status: project.hasMonitoringData ? "In Progress" : "Not Started", evidence: null });
  items.push({ action: "Submit initial E&S monitoring report", owner: "Sponsor", deadline: "30 days", status: project.hasMonitoringData ? "Complete" : "Not Started", evidence: project.hasMonitoringData ? "Report submitted" : null });

  return items;
}

router.get("/projects/:id/framework-alignment", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const existing = await db.select().from(frameworkAlignmentsTable).where(eq(frameworkAlignmentsTable.projectId, id));
  if (existing.length > 0) {
    res.json(existing);
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const alignments = generateFrameworkAlignment(project);
  const inserted = [];
  for (const a of alignments) {
    const [row] = await db.insert(frameworkAlignmentsTable).values({ projectId: id, ...a }).returning();
    inserted.push(row);
  }
  res.json(inserted);
});

router.get("/projects/:id/covenants", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const existing = await db.select().from(covenantsTable).where(eq(covenantsTable.projectId, id));
  if (existing.length > 0) {
    res.json(existing);
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const covenants = generateCovenants(project);
  const inserted = [];
  for (const c of covenants) {
    const [row] = await db.insert(covenantsTable).values({ projectId: id, ...c }).returning();
    inserted.push(row);
  }

  await db.insert(auditLogsTable).values({
    projectId: id,
    action: "Covenants Generated",
    user: "System",
    details: `${inserted.length} covenants auto-generated from risk profile`
  });

  res.json(inserted);
});

router.patch("/covenants/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const { status } = req.body;
  if (!status || !["Pending", "In Progress", "Met", "Breach"].includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const [existing] = await db.select().from(covenantsTable).where(eq(covenantsTable.id, id));
  if (!existing) { res.status(404).json({ message: "Covenant not found" }); return; }

  const [updated] = await db.update(covenantsTable).set({ status, updatedAt: new Date() }).where(eq(covenantsTable.id, id)).returning();

  await db.insert(auditLogsTable).values({
    projectId: existing.projectId,
    action: "Covenant Status Updated",
    user: req.body.user || "Analyst",
    details: `Covenant ${id}: ${existing.status} → ${status}`
  });

  res.json(updated);
});

router.get("/projects/:id/esap", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const existing = await db.select().from(esapItemsTable).where(eq(esapItemsTable.projectId, id));
  if (existing.length > 0) {
    res.json(existing);
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const items = generateEsapItems(project);
  const inserted = [];
  for (const item of items) {
    const [row] = await db.insert(esapItemsTable).values({ projectId: id, ...item }).returning();
    inserted.push(row);
  }

  await db.insert(auditLogsTable).values({
    projectId: id,
    action: "ESAP Generated",
    user: "System",
    details: `${inserted.length} ESAP items auto-generated from risk profile`
  });

  res.json(inserted);
});

router.patch("/esap/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const { status, evidence } = req.body;
  const validStatuses = ["Not Started", "In Progress", "Complete", "Overdue"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const [existing] = await db.select().from(esapItemsTable).where(eq(esapItemsTable.id, id));
  if (!existing) { res.status(404).json({ message: "ESAP item not found" }); return; }

  const updates: any = { updatedAt: new Date() };
  if (status) updates.status = status;
  if (evidence !== undefined) updates.evidence = evidence;

  const [updated] = await db.update(esapItemsTable).set(updates).where(eq(esapItemsTable.id, id)).returning();

  await db.insert(auditLogsTable).values({
    projectId: existing.projectId,
    action: "ESAP Item Updated",
    user: req.body.user || "Analyst",
    details: `ESAP ${id}: ${existing.status} → ${status || existing.status}`
  });

  res.json(updated);
});

router.get("/projects/:id/monitoring", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const events = await db.select().from(monitoringEventsTable).where(eq(monitoringEventsTable.projectId, id)).orderBy(desc(monitoringEventsTable.id));
  res.json(events);
});

router.post("/projects/:id/monitoring", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const { date, type, result, status, findings } = req.body;
  if (!date || !type || !result) {
    res.status(400).json({ message: "date, type, and result are required" });
    return;
  }
  const validTypes = ["Site Inspection", "Lab Analysis", "Community Survey", "Air Quality", "Water Quality", "Noise", "EIA Review", "Biodiversity"];
  const validStatuses = ["Verified", "Escalated", "Resolved", "Pending"];
  if (!validTypes.includes(type)) { res.status(400).json({ message: `Invalid type. Allowed: ${validTypes.join(", ")}` }); return; }
  if (status && !validStatuses.includes(status)) { res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(", ")}` }); return; }
  if (typeof findings !== "undefined" && typeof findings !== "string") { res.status(400).json({ message: "findings must be a string" }); return; }

  const [event] = await db.insert(monitoringEventsTable).values({
    projectId: id, date, type, result, status: status || "Verified", findings
  }).returning();

  await db.insert(auditLogsTable).values({
    projectId: id,
    action: "Monitoring Event Added",
    user: req.body.user || "Analyst",
    details: `${type}: ${result} (${status || "Verified"})`
  });

  res.json(event);
});

router.get("/projects/:id/audit-log", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const logs = await db.select().from(auditLogsTable).where(eq(auditLogsTable.projectId, id)).orderBy(desc(auditLogsTable.createdAt));
  res.json(logs);
});

router.get("/audit-log", async (_req, res) => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);
  res.json(logs);
});

router.get("/governance/summary", async (_req, res) => {
  const allCovenants = await db.select().from(covenantsTable);
  const allEsap = await db.select().from(esapItemsTable);
  const allMonitoring = await db.select().from(monitoringEventsTable);

  const covenantTotal = allCovenants.length;
  const covenantsMet = allCovenants.filter(c => c.status === "Met").length;
  const covenantsBreach = allCovenants.filter(c => c.status === "Breach").length;
  const covenantCompliance = covenantTotal > 0 ? Math.round((covenantsMet / covenantTotal) * 100) : 0;

  const esapTotal = allEsap.length;
  const esapComplete = allEsap.filter(e => e.status === "Complete").length;
  const esapOverdue = allEsap.filter(e => e.status === "Overdue").length;
  const esapCompletion = esapTotal > 0 ? Math.round((esapComplete / esapTotal) * 100) : 0;

  const breaches: Array<{projectId: number; issue: string; type: string; severity: string}> = [];
  for (const c of allCovenants.filter(c => c.status === "Breach")) {
    breaches.push({ projectId: c.projectId, issue: c.description, type: "Covenant Breach", severity: "High" });
  }
  for (const e of allEsap.filter(e => e.status === "Overdue")) {
    breaches.push({ projectId: e.projectId, issue: e.action, type: "ESAP Overdue", severity: "Medium" });
  }
  for (const m of allMonitoring.filter(m => m.status === "Escalated")) {
    breaches.push({ projectId: m.projectId, issue: m.findings || m.result, type: "Monitoring Escalation", severity: "High" });
  }

  res.json({
    covenantCompliance,
    covenantsMet,
    covenantsTotal: covenantTotal,
    covenantsBreach,
    esapCompletion,
    esapComplete,
    esapTotal,
    esapOverdue,
    monitoringEvents: allMonitoring.length,
    breachCount: breaches.length,
    breaches,
  });
});

router.get("/projects/:id/report", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const covenants = await db.select().from(covenantsTable).where(eq(covenantsTable.projectId, id));
  const esapItems = await db.select().from(esapItemsTable).where(eq(esapItemsTable.projectId, id));
  const monitoring = await db.select().from(monitoringEventsTable).where(eq(monitoringEventsTable.projectId, id));
  const framework = await db.select().from(frameworkAlignmentsTable).where(eq(frameworkAlignmentsTable.projectId, id));
  const auditLogs = await db.select().from(auditLogsTable).where(eq(auditLogsTable.projectId, id)).orderBy(desc(auditLogsTable.createdAt)).limit(50);

  const covenantsMet = covenants.filter(c => c.status === "Met").length;
  const esapComplete = esapItems.filter(e => e.status === "Complete").length;

  res.json({
    project: {
      id: project.id,
      name: project.name,
      country: project.country,
      projectType: project.projectType,
      investmentAmount: project.investmentAmount,
      overallRisk: project.overallRisk,
      dataConfidence: project.dataConfidence,
      decisionOutcome: project.decisionOutcome,
      decisionInsight: project.decisionInsight,
      decisionConditions: project.decisionConditions,
    },
    riskScores: {
      environmental: project.environmentalRisk,
      infrastructure: project.infrastructureRisk,
      humanExposure: project.humanExposureRisk,
      regulatory: project.regulatoryRisk,
    },
    financialRisk: {
      delayRisk: project.delayRiskPercent,
      costOverrun: project.costOverrunPercent,
      covenantBreach: project.covenantBreachPercent,
      reputationalRisk: project.reputationalRisk,
    },
    framework,
    covenants,
    covenantSummary: {
      total: covenants.length,
      met: covenantsMet,
      compliance: covenants.length > 0 ? Math.round((covenantsMet / covenants.length) * 100) : 0,
    },
    esapItems,
    esapSummary: {
      total: esapItems.length,
      complete: esapComplete,
      completion: esapItems.length > 0 ? Math.round((esapComplete / esapItems.length) * 100) : 0,
    },
    monitoring,
    auditLog: auditLogs,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
