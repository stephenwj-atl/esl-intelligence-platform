import { db, projectsTable, calibrationMemosTable, validationCasesTable, overrideDecisionsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { getAllProfiles, getProfileByKey, type MethodologyProfileDef } from "./methodology-profiles";
import { SECTOR_FAMILIES, type SectorFamilyKey } from "./sector-families";

export type MemoType =
  | "weighting_defense"
  | "calibration_review"
  | "portfolio_risk_methodology"
  | "sector_family_scoring"
  | "instrument_logic"
  | "grant_blended_readiness";

interface MemoSection {
  heading: string;
  content: string;
}

interface MemoContent {
  title: string;
  memoType: MemoType;
  generatedAt: string;
  purpose: string;
  scope: string;
  sections: MemoSection[];
  recommendations: string[];
  confidenceStatement: string;
  validationNeeds: string[];
}

export interface MemoGenerationParams {
  memoType: MemoType;
  profileKey?: string;
  sectorFamily?: SectorFamilyKey;
  country?: string;
  funder?: string;
}

export async function generateMemo(params: MemoGenerationParams): Promise<MemoContent> {
  switch (params.memoType) {
    case "weighting_defense": return generateWeightingDefense(params);
    case "calibration_review": return generateCalibrationReview(params);
    case "portfolio_risk_methodology": return generatePortfolioMethodology(params);
    case "sector_family_scoring": return generateSectorFamilyScoring(params);
    case "instrument_logic": return generateInstrumentLogic(params);
    case "grant_blended_readiness": return generateGrantBlendedReadiness(params);
  }
}

async function generateWeightingDefense(params: MemoGenerationParams): Promise<MemoContent> {
  const profileKey = params.profileKey ?? "PERS_DEFAULT_V1";
  const profile = getProfileByKey(profileKey);
  if (!profile) throw new Error(`Profile ${profileKey} not found`);

  const projects = await db.select().from(projectsTable);
  const familyProjects = projects.filter(p => {
    if (params.sectorFamily && p.sectorFamily !== params.sectorFamily) return false;
    return true;
  });

  const overrides = await db.select({ cnt: count() }).from(overrideDecisionsTable);
  const overrideCount = overrides[0]?.cnt ?? 0;
  const validations = await db.select({ cnt: count() }).from(validationCasesTable);
  const validationCount = validations[0]?.cnt ?? 0;

  const avgPers = familyProjects.length > 0
    ? familyProjects.reduce((s, p) => s + (p.persScore ?? 0), 0) / familyProjects.length
    : 0;

  const sections: MemoSection[] = [
    {
      heading: "Methodology Version and Profile",
      content: `Profile: ${profile.name} (${profile.profileKey})\nVersion: ${profile.version}\nSector Family: ${profile.sectorFamily}\nCalibration Status: provisional\n\nThis profile is currently based on expert judgment and framework-derived logic, not empirical calibration against observed project outcomes.`,
    },
    {
      heading: "Current Weights",
      content: `Country Context: ${(profile.weights.countryContext * 100).toFixed(0)}%\nProject Overlay: ${(profile.weights.projectOverlay * 100).toFixed(0)}%\nSensitivity: ${(profile.weights.sensitivity * 100).toFixed(0)}%\nIntervention Risk: ${(profile.weights.interventionRisk * 100).toFixed(0)}%\nOutcome Risk Modifier: ${(profile.weights.outcomeRiskModifier * 100).toFixed(0)}%\nInstrument Structure Modifier: ${(profile.weights.instrumentStructureModifier * 100).toFixed(0)}%\nConfidence Influence: ${(profile.weights.confidenceInfluence * 100).toFixed(0)}%`,
    },
    {
      heading: "Rationale",
      content: profile.rationale,
    },
    {
      heading: "Assumptions",
      content: profile.assumptions,
    },
    {
      heading: "Known Limitations",
      content: profile.knownLimitations,
    },
    {
      heading: "Portfolio Behavior",
      content: `Projects assessed under this profile family: ${familyProjects.length}\nAverage PERS: ${avgPers.toFixed(1)}\nOverride decisions recorded: ${overrideCount}\nValidation cases recorded: ${validationCount}\n\n${familyProjects.length < 5 ? "WARNING: Sample size is too small for meaningful behavioral analysis. At least 10-15 projects are needed to detect systematic scoring bias." : `Sample size of ${familyProjects.length} provides initial behavioral data but is insufficient for statistical validation.`}`,
    },
  ];

  return {
    title: `Weighting Defense Memo — ${profile.name}`,
    memoType: "weighting_defense",
    generatedAt: new Date().toISOString(),
    purpose: `Document and defend the current weighting choices for the ${profile.name} methodology profile. This memo supports internal methodology review and external stakeholder communication.`,
    scope: `Profile ${profile.profileKey} applied to ${profile.sectorFamily} sector family projects.`,
    sections,
    recommendations: [
      "Conduct sensitivity analysis across weight variations (±5% per dimension) to test score stability.",
      familyProjects.length < 10 ? "Priority: Add more projects to this family to enable behavioral analysis." : "Review score distribution for clustering or threshold effects.",
      "Seek external review from DFI risk methodology practitioners to validate weight rationale.",
      "Plan annual recalibration review against observed project outcomes.",
    ],
    confidenceStatement: `Validation confidence: PROVISIONAL. Current weights are expert-derived and framework-aligned but have not been empirically calibrated against observed outcomes. ${validationCount} validation cases and ${overrideCount} override decisions are available for review.`,
    validationNeeds: [
      "Empirical calibration against 20+ observed project outcomes per family",
      "Sensitivity testing across weight variations",
      "Cross-family comparison to ensure scoring consistency",
      "Peer review by independent risk methodology specialist",
    ],
  };
}

async function generateCalibrationReview(params: MemoGenerationParams): Promise<MemoContent> {
  const profiles = getAllProfiles();
  const projects = await db.select().from(projectsTable);
  const validations = await db.select().from(validationCasesTable);
  const overrides = await db.select().from(overrideDecisionsTable);

  const familyStats: Record<string, { count: number; avgPers: number; decisions: Record<string, number> }> = {};
  for (const p of projects) {
    const fam = p.sectorFamily ?? "unknown";
    if (!familyStats[fam]) familyStats[fam] = { count: 0, avgPers: 0, decisions: {} };
    familyStats[fam].count++;
    familyStats[fam].avgPers += p.persScore ?? 0;
    const dec = p.decisionOutcome;
    familyStats[fam].decisions[dec] = (familyStats[fam].decisions[dec] ?? 0) + 1;
  }
  for (const fam of Object.values(familyStats)) {
    fam.avgPers = fam.count > 0 ? fam.avgPers / fam.count : 0;
  }

  const sections: MemoSection[] = [
    {
      heading: "Portfolio Summary",
      content: `Total projects: ${projects.length}\nTotal validation cases: ${validations.length}\nTotal override decisions: ${overrides.length}\nActive profiles: ${profiles.length}`,
    },
    {
      heading: "Family Distribution and Scoring Behavior",
      content: Object.entries(familyStats)
        .map(([fam, s]) => `${fam}: ${s.count} projects, avg PERS ${s.avgPers.toFixed(1)}, decisions: ${JSON.stringify(s.decisions)}`)
        .join("\n"),
    },
    {
      heading: "Detected Issues",
      content: detectCalibrationIssues(familyStats, validations, overrides),
    },
  ];

  return {
    title: "Calibration Review Memo",
    memoType: "calibration_review",
    generatedAt: new Date().toISOString(),
    purpose: "Review current model calibration across all methodology profiles and identify areas requiring weight adjustment or additional validation.",
    scope: "All active methodology profiles and portfolio projects.",
    sections,
    recommendations: detectRecommendations(familyStats, validations.length, overrides.length),
    confidenceStatement: `Model calibration is PROVISIONAL across all families. ${validations.length > 0 ? `${validations.length} validation cases available for review.` : "No validation cases recorded yet — empirical calibration cannot begin until observed outcomes are collected."}`,
    validationNeeds: [
      "Collect post-implementation outcome data for at least 5 projects per family",
      "Record analyst override decisions with rationale for model improvement feedback",
      "Run cross-family sensitivity analysis quarterly",
    ],
  };
}

async function generatePortfolioMethodology(params: MemoGenerationParams): Promise<MemoContent> {
  const projects = await db.select().from(projectsTable);
  const scored = projects.filter(p => p.persScore != null);

  const byDecision = { PROCEED: 0, CONDITION: 0, DECLINE: 0 };
  const byCapital: Record<string, number> = {};
  for (const p of scored) {
    const d = p.decisionOutcome as keyof typeof byDecision;
    if (d in byDecision) byDecision[d]++;
    const c = p.capitalMode ?? "Unknown";
    byCapital[c] = (byCapital[c] ?? 0) + 1;
  }

  return {
    title: "Portfolio Risk Methodology Memo",
    memoType: "portfolio_risk_methodology",
    generatedAt: new Date().toISOString(),
    purpose: "Document the risk methodology applied to the current portfolio and summarize aggregate risk behavior.",
    scope: `Full portfolio: ${projects.length} projects, ${scored.length} PERS-scored.`,
    sections: [
      { heading: "Portfolio Composition", content: `Total: ${projects.length}\nPERS Scored: ${scored.length}\nProceed: ${byDecision.PROCEED}\nCondition: ${byDecision.CONDITION}\nDecline: ${byDecision.DECLINE}` },
      { heading: "Capital Mode Distribution", content: Object.entries(byCapital).map(([k, v]) => `${k}: ${v}`).join("\n") },
      { heading: "Methodology Framework", content: "PERS (Project Environmental Risk Score) uses a layered architecture: Country Context → Project Exposure → Sector Sensitivity → Intervention Delivery → Instrument Structure → Outcome Delivery. Family-specific methodology profiles adjust weights by sector. Instrument-specific logic provides distinct decision signals for loans, grants, and blended finance." },
    ],
    recommendations: [
      scored.length < 20 ? "Portfolio size insufficient for statistical risk aggregation. Interpret portfolio metrics with caution." : "Portfolio size supports initial aggregate risk analysis.",
    ],
    confidenceStatement: "Portfolio-level methodology is consistently applied. Individual project scores are provisional pending validation.",
    validationNeeds: ["Annual portfolio recalibration review", "Stress testing under climate scenario changes"],
  };
}

async function generateSectorFamilyScoring(params: MemoGenerationParams): Promise<MemoContent> {
  const family = params.sectorFamily;
  const familyDef = SECTOR_FAMILIES.find(f => f.key === family);
  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.sectorFamily === family);

  return {
    title: `Sector Family Scoring Memo — ${familyDef?.name ?? family ?? "All Families"}`,
    memoType: "sector_family_scoring",
    generatedAt: new Date().toISOString(),
    purpose: `Document the scoring methodology for the ${familyDef?.name ?? "selected"} sector family and justify weight differentiation from the universal default.`,
    scope: `Sector family: ${family ?? "all"}`,
    sections: [
      { heading: "Family Definition", content: familyDef ? `${familyDef.name}: ${familyDef.description}\nProject types: ${familyDef.projectTypes.map(t => t.type).join(", ")}` : "All families" },
      { heading: "Profile Configuration", content: profile ? `Profile: ${profile.profileKey}\nWeights: CC=${(profile.weights.countryContext * 100).toFixed(0)}%, PO=${(profile.weights.projectOverlay * 100).toFixed(0)}%, SE=${(profile.weights.sensitivity * 100).toFixed(0)}%, IR=${(profile.weights.interventionRisk * 100).toFixed(0)}%, OR=${(profile.weights.outcomeRiskModifier * 100).toFixed(0)}%` : "Using universal default profile" },
      { heading: "Differentiation Rationale", content: profile?.rationale ?? "No family-specific profile configured." },
    ],
    recommendations: ["Review family-specific project types for completeness", "Validate weight choices against sector literature"],
    confidenceStatement: "Family scoring profiles are expert-derived and provisional.",
    validationNeeds: ["Sector-specific outcome data for calibration", "Peer review by sector specialists"],
  };
}

