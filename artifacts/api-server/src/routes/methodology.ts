import { Router, type IRouter } from "express";
import {
  db,
  methodologyEvidenceTable,
  calibrationMemosTable,
  validationCasesTable,
  validationObservationsTable,
  overrideDecisionsTable,
  methodologyProfilesTable,
  sectorFamiliesTable,
  projectsTable,
  profileComparisonRunsTable,
  assessmentSnapshotsTable,
  methodologyProfileChangesTable,
  funderFrameworksTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { SECTOR_FAMILIES, getAllProjectTypes, lookupSectorFamily } from "../lib/sector-families";
import { getAllProfiles, getProfileByKey, getProfileForFamily } from "../lib/methodology-profiles";
import { generateMemo, type MemoGenerationParams } from "../lib/memo-generator";
import { ESL_SERVICE_CATALOG, getServicesForContext, recommendServices } from "../lib/esl-services-expanded";
import { calculateLayeredPERS } from "../lib/layered-pers-engine";
import { getAllFunderFrameworks, getFunderFramework, applyFunderToProject } from "../lib/funder-frameworks";
import { decryptProjectFields } from "../lib/project-encryption";
import type { SectorFamilyKey } from "../lib/sector-families";
import type { InstrumentType } from "../lib/instrument-logic";

const router: IRouter = Router();

router.get("/methodology/profiles", (_req, res) => {
  res.json(getAllProfiles());
});

router.get("/methodology/profiles/:key", (req, res) => {
  const profile = getProfileByKey(req.params.key);
  if (!profile) {
    res.status(404).json({ message: "Profile not found" });
    return;
  }
  res.json(profile);
});

router.get("/methodology/sector-families", (_req, res) => {
  res.json(SECTOR_FAMILIES);
});

router.get("/methodology/project-types", (_req, res) => {
  res.json(getAllProjectTypes());
});

router.get("/methodology/instruments", (_req, res) => {
  res.json({
    instruments: [
      { key: "LOAN", name: "Loan", description: "Commercial or concessional lending", decisionSignals: ["PROCEED", "CONDITION", "DECLINE"] },
      { key: "GRANT", name: "Grant", description: "Concessional funding with no repayment obligation", decisionSignals: ["PROCEED", "PROCEED_WITH_CONTROLS", "RESEQUENCE", "NARROW_SCOPE", "DEFER_PENDING_BASELINE", "DO_NOT_FUND"] },
      { key: "BLENDED", name: "Blended Finance", description: "Combined grant and debt with transition pathway", decisionSignals: ["PROCEED", "PROCEED_WITH_CONTROLS", "CONDITION", "DO_NOT_FUND"] },
      { key: "GUARANTEE", name: "Guarantee", description: "Risk sharing via guarantee instrument", decisionSignals: ["PROCEED", "CONDITION", "DECLINE"] },
      { key: "TECHNICAL_ASSISTANCE", name: "Technical Assistance", description: "Knowledge transfer and capacity building", decisionSignals: ["PROCEED", "DEFER_PENDING_BASELINE", "NARROW_SCOPE"] },
      { key: "PROGRAMMATIC", name: "Programmatic", description: "Multi-sector/multi-site programmatic deployment", decisionSignals: ["PROCEED", "PROCEED_WITH_CONTROLS", "DEFER_PENDING_BASELINE", "DO_NOT_FUND"] },
      { key: "EMERGENCY", name: "Emergency", description: "Rapid-response disaster deployment", decisionSignals: ["PROCEED", "PROCEED_WITH_CONTROLS", "NARROW_SCOPE"] },
    ],
  });
});

router.get("/methodology/layered-scoring", (_req, res) => {
  res.json({
    name: "Layered PERS Scoring Architecture",
    version: "2.0.0",
    layers: [
      { key: "countryContext", name: "Country Context", description: "Governance, INFORM risk, environmental baseline" },
      { key: "projectExposure", name: "Project Exposure", description: "Site-specific hazard, sector complexity, SEA/ESIA mitigation" },
      { key: "sectorSensitivity", name: "Sector Sensitivity", description: "Community vulnerability, governance quality, disaster history" },
      { key: "interventionDelivery", name: "Intervention Delivery", description: "Delivery modality risk by intervention type" },
      { key: "instrumentStructure", name: "Instrument Structure", description: "Instrument-specific risk factors and decision logic" },
      { key: "outcomeDelivery", name: "Outcome Delivery", description: "Theory of change credibility, implementation capacity" },
    ],
    familyProfiles: getAllProfiles().map(p => ({
      profileKey: p.profileKey,
      name: p.name,
      sectorFamily: p.sectorFamily,
      weights: p.weights,
    })),
  });
});

router.get("/methodology/evidence", async (_req, res) => {
  const evidence = await db.select().from(methodologyEvidenceTable).orderBy(desc(methodologyEvidenceTable.createdAt));
  res.json(evidence);
});

router.post("/methodology/evidence", requireRole("Admin"), async (req, res) => {
  const { profileKey, evidenceType, title, description, sourceReference, relevantFrameworks } = req.body;
  if (!profileKey || !evidenceType || !title) {
    res.status(400).json({ message: "profileKey, evidenceType, and title are required" });
    return;
  }
  const [evidence] = await db.insert(methodologyEvidenceTable).values({
    profileKey, evidenceType, title, description, sourceReference, relevantFrameworks,
  }).returning();
  res.status(201).json(evidence);
});

router.get("/calibration/memos", async (_req, res) => {
  const memos = await db.select().from(calibrationMemosTable).orderBy(desc(calibrationMemosTable.generatedAt));
  res.json(memos);
});

router.post("/calibration/memos/generate", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const params: MemoGenerationParams = {
    memoType: req.body.memoType ?? "weighting_defense",
    profileKey: req.body.profileKey,
    sectorFamily: req.body.sectorFamily,
    country: req.body.country,
    funder: req.body.funder,
  };

  const content = await generateMemo(params);

  const [memo] = await db.insert(calibrationMemosTable).values({
    memoType: params.memoType,
    title: content.title,
    profileKey: params.profileKey,
    sectorFamily: params.sectorFamily,
    country: params.country,
    funder: params.funder,
    content,
    status: "draft",
  }).returning();

  res.status(201).json(memo);
});

