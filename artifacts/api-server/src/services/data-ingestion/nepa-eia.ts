import { db, ingestionRunsTable, regionalDataTable, rawDataCacheTable } from "@workspace/db";
import https from "https";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";

function fetchNEPAPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), 25000);
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        fetchNEPAPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        clearTimeout(timer);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString("utf-8")); });
      res.on("error", (err) => { clearTimeout(timer); reject(err); });
    });
    req.on("error", (err) => { clearTimeout(timer); reject(err); });
  });
}

const PIPELINE_NAME = "nepa-eia";
const SOURCE_KEY = "nepa-eia-jamaica";

const NEPA_BASE = "https://www.nepa.gov.jm";
const NEPA_EIA_URL = `${NEPA_BASE}/environmental-impact-assessments`;
const NEPA_DECISIONS_URL = `${NEPA_BASE}/index.php/authority-decisions`;
const NEPA_ENFORCEMENTS_URL = `${NEPA_BASE}/index.php/enforcements`;
const NEPA_CONSULTATIONS_URL = `${NEPA_BASE}/public-consultations`;
const NEPA_ARCHIVE_URL = "https://websitearchive2020.nepa.gov.jm/new/services_products/applications/eias/index.php";

const MAX_EIA_PAGES = 16;
const MAX_DECISION_PAGES = 10;
const PAGE_DELAY_MS = 800;

type AssessmentType =
  | "eia"
  | "eis"
  | "sea"
  | "aia"
  | "sia"
  | "tor"
  | "addendum"
  | "public_meeting"
  | "verbatim_minutes"
  | "permit_licence"
  | "technical_study"
  | "project_brief"
  | "unclassified";

interface NEPADocument {
  title: string;
  documentUrl: string;
  dateFolder?: string;
  year?: number;
  parish?: string;
  assessmentType?: AssessmentType;
  projectType?: string;
  category: "eia" | "decision" | "enforcement" | "consultation";
  source: "current" | "archive";
}

const PARISH_PATTERNS = [
  "Kingston", "St. Andrew", "St. Thomas", "Portland", "St. Mary",
  "St. Ann", "Trelawny", "St. James", "Hanover", "Westmoreland",
  "St. Elizabeth", "Manchester", "Clarendon", "St. Catherine",
];

const PROJECT_TYPE_KEYWORDS: Record<string, string[]> = {
  "housing": ["housing", "residential", "subdivision", "estate", "dwelling", "apartment", "rozelle"],
  "hotel_tourism": ["hotel", "resort", "tourism", "beach", "cruise", "pier", "marina", "sandal", "overwater", "paradise park"],
  "mining_quarry": ["quarry", "mining", "mine", "aggregate", "sand", "gravel", "bauxite", "limestone"],
  "infrastructure": ["road", "highway", "bridge", "water supply", "sewage", "sewerage", "drainage", "pipeline", "port"],
  "energy": ["solar", "wind", "power", "energy", "lng", "fuel", "gas", "petroleum", "refinery", "sugar factory"],
  "industrial": ["factory", "industrial", "manufacturing", "warehouse", "processing", "plant"],
  "commercial": ["commercial", "plaza", "mall", "market", "office"],
  "agriculture": ["farm", "agriculture", "irrigation", "aquaculture", "fisheries"],
  "waste": ["landfill", "waste", "recycling", "disposal", "transfer station", "incinerator", "hazardous waste"],
  "coastal": ["reclamation", "coastal", "groyne", "seawall", "beach nourishment", "dredging"],
};

function extractParish(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const parish of PARISH_PATTERNS) {
    if (lower.includes(parish.toLowerCase())) return parish;
  }
  return undefined;
}

function classifyProject(title: string): string | undefined {
  const lower = title.toLowerCase();
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return undefined;
}

function extractYearFromDateFolder(dateFolder: string): number | undefined {
  const match = dateFolder.match(/^(20\d{2})/);
  return match ? Number(match[1]) : undefined;
}

function extractYear(text: string): number | undefined {
  const matches = text.match(/\b(20\d{2}|19\d{2})\b/g);
  if (matches && matches.length > 0) {
    const years = matches.map(Number).filter(y => y >= 1990 && y <= new Date().getFullYear() + 1);
    return years.length > 0 ? Math.max(...years) : undefined;
  }
  return undefined;
}

