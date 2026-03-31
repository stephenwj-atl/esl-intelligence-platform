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

const NEPA_EIA_URL = "https://www.nepa.gov.jm/environmental-impact-assessments";
const NEPA_ARCHIVE_URL = "https://websitearchive2020.nepa.gov.jm/new/services_products/applications/eias/index.php";

interface NEPAProject {
  title: string;
  parish?: string;
  projectType?: string;
  documentUrl?: string;
  source: "current" | "archive";
  year?: number;
}

const PARISH_PATTERNS = [
  "Kingston", "St. Andrew", "St. Thomas", "Portland", "St. Mary",
  "St. Ann", "Trelawny", "St. James", "Hanover", "Westmoreland",
  "St. Elizabeth", "Manchester", "Clarendon", "St. Catherine",
];

const PROJECT_TYPE_KEYWORDS: Record<string, string[]> = {
  "housing": ["housing", "residential", "subdivision", "estate", "dwelling", "apartment"],
  "hotel_tourism": ["hotel", "resort", "tourism", "beach", "cruise", "pier", "marina"],
  "mining_quarry": ["quarry", "mining", "mine", "aggregate", "sand", "gravel", "bauxite", "limestone"],
  "infrastructure": ["road", "highway", "bridge", "water supply", "sewage", "sewerage", "drainage", "pipeline", "port"],
  "energy": ["solar", "wind", "power", "energy", "lng", "fuel", "gas", "petroleum", "refinery"],
  "industrial": ["factory", "industrial", "manufacturing", "warehouse", "processing", "plant"],
  "commercial": ["commercial", "plaza", "mall", "market", "office"],
  "agriculture": ["farm", "agriculture", "irrigation", "aquaculture", "fisheries"],
  "waste": ["landfill", "waste", "recycling", "disposal", "transfer station", "incinerator"],
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

function extractYear(text: string): number | undefined {
  const matches = text.match(/\b(20\d{2}|19\d{2})\b/g);
  if (matches && matches.length > 0) {
    const years = matches.map(Number).filter(y => y >= 1990 && y <= new Date().getFullYear() + 1);
    return years.length > 0 ? Math.max(...years) : undefined;
  }
  return undefined;
}

function parseCurrentSiteHTML(html: string): NEPAProject[] {
  const projects: NEPAProject[] = [];

  const linkPattern = /<a\s[^>]*href=["']([^"']*(?:\.pdf|\.doc|\.docx)[^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const [, url, linkText] = match;
    const text = linkText.trim();
    if (text.length < 5) continue;

    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
    const context = html.substring(contextStart, contextEnd);

    projects.push({
      title: text.replace(/\s+/g, " ").trim(),
      parish: extractParish(context),
      projectType: classifyProject(text) || classifyProject(context),
      documentUrl: url.startsWith("http") ? url : `https://www.nepa.gov.jm${url.startsWith("/") ? "" : "/"}${url}`,
      source: "current",
      year: extractYear(context) || extractYear(text),
    });
  }

  const headingPattern = /<(?:h[1-6]|strong|b|p|li|td|div)[^>]*>([^<]{10,200})<\/(?:h[1-6]|strong|b|p|li|td|div)>/gi;
  while ((match = headingPattern.exec(html)) !== null) {
    const text = match[1].replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const lowerText = text.toLowerCase();

    if (lowerText.includes("eia") || lowerText.includes("environmental impact") || lowerText.includes("assessment")) {
      if (text.length > 15 && !projects.some(p => p.title.includes(text.substring(0, 20)))) {
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
        const context = html.substring(contextStart, contextEnd);

        projects.push({
          title: text,
          parish: extractParish(context),
          projectType: classifyProject(text) || classifyProject(context),
          source: "current",
          year: extractYear(context) || extractYear(text),
        });
      }
    }
  }

  return projects;
}

function parseArchiveSiteHTML(html: string): NEPAProject[] {
  const projects: NEPAProject[] = [];

  const linkPattern = /<a\s[^>]*href=["']([^"']*(?:eia|EIA)[^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const [, url, linkText] = match;
    const text = linkText.trim();
    if (text.length < 5) continue;

    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
    const context = html.substring(contextStart, contextEnd);

    const parish = extractParish(url) || extractParish(context);

    projects.push({
      title: text.replace(/\s+/g, " ").trim(),
      parish,
      projectType: classifyProject(text) || classifyProject(context),
      documentUrl: url.startsWith("http") ? url : `https://websitearchive2020.nepa.gov.jm${url.startsWith("/") ? "" : "/"}${url}`,
      source: "archive",
      year: extractYear(context) || extractYear(text) || extractYear(url),
    });
  }

  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  while ((match = rowPattern.exec(html)) !== null) {
    const row = match[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
      m[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cells.length >= 2) {
      const combined = cells.join(" ");
      if (combined.length > 10 && !projects.some(p => p.title === cells[0])) {
        projects.push({
          title: cells[0] || combined.substring(0, 100),
          parish: extractParish(combined),
          projectType: classifyProject(combined),
          source: "archive",
          year: extractYear(combined),
        });
      }
    }
  }

  return projects;
}

function deduplicateProjects(projects: NEPAProject[]): NEPAProject[] {
  const seen = new Map<string, NEPAProject>();
  for (const p of projects) {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40);
    if (!seen.has(key) || p.source === "current") {
      seen.set(key, p);
    }
  }
  return Array.from(seen.values());
}

function computeRegulatoryActivityScore(projects: NEPAProject[]): {
  eiaCount: number;
  projectTypeCounts: Record<string, number>;
  parishCounts: Record<string, number>;
  regulatoryDensityScore: number;
  avgProjectsPerYear: number;
} {
  const projectTypeCounts: Record<string, number> = {};
  const parishCounts: Record<string, number> = {};
  const yearSet = new Set<number>();

  for (const p of projects) {
    if (p.projectType) projectTypeCounts[p.projectType] = (projectTypeCounts[p.projectType] || 0) + 1;
    if (p.parish) parishCounts[p.parish] = (parishCounts[p.parish] || 0) + 1;
    if (p.year) yearSet.add(p.year);
  }

  const yearSpan = yearSet.size > 1
    ? Math.max(...yearSet) - Math.min(...yearSet) + 1
    : 1;
  const avgProjectsPerYear = roundTo(projects.length / yearSpan);

  let densityScore = Math.min(projects.length * 2, 50);
  const uniqueTypes = Object.keys(projectTypeCounts).length;
  densityScore += Math.min(uniqueTypes * 5, 25);
  if (projectTypeCounts["mining_quarry"]) densityScore += 10;
  if (projectTypeCounts["industrial"]) densityScore += 8;
  if (projectTypeCounts["waste"]) densityScore += 8;
  if (projectTypeCounts["energy"]) densityScore += 5;

  return {
    eiaCount: projects.length,
    projectTypeCounts,
    parishCounts,
    regulatoryDensityScore: roundTo(clamp(densityScore, 0, 100)),
    avgProjectsPerYear,
  };
}

export const nepaEiaAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting NEPA EIA ingestion for Jamaica");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    let fetchedCurrent = false;
    let fetchedArchive = false;

    try {
      let allProjects: NEPAProject[] = [];

      try {
        log.info(PIPELINE_NAME, "Fetching current NEPA EIA page...");
        const currentHTML = await fetchNEPAPage(NEPA_EIA_URL);
        log.info(PIPELINE_NAME, `Fetched ${currentHTML.length} bytes from current NEPA site`);
        const currentProjects = parseCurrentSiteHTML(currentHTML);
        allProjects.push(...currentProjects);
        fetchedCurrent = true;
        log.info(PIPELINE_NAME, `Parsed ${currentProjects.length} projects from current site`);

        await db.insert(rawDataCacheTable).values({
          sourceKey: SOURCE_KEY,
          sourceUrl: NEPA_EIA_URL,
          payloadJson: JSON.stringify({ html_length: currentHTML.length, parsed_count: currentProjects.length, fetched_at: new Date().toISOString() }),
          statusCode: 200,
          notes: "nepa-eia-current-html",
        });
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch current NEPA site: ${err instanceof Error ? err.message : String(err)}`, err);
      }

      try {
        log.info(PIPELINE_NAME, "Fetching NEPA archive EIA page...");
        const archiveHTML = await fetchNEPAPage(NEPA_ARCHIVE_URL);
        log.info(PIPELINE_NAME, `Fetched ${archiveHTML.length} bytes from archive NEPA site`);
        const archiveProjects = parseArchiveSiteHTML(archiveHTML);
        allProjects.push(...archiveProjects);
        fetchedArchive = true;
        log.info(PIPELINE_NAME, `Parsed ${archiveProjects.length} projects from archive site`);
      } catch (err) {
        log.warn(PIPELINE_NAME, `Failed to fetch NEPA archive site: ${err instanceof Error ? err.message : String(err)}`, err);
      }

      allProjects = deduplicateProjects(allProjects);
      recordsRead = allProjects.length;
      log.info(PIPELINE_NAME, `Total unique EIA projects found: ${allProjects.length}`);

      if (allProjects.length === 0 && !fetchedCurrent && !fetchedArchive) {
        throw new Error("Failed to fetch any NEPA data from either current or archive site");
      }

      const analysis = computeRegulatoryActivityScore(allProjects);

      const dataRecords = [
        { country: "Jamaica", region: "Caribbean", datasetType: "NEPA EIA Project Count", value: analysis.eiaCount, unit: "count", timestamp: new Date() },
        { country: "Jamaica", region: "Caribbean", datasetType: "NEPA Regulatory Density Score", value: analysis.regulatoryDensityScore, unit: "score", timestamp: new Date() },
        { country: "Jamaica", region: "Caribbean", datasetType: "NEPA Avg EIA Projects Per Year", value: analysis.avgProjectsPerYear, unit: "per_year", timestamp: new Date() },
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
          projects: allProjects.map(p => ({
            title: p.title,
            parish: p.parish,
            projectType: p.projectType,
            source: p.source,
            year: p.year,
            hasDocument: !!p.documentUrl,
          })),
          analysis,
          fetchedAt: new Date().toISOString(),
        }),
        statusCode: 200,
        notes: "nepa-eia-all-projects",
      });

      const confidence = (fetchedCurrent || fetchedArchive)
        ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION
        : CONFIDENCE_THRESHOLDS.COUNTRY_LEVEL;

      await upsertFreshness({
        sourceKey: SOURCE_KEY,
        pipelineName: PIPELINE_NAME,
        status: fetchedCurrent || fetchedArchive ? "success" : "partial",
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

      log.success(PIPELINE_NAME, `Completed: ${allProjects.length} EIA projects, ${recordsWritten} data points`, {
        fetchedCurrent,
        fetchedArchive,
        projectTypes: Object.keys(analysis.projectTypeCounts).length,
        parishes: Object.keys(analysis.parishCounts).length,
      });

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected,
        confidence,
        summary: {
          eiaProjects: allProjects.length,
          fetchedCurrent,
          fetchedArchive,
          projectTypes: analysis.projectTypeCounts,
          parishes: analysis.parishCounts,
          regulatoryDensityScore: analysis.regulatoryDensityScore,
          avgProjectsPerYear: analysis.avgProjectsPerYear,
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
