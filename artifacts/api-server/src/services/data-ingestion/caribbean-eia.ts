import { db, ingestionRunsTable, regionalDataTable, rawDataCacheTable } from "@workspace/db";
import https from "https";
import { clamp, roundTo } from "./utils/normalize";
import { upsertFreshness } from "./utils/freshness";
import { ingestionLogger as log } from "./utils/logger";
import type { SourceAdapter, IngestionResult } from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";

const PIPELINE_NAME = "caribbean-eia";
const SOURCE_KEY = "caribbean-eia-regional";
const PAGE_DELAY_MS = 800;

type AssessmentType =
  | "eia"
  | "eis"
  | "esia"
  | "sea"
  | "aia"
  | "sia"
  | "tor"
  | "addendum"
  | "public_meeting"
  | "technical_study"
  | "compliance_plan"
  | "permit_licence"
  | "project_brief"
  | "unclassified";

interface RegDocument {
  title: string;
  documentUrl: string;
  assessmentType: AssessmentType;
  year?: number;
  country: string;
  source: string;
}

interface CountryScrapeResult {
  country: string;
  documents: RegDocument[];
  sourceUrl: string;
  status: "success" | "failed";
  error?: string;
}

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), 25000);
    const parsedUrl = new URL(url);
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Host": parsedUrl.hostname,
      },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        const redirectUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        fetchPage(redirectUrl).then(resolve).catch(reject);
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractYear(text: string): number | undefined {
  const matches = text.match(/\b(20\d{2}|19\d{2})\b/g);
  if (matches && matches.length > 0) {
    const years = matches.map(Number).filter(y => y >= 1990 && y <= new Date().getFullYear() + 1);
    return years.length > 0 ? Math.max(...years) : undefined;
  }
  return undefined;
}

function classifyAssessmentType(title: string): AssessmentType {
  const t = title.toLowerCase().replace(/[-_]/g, " ");

  if (/\btor\b|terms of reference/i.test(t)) return "tor";
  if (/addendum|corrigend|amendment|supplementa/i.test(t)) return "addendum";
  if (/compliance plan|environmental management plan|emp\b/i.test(t)) return "compliance_plan";
  if (/public[\s]*(meeting|consultation|noti|present)|stakeholder|meeting[\s]*report|attendance/i.test(t)) return "public_meeting";
  if (/\baia\b|archaeolog/i.test(t)) return "aia";
  if (/social impact assess|\bsia\b/i.test(t)) return "sia";
  if (/\bsea\b|strategic environmental assess/i.test(t)) return "sea";
  if (/\besia\b|environmental and social impact/i.test(t)) return "esia";
  if (/\beis\b|environmental impact statement|environmental statement/i.test(t)) return "eis";
  if (/permit|licence|license|certificate|clearance|approval/i.test(t)) return "permit_licence";
  if (/project[\s]*brief|screening/i.test(t)) return "project_brief";
  if (/appendix|appendices|annex|noise|flora|fauna|baseline|drainage|engineering|geological|hydrological|traffic|soil|monitoring|non technical summary/i.test(t)) return "technical_study";
  if (/\beia\b|environmental impact assess|environmental assessment/i.test(t)) return "eia";

  return "unclassified";
}