async function generateInstrumentLogic(params: MemoGenerationParams): Promise<MemoContent> {
  return {
    title: "Instrument Logic Memo",
    memoType: "instrument_logic",
    generatedAt: new Date().toISOString(),
    purpose: "Document how instrument-specific decision logic differs across loan, grant, blended, and other financing instruments.",
    scope: "All supported instruments: LOAN, GRANT, BLENDED, GUARANTEE, TECHNICAL_ASSISTANCE, PROGRAMMATIC, EMERGENCY.",
    sections: [
      { heading: "LOAN Logic", content: "Emphasizes downside protection, predictability, covenant compliance. Decision signals: PROCEED (<40 PERS), CONDITION (40-70), DECLINE (>70). Pricing adjusts for risk premium and insurance." },
      { heading: "GRANT Logic", content: "Emphasizes outcome delivery probability, implementation capacity, milestone readiness. Supports nuanced signals: PROCEED, PROCEED_WITH_CONTROLS, RESEQUENCE, NARROW_SCOPE, DEFER_PENDING_BASELINE, DO_NOT_FUND. High-risk grants are NOT automatically declined — risk is the rationale for concessional capital." },
      { heading: "BLENDED Logic", content: "Evaluates grant absorption role, transition pathway, concessionality justification. Grant component absorbs early-stage risk; debt enters after risk reduction milestones." },
      { heading: "GUARANTEE Logic", content: "Evaluates guarantee exposure, call probability, coverage limits. Risk premium adjustments for partial coverage." },
      { heading: "TECHNICAL_ASSISTANCE Logic", content: "Evaluates institutional absorption capacity, deliverable feasibility, knowledge transfer sustainability." },
      { heading: "PROGRAMMATIC Logic", content: "Evaluates multi-site complexity, results chain coherence, implementation entity capacity." },
      { heading: "EMERGENCY Logic", content: "Reduces confidence penalties. Urgency outweighs data completeness. Build-back-better compliance mandatory post-deployment." },
    ],
    recommendations: [
      "Validate grant decision logic against actual grant committee outcomes",
      "Test blended transition trigger thresholds against portfolio cases",
    ],
    confidenceStatement: "Instrument logic is expert-derived. Grant and blended logic has not been validated against actual DFI decision patterns.",
    validationNeeds: ["Compare system recommendations against actual funder decisions for 10+ cases", "Workshop with DFI portfolio managers"],
  };
}