function isAnnexOrSupplementary(title: string): boolean {
  const lower = title.toLowerCase();
  return /^annex\s/i.test(lower) || /^appendix\s/i.test(lower) || lower.includes("verbatim notes");
}

function classifyAssessmentType(title: string, url: string): AssessmentType {
  const t = (title + " " + url).toLowerCase().replace(/[-_]/g, " ");

  if (/\btor\b|terms of reference/i.test(t)) return "tor";
  if (/verbatim|veb min/i.test(t)) return "verbatim_minutes";
  if (/addendum|corrigend|amendment/i.test(t)) return "addendum";
  if (/public[\s]*(meeting|consultation|noti|present)|notice.*public|notification.*meeting|advisory.*stakeholder|stakeholder.*consultation|public noti|public meeting|meeting[\s]*report|meeting[\s]*notes|overall document public|attendance register|response to comment/i.test(t)) return "public_meeting";
  if (/\baia\b|archaeolog|cockpit country/i.test(t)) return "aia";
  if (/social impact assess|\bsia\b/i.test(t)) return "sia";
  if (/\bsea\b|strategic environmental assess/i.test(t)) return "sea";
  if (/\beis\b|environmental impact statement|eis report/i.test(t)) return "eis";
  if (/permit|licence|license|certificate of approval|compliance order/i.test(t)) return "permit_licence";
  if (/project[\s]*brief|screening|batching plant.*brief/i.test(t)) return "project_brief";
  if (/^annex|^appendix|noise assess|flora|fauna|air emission|heritage[\s]*survey|baseline|aermod|coral[\s]*reloc|change[\s]*matri|elevation|site[\s]*plan|geotechnical|hydrological|traffic impact|drainage|engineering[\s]*(report|geological)|preliminary[\s]*technical|geological[\s]*survey|monitoring|soil[\s]*report|sewage[\s]*treatment|resistivity|subdivision[\s]*plan|containment|lot[\s]*areas|hydrodynamic|assessment of currents|valuation assessment|rapid nrv|current.*study|wind.*study|wave.*study/i.test(t)) return "technical_study";
  if (/environmental impact assess|environmental[\s]*impact[\s]*asses|\beia\b|final[\s]*report.*eia|eia[\s]*report|wind.*environmental.*assessment/i.test(t)) return "eia";
  if (/project[\s]*description|project[\s]*document|project[\s]*summary|notification|notice\.pdf|public presentation|court battle/i.test(t)) return "project_brief";

  return "unclassified";
}

function extractPDFDocuments(html: string, category: NEPADocument["category"]): NEPADocument[] {
  const docs: NEPADocument[] = [];
  const linkPattern = /<a\s[^>]*href=["']([^"']*\.pdf[^"']*)["'][^>]*(?:title=["']([^"']*)["'])?[^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    const rawUrl = match[1];
    const titleAttr = match[2]?.trim();
    const linkText = match[3].trim();
    if (linkText.length < 3) continue;

    const url = rawUrl.startsWith("http") ? rawUrl : `${NEPA_BASE}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    const decodedUrl = decodeURIComponent(url);
    const dateMatch = decodedUrl.match(/files\/(20\d{2}-\d{2})\//);
    const dateFolder = dateMatch ? dateMatch[1] : undefined;

    const displayTitle = titleAttr || linkText;
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
    const context = html.substring(contextStart, contextEnd);

    const cleanTitle = displayTitle.replace(/\s+/g, " ").trim();
    docs.push({
      title: cleanTitle,
      documentUrl: url,
      dateFolder,
      year: (dateFolder ? extractYearFromDateFolder(dateFolder) : undefined) || extractYear(displayTitle) || extractYear(decodedUrl),
      parish: extractParish(displayTitle) || extractParish(decodedUrl) || extractParish(context),
      assessmentType: category === "eia" ? classifyAssessmentType(cleanTitle, decodedUrl) : undefined,
      projectType: classifyProject(displayTitle) || classifyProject(decodedUrl),
      category,
      source: "current",
    });
  }

  return docs;
}

function parseArchiveSiteHTML(html: string): NEPADocument[] {
  const docs: NEPADocument[] = [];
  const linkPattern = /<a\s[^>]*href=["']([^"']*(?:eia|EIA|\.pdf)[^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    const rawUrl = match[1];
    const linkText = match[2].trim();
    if (linkText.length < 5) continue;

    const url = rawUrl.startsWith("http") ? rawUrl : `https://websitearchive2020.nepa.gov.jm${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    const decodedUrl = decodeURIComponent(url);

    const cleanTitle = linkText.replace(/\s+/g, " ").trim();
    docs.push({
      title: cleanTitle,
      documentUrl: url,
      year: extractYear(decodedUrl) || extractYear(linkText),
      parish: extractParish(decodedUrl) || extractParish(linkText),
      assessmentType: classifyAssessmentType(cleanTitle, decodedUrl),
      projectType: classifyProject(linkText) || classifyProject(decodedUrl),
      category: "eia",
      source: "archive",
    });
  }

  return docs;
}