router.get("/calibration/memos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid memo ID" }); return; }
  const [memo] = await db.select().from(calibrationMemosTable).where(eq(calibrationMemosTable.id, id));
  if (!memo) { res.status(404).json({ message: "Memo not found" }); return; }
  res.json(memo);
});

router.get("/validation/cases", async (_req, res) => {
  const cases = await db.select().from(validationCasesTable).orderBy(desc(validationCasesTable.createdAt));
  res.json(cases);
});

router.post("/validation/cases", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const { projectId, caseType, predictedRisk, observedRisk, predictedOutcome, observedOutcome, sectorFamily, profileUsed, notes } = req.body;
  if (!caseType) { res.status(400).json({ message: "caseType required" }); return; }
  const [vc] = await db.insert(validationCasesTable).values({
    projectId, caseType, predictedRisk, observedRisk, predictedOutcome, observedOutcome, sectorFamily, profileUsed, notes,
  }).returning();
  res.status(201).json(vc);
});

router.get("/validation/cases/:id/observations", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid case ID" }); return; }
  const obs = await db.select().from(validationObservationsTable).where(eq(validationObservationsTable.validationCaseId, id));
  res.json(obs);
});

router.post("/validation/cases/:id/observations", requireRole("Admin", "Investment Officer"), async (req, res) => {
  const validationCaseId = parseInt(req.params.id);
  if (isNaN(validationCaseId)) { res.status(400).json({ message: "Invalid case ID" }); return; }
  const { observationType, description, impact, recommendation } = req.body;
  if (!observationType || !description) { res.status(400).json({ message: "observationType and description required" }); return; }
  const [obs] = await db.insert(validationObservationsTable).values({
    validationCaseId, observationType, description, impact, recommendation,
  }).returning();
  res.status(201).json(obs);
});

router.get("/overrides", async (_req, res) => {
  const overrides = await db.select().from(overrideDecisionsTable).orderBy(desc(overrideDecisionsTable.createdAt));
  res.json(overrides);
});

router.post("/overrides", requireRole("Admin"), async (req, res) => {
  const { projectId, overrideType, originalValue, overriddenValue, reason, reviewer, mitigationRationale } = req.body;
  if (!projectId || !overrideType || !originalValue || !overriddenValue || !reason || !reviewer) {
    res.status(400).json({ message: "projectId, overrideType, originalValue, overriddenValue, reason, reviewer required" });
    return;
  }
  const [override] = await db.insert(overrideDecisionsTable).values({
    projectId, overrideType, originalValue, overriddenValue, reason, reviewer, mitigationRationale,
  }).returning();
  res.status(201).json(override);
});

router.get("/esl-services/catalog", (_req, res) => {
  res.json(ESL_SERVICE_CATALOG);
});

