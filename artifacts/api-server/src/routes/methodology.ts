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
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { SECTOR_FAMILIES, getAllProjectTypes } from "../lib/sector-families";
import { getAllProfiles, getProfileByKey } from "../lib/methodology-profiles";
import { generateMemo, type MemoGenerationParams } from "../lib/memo-generator";
import { ESL_SERVICE_CATALOG, getServicesForContext, recommendServices } from "../lib/esl-services-expanded";
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

export default router;