async function scrapeBelizeDOE(): Promise<CountryScrapeResult> {
  const country = "Belize";
  const sourceUrl = "https://doe.gov.bz/resource-center/environmental-impact-assessments/";
  const docs: RegDocument[] = [];

  try {
    const maxPages = 7;
    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1 ? sourceUrl : `${sourceUrl}?cp=${page}`;
      const html = await fetchPage(url);
      const downloadMatches = [...html.matchAll(/data-downloadurl="([^"]*)"/g)];

      for (const m of downloadMatches) {
        const downloadUrl = m[1];
        const slugMatch = downloadUrl.match(/\/download\/([^/?]+)/);
        if (!slugMatch) continue;
        const slug = decodeURIComponent(slugMatch[1]);
        const title = slug.replace(/-/g, " ").replace(/\?.*/, "").trim();
        if (title.length < 3) continue;

        docs.push({
          title,
          documentUrl: downloadUrl.split("?")[0],
          assessmentType: classifyAssessmentType(title),
          year: extractYear(downloadUrl) || extractYear(title),
          country,
          source: "doe.gov.bz",
        });
      }

      if (downloadMatches.length === 0) break;
      if (page < maxPages) await delay(PAGE_DELAY_MS);
    }

    const complianceUrl = "https://doe.gov.bz/resource-center/environmental-compliance-plans/";
    for (let page = 1; page <= 10; page++) {
      try {
        const url = page === 1 ? complianceUrl : `${complianceUrl}?cp=${page}`;
        const html = await fetchPage(url);
        const downloadMatches = [...html.matchAll(/data-downloadurl="([^"]*)"/g)];
        if (downloadMatches.length === 0) break;

        for (const m of downloadMatches) {
          const downloadUrl = m[1];
          const slugMatch = downloadUrl.match(/\/download\/([^/?]+)/);
          if (!slugMatch) continue;
          const slug = decodeURIComponent(slugMatch[1]);
          const title = slug.replace(/-/g, " ").replace(/\?.*/, "").trim();
          if (title.length < 3) continue;

          docs.push({
            title,
            documentUrl: downloadUrl.split("?")[0],
            assessmentType: "compliance_plan",
            year: extractYear(downloadUrl) || extractYear(title),
            country,
            source: "doe.gov.bz",
          });
        }
        if (page < 10) await delay(PAGE_DELAY_MS);
      } catch {
        break;
      }
    }

    return { country, documents: docs, sourceUrl, status: "success" };
  } catch (err) {
    return { country, documents: [], sourceUrl, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

async function scrapeCaymanDOE(): Promise<CountryScrapeResult> {
  const country = "Cayman Islands";
  const sourceUrl = "https://conservation.ky/eia-reports/";
  const docs: RegDocument[] = [];

  try {
    const html = await fetchPage(sourceUrl);

    const sections = [...html.matchAll(/class="wpfd-category-theme-title">([^<]+)/g)].map(m => m[1].trim());
    const pdfMatches = [...html.matchAll(/href="([^"]*\.pdf[^"]*)"\s*(?:[^>]*title="([^"]*)")?/g)];

    for (const m of pdfMatches) {
      const pdfUrl = m[1];
      const titleAttr = m[2]?.trim();
      const filenameMatch = pdfUrl.match(/\/([^/]+\.pdf)/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]).replace(/[-_]/g, " ").replace(/\.pdf$/i, "") : "";
      const title = titleAttr || filename;
      if (title.length < 3) continue;

      docs.push({
        title,
        documentUrl: pdfUrl,
        assessmentType: classifyAssessmentType(title),
        year: extractYear(pdfUrl) || extractYear(title),
        country,
        source: "conservation.ky",
      });
    }

    const owenRobertsHtml = await fetchPage("https://conservation.ky/eia-reports/").catch(() => "");
    const additionalPdfLinks = [...html.matchAll(/href="(https:\/\/conservation\.ky\/wp-content\/uploads\/[^"]*\.pdf[^"]*)"/g)];
    for (const m of additionalPdfLinks) {
      const pdfUrl = m[1];
      if (docs.some(d => d.documentUrl === pdfUrl)) continue;
      const filenameMatch = pdfUrl.match(/\/([^/]+\.pdf)/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]).replace(/[-_]/g, " ").replace(/\.pdf$/i, "") : "";
      if (filename.length < 3) continue;

      docs.push({
        title: filename,
        documentUrl: pdfUrl,
        assessmentType: classifyAssessmentType(filename),
        year: extractYear(pdfUrl),
        country,
        source: "conservation.ky",
      });
    }

    return { country, documents: docs, sourceUrl, status: "success" };
  } catch (err) {
    return { country, documents: [], sourceUrl, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

async function scrapeTrinidadEMA(): Promise<CountryScrapeResult> {
  const country = "Trinidad & Tobago";
  const sourceUrl = "https://www.ema.co.tt";
  const docs: RegDocument[] = [];

  try {
    const html = await fetchPage(sourceUrl);
    const newsLinks = [...html.matchAll(/href="(https:\/\/www\.ema\.co\.tt\/\d{4}\/\d{2}\/\d{2}\/[^"]*cec[^"]*)"/gi)];
    const cecLinks = [...html.matchAll(/href="(https:\/\/www\.ema\.co\.tt\/\d{4}\/\d{2}\/\d{2}\/[^"]*(?:clearance|eia|assessment|environment)[^"]*)"/gi)];

    const allLinks = [...new Set([...newsLinks, ...cecLinks].map(m => m[1]))];

    for (const url of allLinks.slice(0, 20)) {
      try {
        const pageHtml = await fetchPage(url);
        const titleMatch = pageHtml.match(/<title>([^<]*)</);
        const title = titleMatch ? titleMatch[1].replace(/ - EMA$/, "").trim() : url.split("/").pop()?.replace(/-/g, " ") || "";

        const pdfLinks = [...pageHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];
        if (pdfLinks.length > 0) {
          for (const p of pdfLinks) {
            docs.push({
              title: decodeURIComponent(p[1].split("/").pop() || "").replace(/[-_]/g, " ").replace(/\.pdf$/i, ""),
              documentUrl: p[1],
              assessmentType: classifyAssessmentType(p[1]),
              year: extractYear(url),
              country,
              source: "ema.co.tt",
            });
          }
        } else {
          docs.push({
            title,
            documentUrl: url,
            assessmentType: /cec|clearance/i.test(title) ? "permit_licence" : "eia",
            year: extractYear(url),
            country,
            source: "ema.co.tt",
          });
        }
        await delay(PAGE_DELAY_MS);
      } catch {
        continue;
      }
    }

    const enforcementUrl = "https://www.ema.co.tt/ema-legal/enforcement/";
    try {
      const enfHtml = await fetchPage(enforcementUrl);
      const pdfLinks = [...enfHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];
      for (const p of pdfLinks) {
        docs.push({
          title: decodeURIComponent(p[1].split("/").pop() || "").replace(/[-_]/g, " ").replace(/\.pdf$/i, ""),
          documentUrl: p[1],
          assessmentType: "permit_licence",
          year: extractYear(p[1]),
          country,
          source: "ema.co.tt",
        });
      }
    } catch {}

    return { country, documents: docs, sourceUrl, status: docs.length > 0 ? "success" : "failed" };
  } catch (err) {
    return { country, documents: [], sourceUrl, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

async function scrapeGuyanaEPA(): Promise<CountryScrapeResult> {
  const country = "Guyana";
  const sourceUrl = "https://epaguyana.org";
  const docs: RegDocument[] = [];

  try {
    const downloadsUrl = "https://epaguyana.org/downloads/environmental-management-plans/";
    const html = await fetchPage(downloadsUrl);
    const pdfLinks = [...html.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];

    for (const m of pdfLinks) {
      const pdfUrl = m[1];
      const filenameMatch = pdfUrl.match(/\/([^/]+\.pdf)/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]).replace(/[-_]/g, " ").replace(/\.pdf$/i, "") : "";
      if (filename.length < 3) continue;
      if (/favicon|logo|icon/i.test(filename)) continue;

      docs.push({
        title: filename,
        documentUrl: pdfUrl,
        assessmentType: classifyAssessmentType(filename),
        year: extractYear(pdfUrl),
        country,
        source: "epaguyana.org",
      });
    }

    const formsUrl = "https://epaguyana.org/downloads/application-forms-for-environmental-authorization/";
    try {
      const formsHtml = await fetchPage(formsUrl);
      const formPdfs = [...formsHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];
      for (const m of formPdfs) {
        const pdfUrl = m[1];
        const filenameMatch = pdfUrl.match(/\/([^/]+\.pdf)/i);
        const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]).replace(/[-_]/g, " ").replace(/\.pdf$/i, "") : "";
        if (filename.length < 3 || /favicon|logo|icon/i.test(filename)) continue;
        docs.push({
          title: filename,
          documentUrl: pdfUrl,
          assessmentType: classifyAssessmentType(filename),
          year: extractYear(pdfUrl),
          country,
          source: "epaguyana.org",
        });
      }
    } catch {}

    return { country, documents: docs, sourceUrl, status: docs.length > 0 ? "success" : "failed" };
  } catch (err) {
    return { country, documents: [], sourceUrl, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

async function scrapePuertoRicoDRNA(): Promise<CountryScrapeResult> {
  const country = "Puerto Rico";
  const sourceUrl = "https://www.drna.pr.gov";
  const docs: RegDocument[] = [];

  try {
    const eiaUrl = "https://www.drna.pr.gov/noticias/declaracion-de-impacto-ambiental-cabo-rojo-land-acquisition-llc/";
    const html = await fetchPage(eiaUrl);
    const pdfLinks = [...html.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];

    for (const m of pdfLinks) {
      const pdfUrl = m[1];
      const filenameMatch = pdfUrl.match(/\/([^/]+\.pdf)/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]).replace(/[-_]/g, " ").replace(/\.pdf$/i, "") : "";
      if (filename.length < 3 || /favicon|logo|icon/i.test(filename)) continue;

      docs.push({
        title: filename,
        documentUrl: pdfUrl,
        assessmentType: classifyAssessmentType(filename),
        year: extractYear(pdfUrl),
        country,
        source: "drna.pr.gov",
      });
    }

    const mainHtml = await fetchPage(sourceUrl);
    const eiaLinks = [...mainHtml.matchAll(/href="(https?:\/\/www\.drna\.pr\.gov\/[^"]*(?:impacto|ambiental|declaracion)[^"]*)"/g)];
    for (const m of eiaLinks.slice(0, 10)) {
      try {
        const pageHtml = await fetchPage(m[1]);
        const titleMatch = pageHtml.match(/<title>([^<]*)</);
        const pagePdfs = [...pageHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/g)];
        for (const p of pagePdfs) {
          const fn = decodeURIComponent(p[1].split("/").pop() || "").replace(/[-_]/g, " ").replace(/\.pdf$/i, "");
          if (fn.length < 3 || /favicon|logo/i.test(fn)) continue;
          if (docs.some(d => d.documentUrl === p[1])) continue;
          docs.push({
            title: fn,
            documentUrl: p[1],
            assessmentType: classifyAssessmentType(fn),
            year: extractYear(p[1]),
            country,
            source: "drna.pr.gov",
          });
        }
        await delay(PAGE_DELAY_MS);
      } catch { continue; }
    }

    return { country, documents: docs, sourceUrl, status: docs.length > 0 ? "success" : "failed" };
  } catch (err) {
    return { country, documents: [], sourceUrl, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

interface RegulatoryFramework {
  country: string;
  authority: string;
  authorityAcronym: string;
  legislation: string;
  eiaRequired: boolean;
  seaFramework: boolean;
  publicConsultationRequired: boolean;
  websiteUrl: string;
  dataAvailability: "scrapeable" | "limited" | "none" | "spa_blocked";
}

const REGULATORY_FRAMEWORKS: RegulatoryFramework[] = [
  { country: "Antigua & Barbuda", authority: "Department of Environment", authorityAcronym: "DOE", legislation: "Physical Planning Act 2003", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.environment.gov.ag", dataAvailability: "none" },
  { country: "Bahamas", authority: "Bahamas Environment, Science and Technology Commission", authorityAcronym: "BEST", legislation: "Planning and Subdivision Act 2010", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.best.gov.bs", dataAvailability: "none" },
  { country: "Barbados", authority: "Environmental Protection Department", authorityAcronym: "EPD", legislation: "Environmental Management Act 2024", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.epd.gov.bb", dataAvailability: "none" },
  { country: "Belize", authority: "Department of the Environment", authorityAcronym: "DOE", legislation: "Environmental Protection Act 1992", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://doe.gov.bz", dataAvailability: "scrapeable" },
  { country: "Cayman Islands", authority: "Department of Environment", authorityAcronym: "DOE", legislation: "National Conservation Act 2013", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://conservation.ky", dataAvailability: "scrapeable" },
  { country: "Cuba", authority: "Ministry of Science, Technology and Environment", authorityAcronym: "CITMA", legislation: "Ley 81 del Medio Ambiente 1997", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.citma.gob.cu", dataAvailability: "none" },
  { country: "Dominica", authority: "Physical Planning Division", authorityAcronym: "PPD", legislation: "Physical Planning Act 2002", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.dominica.gov.dm", dataAvailability: "none" },
  { country: "Dominican Republic", authority: "Ministerio de Medio Ambiente y Recursos Naturales", authorityAcronym: "MIMARENA", legislation: "Ley 64-00 General de Medio Ambiente", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://ambiente.gob.do", dataAvailability: "spa_blocked" },
  { country: "Grenada", authority: "Physical Planning Unit", authorityAcronym: "PPU", legislation: "Physical Planning and Development Control Act 2002", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.gov.gd", dataAvailability: "none" },
  { country: "Guyana", authority: "Environmental Protection Agency", authorityAcronym: "EPA", legislation: "Environmental Protection Act 1996", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://epaguyana.org", dataAvailability: "limited" },
  { country: "Haiti", authority: "Ministère de l'Environnement", authorityAcronym: "MDE", legislation: "Décret sur la Gestion de l'Environnement 2006", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.mde.gouv.ht", dataAvailability: "none" },
  { country: "Jamaica", authority: "National Environment and Planning Agency", authorityAcronym: "NEPA", legislation: "NRCA Act 1991, Town & Country Planning Act", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.nepa.gov.jm", dataAvailability: "scrapeable" },
  { country: "Puerto Rico", authority: "Departamento de Recursos Naturales y Ambientales", authorityAcronym: "DRNA", legislation: "Ley de Política Pública Ambiental", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.drna.pr.gov", dataAvailability: "limited" },
  { country: "St. Lucia", authority: "Department of Sustainable Development", authorityAcronym: "DSD", legislation: "Physical Planning and Development Act 2001", eiaRequired: true, seaFramework: false, publicConsultationRequired: true, websiteUrl: "https://www.govt.lc", dataAvailability: "none" },
  { country: "St. Vincent & the Grenadines", authority: "Physical Planning Department", authorityAcronym: "PPD", legislation: "Town and Country Planning Act 1992", eiaRequired: true, seaFramework: false, publicConsultationRequired: false, websiteUrl: "https://www.svg.gov.vc", dataAvailability: "none" },
  { country: "Suriname", authority: "National Institute for Environment and Development", authorityAcronym: "NIMOS", legislation: "Environmental Framework Act 2020", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.gov.sr", dataAvailability: "none" },
  { country: "Trinidad & Tobago", authority: "Environmental Management Authority", authorityAcronym: "EMA", legislation: "Environmental Management Act 2000", eiaRequired: true, seaFramework: true, publicConsultationRequired: true, websiteUrl: "https://www.ema.co.tt", dataAvailability: "limited" },
];

function computeCountryAnalysis(docs: RegDocument[], country: string) {
  const typeCounts: Record<string, number> = {};
  for (const d of docs) {
    typeCounts[d.assessmentType] = (typeCounts[d.assessmentType] || 0) + 1;
  }

  const primaryTypes: AssessmentType[] = ["eia", "eis", "esia", "sea", "aia", "sia", "unclassified"];
  const primaryCount = docs.filter(d => primaryTypes.includes(d.assessmentType)).length;

  const years = docs.map(d => d.year).filter((y): y is number => y !== undefined);
  const yearSpan = years.length > 1 ? Math.max(...years) - Math.min(...years) + 1 : 1;
  const avgPerYear = roundTo(primaryCount / Math.max(yearSpan, 1));

  return {
    totalDocuments: docs.length,
    assessmentTypeCounts: typeCounts,
    primaryAssessmentCount: primaryCount,
    eiaCount: typeCounts["eia"] || 0,
    eisCount: typeCounts["eis"] || 0,
    esiaCount: typeCounts["esia"] || 0,
    seaCount: typeCounts["sea"] || 0,
    aiaCount: typeCounts["aia"] || 0,
    siaCount: typeCounts["sia"] || 0,
    torCount: typeCounts["tor"] || 0,
    compliancePlanCount: typeCounts["compliance_plan"] || 0,
    technicalStudyCount: typeCounts["technical_study"] || 0,
    avgAssessmentsPerYear: avgPerYear,
  };
}

export const caribbeanEiaAdapter: SourceAdapter = {
  name: PIPELINE_NAME,
  sourceKey: SOURCE_KEY,
  async run(): Promise<IngestionResult> {
    log.info(PIPELINE_NAME, "Starting Caribbean-wide regulatory intelligence ingestion");
    const startedAt = new Date();
    let recordsRead = 0;
    let recordsWritten = 0;
    const countriesAffected: string[] = [];
    const countryResults: Record<string, CountryScrapeResult> = {};

    try {
      const scrapers = [
        scrapeBelizeDOE,
        scrapeCaymanDOE,
        scrapeTrinidadEMA,
        scrapeGuyanaEPA,
        scrapePuertoRicoDRNA,
      ];

      for (const scraper of scrapers) {
        const result = await scraper();
        countryResults[result.country] = result;
        log.info(PIPELINE_NAME, `${result.country}: ${result.status} — ${result.documents.length} documents`);
        if (result.error) log.warn(PIPELINE_NAME, `${result.country} error: ${result.error}`);
      }

      const allDocs: RegDocument[] = [];
      for (const result of Object.values(countryResults)) {
        if (result.status === "success") {
          allDocs.push(...result.documents);
          countriesAffected.push(result.country);
        }
      }
      recordsRead = allDocs.length;

      const now = new Date();
      const dataRecords: {
        country: string;
        region: string;
        datasetType: string;
        value: number;
        unit: string;
        timestamp: Date;
      }[] = [];

      for (const fw of REGULATORY_FRAMEWORKS) {
        if (fw.country === "Jamaica") continue;
        const jr = (dt: string, v: number, u: string) => ({ country: fw.country, region: "Caribbean", datasetType: dt, value: v, unit: u, timestamp: now });

        dataRecords.push(jr("Regulatory Authority Active", 1, "boolean"));
        dataRecords.push(jr("EIA Legally Required", fw.eiaRequired ? 1 : 0, "boolean"));
        dataRecords.push(jr("SEA Framework Exists", fw.seaFramework ? 1 : 0, "boolean"));
        dataRecords.push(jr("Public Consultation Required", fw.publicConsultationRequired ? 1 : 0, "boolean"));

        const countryDocs = allDocs.filter(d => d.country === fw.country);
        if (countryDocs.length > 0) {
          const analysis = computeCountryAnalysis(countryDocs, fw.country);

          dataRecords.push(jr("EIA Document Count", analysis.eiaCount, "count"));
          if (analysis.eisCount > 0) dataRecords.push(jr("EIS Document Count", analysis.eisCount, "count"));
          if (analysis.esiaCount > 0) dataRecords.push(jr("ESIA Document Count", analysis.esiaCount, "count"));
          if (analysis.seaCount > 0) dataRecords.push(jr("SEA Document Count", analysis.seaCount, "count"));
          if (analysis.aiaCount > 0) dataRecords.push(jr("AIA Document Count", analysis.aiaCount, "count"));
          if (analysis.siaCount > 0) dataRecords.push(jr("SIA Document Count", analysis.siaCount, "count"));
          if (analysis.torCount > 0) dataRecords.push(jr("TOR Document Count", analysis.torCount, "count"));
          if (analysis.compliancePlanCount > 0) dataRecords.push(jr("Compliance Plan Count", analysis.compliancePlanCount, "count"));
          if (analysis.technicalStudyCount > 0) dataRecords.push(jr("Technical Study Count", analysis.technicalStudyCount, "count"));
          dataRecords.push(jr("Total Regulatory Documents", analysis.totalDocuments, "count"));
          dataRecords.push(jr("Primary Assessment Count", analysis.primaryAssessmentCount, "count"));
          dataRecords.push(jr("Avg Assessments Per Year", analysis.avgAssessmentsPerYear, "per_year"));

          let densityScore = 0;
          densityScore += Math.min(analysis.primaryAssessmentCount * 0.5, 30);
          densityScore += Math.min(analysis.compliancePlanCount * 0.3, 20);
          const typeCount = Object.keys(analysis.assessmentTypeCounts).length;
          densityScore += Math.min(typeCount * 3, 15);
          if (analysis.esiaCount > 0) densityScore += 5;
          if (analysis.torCount > 0) densityScore += 5;
          densityScore += Math.min(analysis.totalDocuments * 0.1, 25);

          dataRecords.push(jr("Regulatory Density Score", roundTo(clamp(densityScore, 0, 100)), "score"));
        } else {
          dataRecords.push(jr("Total Regulatory Documents", 0, "count"));
          let baseScore = 10;
          if (fw.eiaRequired) baseScore += 10;
          if (fw.seaFramework) baseScore += 5;
          if (fw.publicConsultationRequired) baseScore += 5;
          dataRecords.push(jr("Regulatory Density Score", baseScore, "score"));
        }
      }

      if (dataRecords.length > 0) {
        await db.insert(regionalDataTable).values(dataRecords);
        recordsWritten = dataRecords.length;
      }

      await db.insert(rawDataCacheTable).values({
        sourceKey: SOURCE_KEY,
        sourceUrl: "https://caribbean-eia-regional",
        payloadJson: JSON.stringify({
          documents: allDocs.map(d => ({
            title: d.title,
            assessmentType: d.assessmentType,
            year: d.year,
            country: d.country,
            source: d.source,
          })),
          countryResults: Object.fromEntries(
            Object.entries(countryResults).map(([k, v]) => [k, { status: v.status, documentCount: v.documents.length, error: v.error }])
          ),
          frameworks: REGULATORY_FRAMEWORKS.map(f => ({ country: f.country, authority: f.authorityAcronym, dataAvailability: f.dataAvailability })),
          fetchedAt: new Date().toISOString(),
        }),
        statusCode: 200,
        notes: "caribbean-eia-regulatory-intelligence",
      });

      const confidence = countriesAffected.length >= 3 ? CONFIDENCE_THRESHOLDS.HIGH_RESOLUTION : CONFIDENCE_THRESHOLDS.MODERATE;

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

      const countrySummary = Object.fromEntries(
        Object.entries(countryResults).map(([k, v]) => [k, { docs: v.documents.length, status: v.status }])
      );

      log.success(PIPELINE_NAME, `Completed: ${allDocs.length} docs from ${countriesAffected.length} countries, ${recordsWritten} data points`, countrySummary);

      return {
        pipelineName: PIPELINE_NAME,
        status: "success",
        recordsRead,
        recordsWritten,
        countriesAffected,
        confidence,
        summary: {
          countrySummary,
          totalDocuments: allDocs.length,
          countriesScraped: countriesAffected.length,
          frameworksCatalogued: REGULATORY_FRAMEWORKS.length,
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