async function generateGrantBlendedReadiness(params: MemoGenerationParams): Promise<MemoContent> {
  const projects = await db.select().from(projectsTable);
  const grants = projects.filter(p => p.instrumentType === "GRANT" || p.capitalMode === "Grant");
  const blended = projects.filter(p => p.instrumentType === "BLENDED" || p.capitalMode === "Blended");

  return {
    title: "Grant & Blended Readiness Memo",
    memoType: "grant_blended_readiness",
    generatedAt: new Date().toISOString(),
    purpose: "Assess portfolio readiness for grant and blended finance deployment, including disbursement readiness and transition pathway status.",
    scope: `${grants.length} grant projects, ${blended.length} blended projects.`,
    sections: [
      { heading: "Grant Portfolio", content: `Count: ${grants.length}\nAvg PERS: ${grants.length > 0 ? (grants.reduce((s, p) => s + (p.persScore ?? 0), 0) / grants.length).toFixed(1) : "N/A"}` },
      { heading: "Blended Portfolio", content: `Count: ${blended.length}\nAvg PERS: ${blended.length > 0 ? (blended.reduce((s, p) => s + (p.persScore ?? 0), 0) / blended.length).toFixed(1) : "N/A"}` },
      { heading: "Readiness Assessment", content: "Disbursement readiness and transition readiness are computed per project. See individual project assessments for detailed milestone status." },
    ],
    recommendations: [
      grants.length === 0 ? "No grant projects in portfolio — add grant-mode projects to test grant logic." : "Review grant projects for outcome framework completeness.",
      blended.length === 0 ? "No blended projects — add blended-mode projects with transition pathways." : "Validate transition triggers for blended projects.",
    ],
    confidenceStatement: "Readiness assessment is based on available data. Disbursement milestone tracking requires manual input.",
    validationNeeds: ["Field verification of disbursement readiness assessments", "Transition pathway milestone tracking"],
  };
}