function deduplicateDocs(docs: NEPADocument[]): NEPADocument[] {
  const seen = new Map<string, NEPADocument>();
  for (const d of docs) {
    const key = d.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
    if (!seen.has(key) || d.source === "current") {
      seen.set(key, d);
    }
  }
  return Array.from(seen.values());
}

function groupEIAProjects(docs: NEPADocument[]): NEPADocument[] {
  const mainDocs = docs.filter(d => !isAnnexOrSupplementary(d.title));
  const annexes = docs.filter(d => isAnnexOrSupplementary(d.title));
  return [...mainDocs, ...annexes];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeRegulatoryAnalysis(allDocs: NEPADocument[]) {
  const eiaPageDocs = allDocs.filter(d => d.category === "eia");
  const decisionDocs = allDocs.filter(d => d.category === "decision");
  const enforcementDocs = allDocs.filter(d => d.category === "enforcement");
  const consultationDocs = allDocs.filter(d => d.category === "consultation");

  const assessmentTypeCounts: Record<string, number> = {};
  for (const d of eiaPageDocs) {
    const at = d.assessmentType || "unclassified";
    assessmentTypeCounts[at] = (assessmentTypeCounts[at] || 0) + 1;
  }

  const primaryAssessments = eiaPageDocs.filter(d =>
    d.assessmentType === "eia" || d.assessmentType === "eis" ||
    d.assessmentType === "sea" || d.assessmentType === "aia" ||
    d.assessmentType === "sia" || d.assessmentType === "unclassified"
  );

  const projectTypeCounts: Record<string, number> = {};
  const parishCounts: Record<string, number> = {};
  const yearCounts: Record<number, number> = {};

  for (const d of primaryAssessments) {
    if (d.projectType) projectTypeCounts[d.projectType] = (projectTypeCounts[d.projectType] || 0) + 1;
    if (d.parish) parishCounts[d.parish] = (parishCounts[d.parish] || 0) + 1;
    if (d.year) yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
  }

  const years = Object.keys(yearCounts).map(Number).sort();
  const yearSpan = years.length > 1 ? years[years.length - 1] - years[0] + 1 : 1;
  const avgAssessmentsPerYear = roundTo(primaryAssessments.length / Math.max(yearSpan, 1));

  const decisionYears: Record<number, number> = {};
  for (const d of decisionDocs) {
    if (d.year) decisionYears[d.year] = (decisionYears[d.year] || 0) + 1;
  }
  const decisionYearKeys = Object.keys(decisionYears).map(Number).sort();
  const decisionYearSpan = decisionYearKeys.length > 1 ? decisionYearKeys[decisionYearKeys.length - 1] - decisionYearKeys[0] + 1 : 1;
  const avgDecisionsPerYear = roundTo(decisionDocs.length / Math.max(decisionYearSpan, 1));

  let densityScore = 0;
  densityScore += Math.min(primaryAssessments.length * 0.5, 30);
  densityScore += Math.min(decisionDocs.length * 0.3, 30);
  const uniqueTypes = Object.keys(projectTypeCounts).length;
  densityScore += Math.min(uniqueTypes * 3, 15);
  if (projectTypeCounts["mining_quarry"]) densityScore += 5;
  if (projectTypeCounts["industrial"]) densityScore += 5;
  if (projectTypeCounts["waste"]) densityScore += 5;
  if (projectTypeCounts["energy"]) densityScore += 3;
  if (enforcementDocs.length > 0) densityScore += 7;

  return {
    assessmentTypeCounts,
    primaryAssessmentCount: primaryAssessments.length,
    eiaCount: assessmentTypeCounts["eia"] || 0,
    eisCount: assessmentTypeCounts["eis"] || 0,
    seaCount: assessmentTypeCounts["sea"] || 0,
    aiaCount: assessmentTypeCounts["aia"] || 0,
    siaCount: assessmentTypeCounts["sia"] || 0,
    torCount: assessmentTypeCounts["tor"] || 0,
    addendumCount: assessmentTypeCounts["addendum"] || 0,
    publicMeetingCount: assessmentTypeCounts["public_meeting"] || 0,
    verbatimMinutesCount: assessmentTypeCounts["verbatim_minutes"] || 0,
    technicalStudyCount: assessmentTypeCounts["technical_study"] || 0,
    projectBriefCount: assessmentTypeCounts["project_brief"] || 0,
    permitCount: assessmentTypeCounts["permit_licence"] || 0,
    eiaPageTotalDocs: eiaPageDocs.length,
    decisionCount: decisionDocs.length,
    enforcementCount: enforcementDocs.length,
    consultationCount: consultationDocs.length,
    totalDocuments: allDocs.length,
    projectTypeCounts,
    parishCounts,
    yearCounts,
    avgAssessmentsPerYear,
    avgDecisionsPerYear,
    decisionYearRange: decisionYearKeys.length > 0 ? `${decisionYearKeys[0]}-${decisionYearKeys[decisionYearKeys.length - 1]}` : "unknown",
    regulatoryDensityScore: roundTo(clamp(densityScore, 0, 100)),
  };
}

export const nepaEiaAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting NEPA regulatory intelligence ingestion for Jamaica");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    const sourceStatus = { eia: false, decisions: false, enforcements: false, consultations: false, archive: false };

    try {
      let allDocs: NEPADocument[] = [];

      try {
        log.info(PIPELINE_NAME, `Fetching NEPA EIA pages (up to ${MAX_EIA_PAGES} pages)...`);
        let totalEIADocs = 0;
        for (let page = 0; page < MAX_EIA_PAGES; page++) {
          try {
            const url = page === 0 ? NEPA_EIA_URL : `${NEPA_EIA_URL}?page=${page}`;
            const html = await fetchNEPAPage(url);
            const docs = extractPDFDocuments(html, "eia");
            if (docs.length === 0) break;
            allDocs.push(...docs);
            totalEIADocs += docs.length;
            if (page < MAX_EIA_PAGES - 1) await delay(PAGE_DELAY_MS);
          } catch {
            log.warn(PIPELINE_NAME, `Failed to fetch EIA page ${page}`);
            break;
          }
        }
        sourceStatus.eia = totalEIADocs > 0;
        const mainCount = allDocs.filter(d => d.category === "eia" && !isAnnexOrSupplementary(d.title)).length;
        const annexCount = allDocs.filter(d => d.category === "eia" && isAnnexOrSupplementary(d.title)).length;
        log.info(PIPELINE_NAME, `EIA pages: ${totalEIADocs} total documents (${mainCount} main projects, ${annexCount} annexes)`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch EIA pages: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        log.info(PIPELINE_NAME, `Fetching Authority Decisions (up to ${MAX_DECISION_PAGES} pages)...`);
        let totalDecisions = 0;
        for (let page = 0; page < MAX_DECISION_PAGES; page++) {
          try {
            const url = page === 0 ? NEPA_DECISIONS_URL : `${NEPA_DECISIONS_URL}?page=${page}`;
            const html = await fetchNEPAPage(url);
            const docs = extractPDFDocuments(html, "decision");
            if (docs.length === 0) break;
            allDocs.push(...docs);
            totalDecisions += docs.length;
            if (page < MAX_DECISION_PAGES - 1) await delay(PAGE_DELAY_MS);
          } catch {
            log.warn(PIPELINE_NAME, `Failed to fetch decisions page ${page}`);
            break;
          }
        }
        sourceStatus.decisions = totalDecisions > 0;
        log.info(PIPELINE_NAME, `Authority Decisions: ${totalDecisions} board decision documents`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch Authority Decisions: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        log.info(PIPELINE_NAME, "Fetching Enforcements page...");
        const html = await fetchNEPAPage(NEPA_ENFORCEMENTS_URL);
        const docs = extractPDFDocuments(html, "enforcement");
        allDocs.push(...docs);
        sourceStatus.enforcements = true;
        log.info(PIPELINE_NAME, `Enforcements: ${docs.length} documents`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch Enforcements: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        log.info(PIPELINE_NAME, "Fetching Public Consultations page...");
        const html = await fetchNEPAPage(NEPA_CONSULTATIONS_URL);
        const docs = extractPDFDocuments(html, "consultation");
        allDocs.push(...docs);
        sourceStatus.consultations = true;
        log.info(PIPELINE_NAME, `Public Consultations: ${docs.length} documents`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch Public Consultations: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        log.info(PIPELINE_NAME, "Fetching NEPA archive site...");
        const html = await fetchNEPAPage(NEPA_ARCHIVE_URL);
        const docs = parseArchiveSiteHTML(html);
        allDocs.push(...docs);
        sourceStatus.archive = true;
        log.info(PIPELINE_NAME, `Archive: ${docs.length} documents`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch archive: ${err instanceof Error ? err.message : String(err)}`);
      }

      allDocs = deduplicateDocs(allDocs);
      recordsRead = allDocs.length;

      const anySource = Object.values(sourceStatus).some(v => v);
      if (!anySource) {
        throw new Error("Failed to fetch any NEPA data from any source");
      }

      log.info(PIPELINE_NAME, `Total unique documents: ${allDocs.length} from ${Object.entries(sourceStatus).filter(([,v]) => v).map(([k]) => k).join(", ")}`);

      const analysis = computeRegulatoryAnalysis(allDocs);

      const now = new Date();
      const jr = (dt: string, v: number, u: string) => ({ country: "Jamaica", region: "Caribbean", datasetType: dt, value: v, unit: u, timestamp: now });
      const dataRecords = [
        jr("NEPA EIA Count", analysis.eiaCount, "count"),
        jr("NEPA EIS Count", analysis.eisCount, "count"),
        jr("NEPA SEA Count", analysis.seaCount, "count"),
        jr("NEPA AIA Count", analysis.aiaCount, "count"),
        jr("NEPA SIA Count", analysis.siaCount, "count"),
        jr("NEPA Primary Assessment Count", analysis.primaryAssessmentCount, "count"),
        jr("NEPA TOR Count", analysis.torCount, "count"),
        jr("NEPA Addendum Count", analysis.addendumCount, "count"),
        jr("NEPA Public Meeting Record Count", analysis.publicMeetingCount, "count"),
        jr("NEPA Verbatim Minutes Count", analysis.verbatimMinutesCount, "count"),
        jr("NEPA Technical Study Count", analysis.technicalStudyCount, "count"),
        jr("NEPA Project Brief Count", analysis.projectBriefCount, "count"),
        jr("NEPA Permit/Licence Count", analysis.permitCount, "count"),
        jr("NEPA EIA Page Total Documents", analysis.eiaPageTotalDocs, "count"),
        jr("NEPA Board Decision Count", analysis.decisionCount, "count"),
        jr("NEPA Enforcement Count", analysis.enforcementCount, "count"),
        jr("NEPA Public Consultation Count", analysis.consultationCount, "count"),
        jr("NEPA Total Regulatory Documents", analysis.totalDocuments, "count"),
        jr("NEPA Regulatory Density Score", analysis.regulatoryDensityScore, "score"),
        jr("NEPA Avg Assessments Per Year", analysis.avgAssessmentsPerYear, "per_year"),
        jr("NEPA Avg Board Decisions Per Year", analysis.avgDecisionsPerYear, "per_year"),
      ];

      for (const [type, count] of Object.entries(analysis.projectTypeCounts)) {
        dataRecords.push({
          country: "Jamaica", region: "Caribbean",
          datasetType: `NEPA EIA Type: ${type}`,
          value: count, unit: "count", timestamp: new Date(),
        });
      }

      for (const [parish, count] of Object.entries(analysis.parishCounts)) {
        dataRecords.push({
          country: "Jamaica", region: "Caribbean",
          datasetType: `NEPA EIA Parish: ${parish}`,
          value: count, unit: "count", timestamp: new Date(),
        });
      }

      if (dataRecords.length > 0) {
        await db.insert(regionalDataTable).values(dataRecords);
        recordsWritten = dataRecords.length;
        countriesAffected.push("Jamaica");
      }

      await db.insert(rawDataCacheTable).values({
        sourceKey: SOURCE_KEY,
        sourceUrl: NEPA_EIA_URL,
        payloadJson: JSON.stringify({
          documents: allDocs.map(d => ({
            title: d.title,
            category: d.category,
            assessmentType: d.assessmentType,
            parish: d.parish,
            projectType: d.projectType,
            year: d.year,
            dateFolder: d.dateFolder,
            source: d.source,
          })),
          analysis,
          sourceStatus,
          fetchedAt: new Date().toISOString(),
        }),
        statusCode: 200,
        notes: "nepa-regulatory-intelligence-full",
      });

      const confidence = CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION;

      await upsertFreshness({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        status: "success",
        confidence,
        recordsLoaded: recordsRead,
      });

      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME,
        status: "success",
        startedAt,
        completedAt: new Date(),
        recordsRead,
        recordsWritten,
      });

      log.success(PIPELINE_NAME, `Completed: ${analysis.totalDocuments} documents, ${recordsWritten} data points`, {
        assessmentTypes: analysis.assessmentTypeCounts,
        eia: analysis.eiaCount,
        eis: analysis.eisCount,
        sea: analysis.seaCount,
        aia: analysis.aiaCount,
        sia: analysis.siaCount,
        primaryAssessments: analysis.primaryAssessmentCount,
        decisions: analysis.decisionCount,
        enforcements: analysis.enforcementCount,
        consultations: analysis.consultationCount,
        decisionYearRange: analysis.decisionYearRange,
        projectTypes: Object.keys(analysis.projectTypeCounts).length,
        parishes: Object.keys(analysis.parishCounts).length,
        regulatoryDensityScore: analysis.regulatoryDensityScore,
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected,
        confidence,
        summary: {
          assessmentTypes: analysis.assessmentTypeCounts,
          primaryAssessments: analysis.primaryAssessmentCount,
          eia: analysis.eiaCount,
          eis: analysis.eisCount,
          sea: analysis.seaCount,
          aia: analysis.aiaCount,
          sia: analysis.siaCount,
          boardDecisions: analysis.decisionCount,
          enforcements: analysis.enforcementCount,
          consultations: analysis.consultationCount,
          totalDocuments: analysis.totalDocuments,
          projectTypes: analysis.projectTypeCounts,
          parishes: analysis.parishCounts,
          decisionYearRange: analysis.decisionYearRange,
          avgAssessmentsPerYear: analysis.avgAssessmentsPerYear,
          avgDecisionsPerYear: analysis.avgDecisionsPerYear,
          regulatoryDensityScore: analysis.regulatoryDensityScore,
          sourceStatus,
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      log.error(PIPELINE_NAME, "Pipeline failed", err);

      await upsertFreshness({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        status: "failed",
        confidence: 0,
        recordsLoaded: 0,
        errorMessage: error,
      });

      await db.insert(ingestionRunsTable).values({
        pipelineName: PIPELINE_NAME,
        status: "failed",
        startedAt,
        completedAt: new Date(),
        recordsRead: 0,
        recordsWritten: 0,
        errorJson: JSON.stringify({ message: error }),
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "failed",
        recordsRead: 0,
        recordsWritten: 0,
        countriesAffected: [],
        confidence: 0,
        summary: {},
        error,
      };
    }
  },
};