router.post("/esl-services/recommend", async (req, res) => {
  const { sectorFamily, instrumentType, persScore, dataConfidence, riskFactors } = req.body;
  if (!sectorFamily || !instrumentType) {
    res.status(400).json({ message: "sectorFamily and instrumentType required" });
    return;
  }
  const recommendations = recommendServices(
    sectorFamily as SectorFamilyKey,
    instrumentType as InstrumentType,
    persScore ?? 50,
    dataConfidence ?? 50,
    riskFactors ?? { environmentalRisk: 50, humanExposureRisk: 50, regulatoryRisk: 50 },
  );
  res.json(recommendations);
});

router.post("/methodology/compare/project/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  const p = decryptProjectFields(project);

  const { profileKeys, instrumentOverride, funderOverride } = req.body;
  if (!profileKeys || !Array.isArray(profileKeys) || profileKeys.length === 0) {
    res.status(400).json({ message: "profileKeys array required" }); return;
  }

  const instrumentType = (instrumentOverride ?? p.instrumentType ?? "LOAN") as InstrumentType;
  const riskScores = {
    environmentalRisk: p.environmentalRisk,
    infrastructureRisk: p.infrastructureRisk,
    humanExposureRisk: p.humanExposureRisk,
    regulatoryRisk: p.regulatoryRisk,
    dataConfidence: p.dataConfidence,
    overallRisk: p.overallRisk,
  };

  const results: any[] = [];
  for (const profileKey of profileKeys) {
    const prof = getProfileByKey(profileKey);
    if (!prof) continue;

    const assessment = calculateLayeredPERS(
      riskScores, p.projectType, p.hasSEA, p.hasESIA,
      instrumentType, undefined, undefined, undefined, undefined,
      undefined, profileKey,
    );

    results.push({
      profileKey: prof.profileKey,
      profileName: prof.name,
      sectorFamily: prof.sectorFamily,
      layeredScores: assessment.layeredBreakdown.layeredScores,
      decisionSignal: assessment.decisionSignal,
      capitalMode: assessment.capitalMode,
      monitoringIntensity: assessment.monitoringIntensity.level,
      transitionReadiness: assessment.layeredBreakdown.transitionReadiness,
      disbursementReadiness: assessment.layeredBreakdown.disbursementReadiness,
      blendedLabel: assessment.layeredBreakdown.blendedLabel,
      conditions: assessment.layeredBreakdown.instrumentAssessment.conditions,
      reasoning: assessment.layeredBreakdown.instrumentAssessment.reasoning,
      weights: assessment.layeredBreakdown.weights,
      explainability: assessment.layeredBreakdown.explainability,
    });
  }

  const activeProfile = p.methodologyProfile ?? getProfileForFamily(lookupSectorFamily(p.projectType)).profileKey;
  const activeResult = results.find(r => r.profileKey === activeProfile);

  const comparisons = results.map(r => {
    const base = activeResult ?? results[0];
    return {
      ...r,
      deltas: {
        persFinalDelta: Math.round((r.layeredScores.persFinalScore - base.layeredScores.persFinalScore) * 10) / 10,
        decisionChanged: r.decisionSignal !== base.decisionSignal,
        capitalModeChanged: r.capitalMode !== base.capitalMode,
        monitoringChanged: r.monitoringIntensity !== base.monitoringIntensity,
        topDriverChanges: getTopDriverChanges(r.layeredScores, base.layeredScores),
      },
    };
  });

  const [run] = await db.insert(profileComparisonRunsTable).values({
    targetType: "project",
    targetId: projectId,
    selectedProfiles: profileKeys,
    instrumentOverride: instrumentOverride ?? null,
    funderOverride: funderOverride ?? null,
    results: comparisons,
    generatedBy: (req as any).user?.email ?? "system",
  }).returning();

  res.json({ comparisonId: run.id, activeProfile, instrumentType, comparisons });
});

router.get("/methodology/comparisons", async (_req, res) => {
  const runs = await db.select().from(profileComparisonRunsTable).orderBy(desc(profileComparisonRunsTable.createdAt)).limit(50);
  res.json(runs);
});

router.get("/funders", (_req, res) => {
  res.json(getAllFunderFrameworks());
});

router.get("/funders/:key", (req, res) => {
  const fw = getFunderFramework(req.params.key);
  if (!fw) { res.status(404).json({ message: "Framework not found" }); return; }
  res.json(fw);
});