function detectCalibrationIssues(
  familyStats: Record<string, { count: number; avgPers: number; decisions: Record<string, number> }>,
  validations: unknown[],
  overrides: unknown[],
): string {
  const issues: string[] = [];

  for (const [fam, stats] of Object.entries(familyStats)) {
    if (stats.count < 3) issues.push(`${fam}: Only ${stats.count} projects — insufficient for calibration.`);
    if (stats.avgPers > 65) issues.push(`${fam}: Average PERS ${stats.avgPers.toFixed(1)} — may indicate systematic overscoring.`);
    if (stats.avgPers < 25) issues.push(`${fam}: Average PERS ${stats.avgPers.toFixed(1)} — may indicate systematic underscoring.`);
    const declineRate = (stats.decisions["DECLINE"] ?? 0) / stats.count;
    if (declineRate > 0.5) issues.push(`${fam}: ${(declineRate * 100).toFixed(0)}% decline rate — unusually high, may indicate calibration issue.`);
  }

  if (validations.length === 0) issues.push("No validation cases recorded. Empirical calibration is not possible without observed outcome data.");
  if (overrides.length === 0) issues.push("No override decisions recorded. Override patterns provide important model feedback.");

  return issues.length > 0 ? issues.join("\n") : "No calibration issues detected with current data.";
}

function detectRecommendations(
  familyStats: Record<string, { count: number; avgPers: number }>,
  validationCount: number,
  overrideCount: number,
): string[] {
  const recs: string[] = [];

  const totalProjects = Object.values(familyStats).reduce((s, f) => s + f.count, 0);
  if (totalProjects < 20) recs.push("Increase portfolio to 20+ projects for meaningful calibration analysis.");

  if (validationCount === 0) recs.push("Priority: Begin recording validation cases with observed vs. predicted risk/outcomes.");
  if (overrideCount === 0) recs.push("Implement override governance to capture analyst disagreements with model outputs.");

  const emptyFamilies = Object.entries(familyStats).filter(([, s]) => s.count < 2);
  if (emptyFamilies.length > 0) {
    recs.push(`Add projects to underrepresented families: ${emptyFamilies.map(([f]) => f).join(", ")}.`);
  }

  return recs;
}
