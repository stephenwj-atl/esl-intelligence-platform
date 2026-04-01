import { Router, type IRouter } from "express";
import {
  db,
  projectOutcomesTable,
  outcomeMetricsTable,
  disbursementMilestonesTable,
  transitionPathwaysTable,
  projectsTable,
} from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.get("/projects/:id/outcomes", async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [outcome] = await db.select().from(projectOutcomesTable).where(eq(projectOutcomesTable.projectId, projectId));
  const metrics = await db.select().from(outcomeMetricsTable).where(eq(outcomeMetricsTable.projectId, projectId));
  const milestones = await db.select().from(disbursementMilestonesTable)
    .where(eq(disbursementMilestonesTable.projectId, projectId))
    .orderBy(asc(disbursementMilestonesTable.sequenceOrder));
  const transitions = await db.select().from(transitionPathwaysTable).where(eq(transitionPathwaysTable.projectId, projectId));

  res.json({ outcome, metrics, milestones, transitions });
});

router.post("/projects/:id/outcomes", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const { theoryOfChange, outputsSummary, outcomesSummary, reportingCycle,
    outcomeDeliveryRiskScore, outcomeConfidenceScore, disbursementReadinessScore, implementationCapacityScore } = req.body;

  const existing = await db.select().from(projectOutcomesTable).where(eq(projectOutcomesTable.projectId, projectId));
  let outcome;
  if (existing.length > 0) {
    [outcome] = await db.update(projectOutcomesTable)
      .set({ theoryOfChange, outputsSummary, outcomesSummary, reportingCycle,
        outcomeDeliveryRiskScore, outcomeConfidenceScore, disbursementReadinessScore, implementationCapacityScore,
        updatedAt: new Date() })
      .where(eq(projectOutcomesTable.projectId, projectId))
      .returning();
  } else {
    [outcome] = await db.insert(projectOutcomesTable).values({
      projectId, theoryOfChange, outputsSummary, outcomesSummary, reportingCycle,
      outcomeDeliveryRiskScore, outcomeConfidenceScore, disbursementReadinessScore, implementationCapacityScore,
    }).returning();
  }

  res.status(201).json(outcome);
});

router.post("/projects/:id/metrics", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const { metricKey, metricName, category, targetValue, unit, verificationMethod } = req.body;
  if (!metricKey || !metricName || !category || !unit) {
    res.status(400).json({ message: "metricKey, metricName, category, unit required" });
    return;
  }

  const [metric] = await db.insert(outcomeMetricsTable).values({
    projectId, metricKey, metricName, category, targetValue, currentValue: null, unit, verificationMethod,
  }).returning();

  res.status(201).json(metric);
});

router.patch("/metrics/:id", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid metric ID" }); return; }
  const { currentValue, status } = req.body;

  const updates: Record<string, unknown> = {};
  if (currentValue !== undefined) updates.currentValue = currentValue;
  if (status !== undefined) updates.status = status;

  const [metric] = await db.update(outcomeMetricsTable).set(updates).where(eq(outcomeMetricsTable.id, id)).returning();
  if (!metric) { res.status(404).json({ message: "Metric not found" }); return; }
  res.json(metric);
});

router.post("/projects/:id/milestones", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const { milestoneName, milestoneType, requiredEvidence, gatingEffect, linkedInstrument, targetDate, sequenceOrder } = req.body;
  if (!milestoneName || !milestoneType) {
    res.status(400).json({ message: "milestoneName, milestoneType required" });
    return;
  }

  const [milestone] = await db.insert(disbursementMilestonesTable).values({
    projectId, milestoneName, milestoneType, requiredEvidence, gatingEffect, linkedInstrument,
    targetDate: targetDate ? new Date(targetDate) : null, sequenceOrder: sequenceOrder ?? 0,
  }).returning();

  res.status(201).json(milestone);
});

router.patch("/milestones/:id", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid milestone ID" }); return; }
  const { currentStatus, completedDate } = req.body;

  const updates: Record<string, unknown> = {};
  if (currentStatus !== undefined) updates.currentStatus = currentStatus;
  if (completedDate !== undefined) updates.completedDate = new Date(completedDate);

  const [milestone] = await db.update(disbursementMilestonesTable).set(updates).where(eq(disbursementMilestonesTable.id, id)).returning();
  if (!milestone) { res.status(404).json({ message: "Milestone not found" }); return; }
  res.json(milestone);
});

router.post("/projects/:id/transitions", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const { fromInstrument, toInstrument, transitionTrigger, validationCriteria, timeHorizon,
    requiredConditions, confidenceThreshold, responsibleReviewer } = req.body;
  if (!fromInstrument || !toInstrument) {
    res.status(400).json({ message: "fromInstrument, toInstrument required" });
    return;
  }

  const [tp] = await db.insert(transitionPathwaysTable).values({
    projectId, fromInstrument, toInstrument, transitionTrigger, validationCriteria,
    timeHorizon, requiredConditions, confidenceThreshold, responsibleReviewer,
  }).returning();

  res.status(201).json(tp);
});

export default router;