router.post("/funders/apply-to-project/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  const p = decryptProjectFields(project);

  const { frameworkKey } = req.body;
  if (!frameworkKey) { res.status(400).json({ message: "frameworkKey required" }); return; }

  const instrumentType = (p.instrumentType ?? "LOAN") as InstrumentType;
  const recommendation = applyFunderToProject(frameworkKey, p.persScore ?? 50, p.dataConfidence, instrumentType);
  if (!recommendation) { res.status(404).json({ message: "Framework not found" }); return; }

  const fw = getFunderFramework(frameworkKey)!;
  res.json({
    project: { id: p.id, name: p.name, persScore: p.persScore, dataConfidence: p.dataConfidence, instrumentType },
    framework: { key: fw.key, displayName: fw.displayName, categoryMapping: fw.categoryMapping },
    recommendation,
  });
});

router.post("/funders/compare", (req, res) => {
  const { frameworkKeys, persScore, dataConfidence, instrumentType } = req.body;
  if (!frameworkKeys || !Array.isArray(frameworkKeys)) {
    res.status(400).json({ message: "frameworkKeys array required" }); return;
  }

  const comparisons = frameworkKeys.map((key: string) => {
    const fw = getFunderFramework(key);
    if (!fw) return null;
    const rec = applyFunderToProject(key, persScore ?? 50, dataConfidence ?? 60, instrumentType ?? "LOAN");
    return { framework: fw, recommendation: rec };
  }).filter(Boolean);

  res.json(comparisons);
});

router.post("/assessments/snapshot/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  const p = decryptProjectFields(project);

  const instrumentType = (req.body.instrumentType ?? p.instrumentType ?? "LOAN") as InstrumentType;
  const profileOverride = req.body.profileKey;

  const riskScores = {
    environmentalRisk: p.environmentalRisk,
    infrastructureRisk: p.infrastructureRisk,
    humanExposureRisk: p.humanExposureRisk,
    regulatoryRisk: p.regulatoryRisk,
    dataConfidence: p.dataConfidence,
    overallRisk: p.overallRisk,
  };

  const assessment = calculateLayeredPERS(
    riskScores, p.projectType, p.hasSEA, p.hasESIA,
    instrumentType, undefined, undefined, undefined, undefined,
    undefined, profileOverride,
  );

  const ls = assessment.layeredBreakdown.layeredScores;
  const [snapshot] = await db.insert(assessmentSnapshotsTable).values({
    projectId,
    profileUsed: assessment.layeredBreakdown.profileUsed,
    instrumentType,
    funderFramework: req.body.funderFramework ?? null,
    countryContextScore: ls.countryContextScore,
    projectExposureScore: ls.projectExposureScore,
    sectorSensitivityScore: ls.sectorSensitivityScore,
    interventionDeliveryScore: ls.interventionDeliveryScore,
    instrumentStructureScore: ls.instrumentStructureScore,
    outcomeDeliveryScore: ls.outcomeDeliveryScore,
    confidenceScore: ls.confidenceScore,
    persBaseScore: ls.persBaseScore,
    persFinalScore: ls.persFinalScore,
    decisionSignal: assessment.decisionSignal,
    capitalMode: assessment.capitalMode,
    monitoringIntensity: assessment.monitoringIntensity.level,
    disbursementReadiness: assessment.layeredBreakdown.disbursementReadiness,
    transitionReadiness: assessment.layeredBreakdown.transitionReadiness,
    blendedLabel: assessment.layeredBreakdown.blendedLabel ?? null,
    conditions: assessment.layeredBreakdown.instrumentAssessment.conditions,
    controls: assessment.layeredBreakdown.instrumentAssessment.controls ?? assessment.layeredBreakdown.instrumentAssessment.conditions,
    reasoning: assessment.layeredBreakdown.instrumentAssessment.reasoning,
    explainability: assessment.layeredBreakdown.explainability,
    fullBreakdown: assessment.layeredBreakdown as any,
    generatedBy: (req as any).user?.email ?? "system",
  }).returning();

  res.status(201).json(snapshot);
});

router.get("/assessments/snapshots/:projectId", async (req, res) => {
  const projectId = parseInt(req.params.projectId);
  if (isNaN(projectId)) { res.status(400).json({ message: "Invalid project ID" }); return; }
  const snapshots = await db.select().from(assessmentSnapshotsTable)
    .where(eq(assessmentSnapshotsTable.projectId, projectId))
    .orderBy(desc(assessmentSnapshotsTable.createdAt));
  res.json(snapshots);
});

router.post("/methodology/profiles/:key/update", requireRole("Admin"), async (req, res) => {
  const profileKey = req.params.key;
  const profile = getProfileByKey(profileKey);
  if (!profile) { res.status(404).json({ message: "Profile not found" }); return; }

  const { changes, reviewer, reason } = req.body;
  if (!changes || !reviewer || !reason) {
    res.status(400).json({ message: "changes, reviewer, and reason required" }); return;
  }

  const violations: string[] = [];
  const weightFields = ["countryContext", "projectOverlay", "sensitivity", "interventionRisk"];
  const modifierFields = ["outcomeRiskModifier", "instrumentStructureModifier", "confidenceInfluence"];
  const relevanceFields = ["hazard", "biodiversity", "governance", "disasterHistory", "communityVulnerability", "outcomeComplexity", "monitoringNeeds"];

  let materialChanges = 0;

  for (const [field, newValue] of Object.entries(changes)) {
    const nv = newValue as number;

    if (weightFields.includes(field)) {
      const original = (profile.weights as any)[field] as number;
      const delta = Math.abs(nv - original);
      if (delta > 0.10) violations.push(`Weight '${field}' shift of ${delta.toFixed(2)} exceeds ±0.10 limit`);
      if (nv < 0.05) violations.push(`Weight '${field}' = ${nv} is below 0.05 minimum`);
      if (nv > 0.50) violations.push(`Weight '${field}' = ${nv} exceeds 0.50 maximum`);
    }

    if (relevanceFields.includes(field)) {
      const original = (profile.relevance as any)[field] as number;
      if (nv < 0 || nv > 1) violations.push(`Relevance '${field}' = ${nv} is outside 0.0-1.0 bounds`);
      const delta = Math.abs(nv - original);
      if (delta > 0.20) violations.push(`Relevance '${field}' shift of ${delta.toFixed(2)} exceeds 0.20 — calibration note required`);
      if (delta > 0.05) materialChanges++;
    }
  }

  const proposedWeights = { ...profile.weights };
  for (const f of weightFields) {
    if (changes[f] !== undefined) (proposedWeights as any)[f] = changes[f];
  }
  const baseSum = proposedWeights.countryContext + proposedWeights.projectOverlay + proposedWeights.sensitivity + proposedWeights.interventionRisk;
  if (Math.abs(baseSum - 1.0) > 0.01) {
    violations.push(`Base weights sum to ${baseSum.toFixed(3)} — must normalize to 1.00`);
  }

  if (violations.length > 0) {
    res.status(422).json({
      message: "Calibration guardrail violations detected",
      violations,
      autoStatus: materialChanges >= 5 ? "UNDER_REVIEW" : null,
    });
    return;
  }

  const changeRecords: any[] = [];
  for (const [field, newValue] of Object.entries(changes)) {
    const nv = newValue as number;
    let original: number;
    if (weightFields.includes(field) || modifierFields.includes(field)) {
      original = (profile.weights as any)[field] ?? 0;
    } else {
      original = (profile.relevance as any)[field] ?? 0;
    }

    changeRecords.push({
      profileKey,
      fieldChanged: field,
      originalValue: original,
      newValue: nv,
      delta: Math.round((nv - original) * 1000) / 1000,
      changeReason: reason,
      reviewer,
      reviewStatus: materialChanges >= 5 ? "under_review" : "approved",
    });
  }

  if (changeRecords.length > 0) {
    await db.insert(methodologyProfileChangesTable).values(changeRecords);
  }

  res.json({
    message: "Profile update validated",
    changesRecorded: changeRecords.length,
    calibrationStatus: materialChanges >= 5 ? "UNDER_REVIEW" : "approved",
    violations: [],
  });
});

router.get("/methodology/profile-changes", async (_req, res) => {
  const changes = await db.select().from(methodologyProfileChangesTable).orderBy(desc(methodologyProfileChangesTable.createdAt)).limit(100);
  res.json(changes);
});

function getTopDriverChanges(a: any, b: any): string[] {
  const drivers: string[] = [];
  const fields = [
    { key: "countryContextScore", label: "Country Context" },
    { key: "projectExposureScore", label: "Project Exposure" },
    { key: "sectorSensitivityScore", label: "Sector Sensitivity" },
    { key: "interventionDeliveryScore", label: "Intervention Delivery" },
    { key: "instrumentStructureScore", label: "Instrument Structure" },
    { key: "outcomeDeliveryScore", label: "Outcome Delivery" },
  ];
  for (const f of fields) {
    const delta = a[f.key] - b[f.key];
    if (Math.abs(delta) > 2) {
      drivers.push(`${f.label}: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}`);
    }
  }
  return drivers.sort((a, b) => {
    const aDelta = Math.abs(parseFloat(a.split(": ")[1]));
    const bDelta = Math.abs(parseFloat(b.split(": ")[1]));
    return bDelta - aDelta;
  });
}

export default router;
