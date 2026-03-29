import { Router, type IRouter } from "express";
import { db, projectsTable, portfoliosTable, portfolioProjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { decryptProjectFields } from "../lib/project-encryption";

const router: IRouter = Router();

interface ESLService {
  id: string;
  name: string;
  category: "Assessment" | "Monitoring" | "Laboratory" | "Compliance" | "Advisory";
  priority: "CRITICAL" | "RECOMMENDED" | "OPTIONAL";
  description: string;
  scope: string[];
  deliverables: string[];
  timelineWeeks: number;
  estimatedFee: number;
  trigger: string;
  valueProposition: string;
  riskReduction: number;
  confidenceGain: number;
}

const SERVICE_CATALOG = {
  eia: {
    id: "eia",
    name: "Environmental Impact Assessment",
    category: "Assessment" as const,
    description: "Comprehensive EIA covering baseline conditions, impact prediction, and mitigation planning for regulatory approval.",
    scope: [
      "Baseline environmental survey (air, water, soil, ecology)",
      "Stakeholder consultation and community engagement",
      "Impact prediction modeling",
      "Mitigation and management plan development",
      "Regulatory submission support",
    ],
    deliverables: ["Full EIA Report", "Environmental Management Plan", "Monitoring Framework", "Regulatory Submission Package"],
    valueProposition: "Required for regulatory approval and lender due diligence. Without EIA, project faces permitting delays of 6-18 months.",
  },
  labValidation: {
    id: "lab-validation",
    name: "Laboratory Testing & Validation",
    category: "Laboratory" as const,
    description: "Accredited laboratory analysis to validate environmental conditions and establish defensible baseline data.",
    scope: [
      "Water quality analysis (heavy metals, organics, microbiological)",
      "Soil contamination screening",
      "Air quality baseline monitoring",
      "Sediment analysis for coastal/marine projects",
      "Chain-of-custody sample management",
    ],
    deliverables: ["Accredited Lab Reports", "Data Quality Assessment", "Baseline Data Package", "Compliance Certificate"],
    valueProposition: "Lab-validated data improves data confidence by 15-25%, directly reducing risk premiums and insurance costs.",
  },
  monitoringProgram: {
    id: "monitoring-program",
    name: "Environmental Monitoring Program",
    category: "Monitoring" as const,
    description: "Ongoing environmental monitoring with automated alerts, compliance tracking, and regulatory reporting.",
    scope: [
      "Monitoring network design and station installation",
      "Continuous water quality monitoring",
      "Ambient air quality surveillance",
      "Noise and vibration monitoring",
      "Quarterly compliance reporting",
      "Real-time alert system deployment",
    ],
    deliverables: ["Monitoring Plan", "Quarterly Reports", "Annual Compliance Summary", "Real-time Dashboard Access"],
    valueProposition: "Active monitoring is required for loan covenant compliance and grant disbursement conditions. Reduces covenant breach probability by 40-60%.",
  },
  ifcCompliance: {
    id: "ifc-compliance",
    name: "IFC Performance Standards Alignment",
    category: "Compliance" as const,
    description: "Gap analysis and remediation plan to achieve full IFC Performance Standards compliance for DFI financing.",
    scope: [
      "PS1-PS8 gap assessment against project design",
      "Environmental and Social Management System (ESMS) development",
      "Biodiversity Action Plan (PS6) where applicable",
      "Indigenous Peoples engagement framework (PS7)",
      "Cultural heritage screening (PS8)",
      "Remediation roadmap with timelines",
    ],
    deliverables: ["IFC Gap Analysis Report", "ESMS Documentation", "Remediation Action Plan", "Compliance Certification"],
    valueProposition: "IFC alignment unlocks DFI financing channels (IDB, CDB, World Bank) and reduces risk classification by 1-2 tiers.",
  },
  climateRisk: {
    id: "climate-risk",
    name: "Climate Risk & Resilience Assessment",
    category: "Advisory" as const,
    description: "Climate vulnerability analysis with adaptation measures for flood, coastal, and water stress exposure.",
    scope: [
      "Climate hazard screening (flood, storm surge, sea level rise, drought)",
      "Vulnerability and exposure assessment",
      "Climate-adjusted financial modeling",
      "Adaptation measures identification and costing",
      "Resilience investment roadmap",
    ],
    deliverables: ["Climate Risk Report", "Vulnerability Assessment", "Adaptation Plan", "Resilience Investment Business Case"],
    valueProposition: "Addresses Paris Agreement alignment requirements and reduces climate-related insurance premiums by 15-25%.",
  },
  regulatoryAdvisory: {
    id: "regulatory-advisory",
    name: "Regulatory & Permitting Advisory",
    category: "Advisory" as const,
    description: "Navigate Caribbean environmental regulatory frameworks, secure permits, and maintain ongoing compliance.",
    scope: [
      "Regulatory landscape mapping (national & regional)",
      "Permit application preparation and submission",
      "Agency liaison and consultation management",
      "Compliance calendar development",
      "Regulatory change monitoring",
    ],
    deliverables: ["Regulatory Roadmap", "Permit Applications", "Compliance Calendar", "Agency Correspondence Package"],
    valueProposition: "Reduces permitting timeline by 30-50% and eliminates regulatory surprise costs that average 5-15% of project value.",
  },
  contaminationAssessment: {
    id: "contamination-assessment",
    name: "Contamination Assessment & Remediation",
    category: "Assessment" as const,
    description: "Phase I/II site assessment with remediation planning for contaminated or brownfield sites.",
    scope: [
      "Phase I desktop study and site reconnaissance",
      "Phase II intrusive investigation (soil, groundwater)",
      "Risk assessment (human health and ecological)",
      "Remediation options appraisal",
      "Remediation action plan and cost estimate",
    ],
    deliverables: ["Phase I Report", "Phase II Investigation Report", "Risk Assessment", "Remediation Action Plan"],
    valueProposition: "Unvalidated contamination risk is the #1 cause of late-stage project cost overruns. Early assessment saves 10-30x remediation costs.",
  },
  waterResourceAssessment: {
    id: "water-resource",
    name: "Water Resource & Stress Assessment",
    category: "Assessment" as const,
    description: "Comprehensive water availability and stress analysis for water-dependent projects.",
    scope: [
      "Hydrological baseline assessment",
      "Water balance modeling",
      "Groundwater resource evaluation",
      "Water quality characterization",
      "Water efficiency and conservation planning",
    ],
    deliverables: ["Water Resource Report", "Water Balance Model", "Water Management Plan", "Efficiency Recommendations"],
    valueProposition: "Critical for Caribbean SIDS where water scarcity is the primary constraint. Validates project viability and reduces stranded asset risk.",
  },
};

function calculateServiceFee(service: typeof SERVICE_CATALOG[keyof typeof SERVICE_CATALOG], project: { investmentAmount: number; [key: string]: unknown }): number {
  const projectValue = project.investmentAmount * 1_000_000;
  const baseMultipliers: Record<string, number> = {
    eia: 0.008,
    labValidation: 0.003,
    monitoringProgram: 0.005,
    ifcCompliance: 0.004,
    climateRisk: 0.004,
    regulatoryAdvisory: 0.003,
    contaminationAssessment: 0.005,
    waterResourceAssessment: 0.003,
  };

  const key = Object.entries(SERVICE_CATALOG).find(([, v]) => v.id === service.id)?.[0] || "eia";
  const multiplier = baseMultipliers[key] || 0.004;
  let fee = projectValue * multiplier;

  const minFees: Record<string, number> = {
    eia: 35000,
    labValidation: 15000,
    monitoringProgram: 25000,
    ifcCompliance: 20000,
    climateRisk: 20000,
    regulatoryAdvisory: 15000,
    contaminationAssessment: 25000,
    waterResourceAssessment: 15000,
  };
  const maxFees: Record<string, number> = {
    eia: 250000,
    labValidation: 120000,
    monitoringProgram: 180000,
    ifcCompliance: 150000,
    climateRisk: 120000,
    regulatoryAdvisory: 100000,
    contaminationAssessment: 180000,
    waterResourceAssessment: 100000,
  };

  fee = Math.max(minFees[key] || 15000, Math.min(maxFees[key] || 200000, fee));
  return Math.round(fee / 1000) * 1000;
}

function scopeServicesForProject(project: { investmentAmount: number; overallRisk: number; regulatoryComplexity: number; contaminationRisk: number; coastalExposure: number; floodRisk: number; waterStress: number; hasLabData: boolean; hasMonitoringData: boolean; isIFCAligned: boolean; dataConfidence: number; [key: string]: unknown }): ESLService[] {
  const services: ESLService[] = [];

  const needsEIA = project.overallRisk > 40 || project.regulatoryComplexity > 5;
  if (needsEIA) {
    const priority = project.overallRisk > 60 ? "CRITICAL" : "RECOMMENDED";
    services.push({
      ...SERVICE_CATALOG.eia,
      priority,
      timelineWeeks: project.overallRisk > 70 ? 16 : 12,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.eia, project),
      trigger: project.overallRisk > 60
        ? `Overall risk score ${project.overallRisk.toFixed(0)}/100 exceeds threshold — full EIA required for regulatory and lender approval`
        : `Regulatory complexity ${project.regulatoryComplexity}/10 requires environmental assessment`,
      riskReduction: 12,
      confidenceGain: 15,
    });
  }

  if (!project.hasLabData) {
    services.push({
      ...SERVICE_CATALOG.labValidation,
      priority: project.dataConfidence < 50 ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: 6,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.labValidation, project),
      trigger: `No laboratory-validated data available. Data confidence at ${project.dataConfidence.toFixed(0)}% — lab validation would improve to ${Math.min(100, project.dataConfidence + 20).toFixed(0)}%`,
      riskReduction: 8,
      confidenceGain: 20,
    });
  }

  if (!project.hasMonitoringData) {
    services.push({
      ...SERVICE_CATALOG.monitoringProgram,
      priority: project.overallRisk > 60 ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: 8,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.monitoringProgram, project),
      trigger: `No active monitoring program. ${project.overallRisk > 60 ? "High-risk project requires continuous environmental surveillance for covenant compliance" : "Monitoring data would strengthen risk assessment and enable better terms"}`,
      riskReduction: 10,
      confidenceGain: 18,
    });
  }

  if (!project.isIFCAligned) {
    const priority = project.overallRisk > 50 ? "CRITICAL" : "RECOMMENDED";
    services.push({
      ...SERVICE_CATALOG.ifcCompliance,
      priority,
      timelineWeeks: 10,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.ifcCompliance, project),
      trigger: `Project not aligned with IFC Performance Standards. ${priority === "CRITICAL" ? "DFI financing channels are blocked without IFC compliance" : "IFC alignment would unlock additional financing options and improve terms"}`,
      riskReduction: 10,
      confidenceGain: 12,
    });
  }

  const hasClimateExposure = project.floodRisk > 6 || project.coastalExposure > 6 || project.waterStress > 7;
  if (hasClimateExposure) {
    const exposureFactors: string[] = [];
    if (project.floodRisk > 6) exposureFactors.push(`flood risk ${project.floodRisk}/10`);
    if (project.coastalExposure > 6) exposureFactors.push(`coastal exposure ${project.coastalExposure}/10`);
    if (project.waterStress > 7) exposureFactors.push(`water stress ${project.waterStress}/10`);
    services.push({
      ...SERVICE_CATALOG.climateRisk,
      priority: (project.floodRisk > 8 || project.coastalExposure > 8) ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: 8,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.climateRisk, project),
      trigger: `Elevated climate exposure: ${exposureFactors.join(", ")}. Paris Agreement alignment and insurance optimization require climate risk assessment`,
      riskReduction: 8,
      confidenceGain: 10,
    });
  }

  if (project.regulatoryComplexity > 6) {
    services.push({
      ...SERVICE_CATALOG.regulatoryAdvisory,
      priority: project.regulatoryComplexity > 8 ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: project.regulatoryComplexity > 8 ? 12 : 6,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.regulatoryAdvisory, project),
      trigger: `Regulatory complexity rated ${project.regulatoryComplexity}/10. Caribbean permitting requires specialized navigation to avoid 6-18 month delays`,
      riskReduction: 6,
      confidenceGain: 8,
    });
  }

  if (project.contaminationRisk > 5) {
    services.push({
      ...SERVICE_CATALOG.contaminationAssessment,
      priority: project.contaminationRisk > 7 ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: project.contaminationRisk > 7 ? 12 : 8,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.contaminationAssessment, project),
      trigger: `Contamination risk rated ${project.contaminationRisk}/10. Unvalidated contamination is the #1 cause of late-stage cost overruns in Caribbean infrastructure`,
      riskReduction: 10,
      confidenceGain: 15,
    });
  }

  if (project.waterStress > 6) {
    services.push({
      ...SERVICE_CATALOG.waterResourceAssessment,
      priority: project.waterStress > 8 ? "CRITICAL" : "RECOMMENDED",
      timelineWeeks: 6,
      estimatedFee: calculateServiceFee(SERVICE_CATALOG.waterResourceAssessment, project),
      trigger: `Water stress rated ${project.waterStress}/10. Water availability is the primary constraint for Caribbean SIDS — project viability depends on validated water resources`,
      riskReduction: 6,
      confidenceGain: 12,
    });
  }

  services.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, RECOMMENDED: 1, OPTIONAL: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || b.estimatedFee - a.estimatedFee;
  });

  return services;
}

router.get("/esl/project/:id/services", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid project ID" }); return; }

  const [rawProject] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!rawProject) { res.status(404).json({ message: "Project not found" }); return; }
  const project = decryptProjectFields(rawProject);

  const services = scopeServicesForProject(project);

  const totalFee = services.reduce((s, svc) => s + svc.estimatedFee, 0);
  const criticalCount = services.filter(s => s.priority === "CRITICAL").length;
  const criticalFee = services.filter(s => s.priority === "CRITICAL").reduce((s, svc) => s + svc.estimatedFee, 0);
  const totalRiskReduction = Math.min(35, services.reduce((s, svc) => s + svc.riskReduction, 0));
  const totalConfidenceGain = Math.min(40, services.reduce((s, svc) => s + svc.confidenceGain, 0));
  const maxTimeline = services.length > 0 ? Math.max(...services.map(s => s.timelineWeeks)) : 0;

  const projectedRisk = Math.max(15, project.overallRisk - totalRiskReduction);
  const projectedConfidence = Math.min(95, project.dataConfidence + totalConfidenceGain);

  res.json({
    project: {
      id: project.id,
      name: project.name,
      country: project.country,
      projectType: project.projectType,
      investmentAmount: project.investmentAmount,
      overallRisk: project.overallRisk,
      dataConfidence: project.dataConfidence,
    },
    services,
    summary: {
      totalServices: services.length,
      criticalServices: criticalCount,
      totalFee,
      criticalFee,
      totalRiskReduction,
      totalConfidenceGain,
      maxTimelineWeeks: maxTimeline,
      projectedRiskAfterESL: projectedRisk,
      projectedConfidenceAfterESL: projectedConfidence,
      eslFeeAsPercentOfInvestment: Math.round((totalFee / (project.investmentAmount * 1_000_000)) * 10000) / 100,
    },
  });
});

router.get("/esl/portfolio/pipeline", async (req, res) => {
  const projects = (await db.select().from(projectsTable)).map(decryptProjectFields);
  if (projects.length === 0) {
    res.json({ totalRevenue: 0, services: [], projects: [], summary: { totalServices: 0 } });
    return;
  }

  const projectScopes = projects.map(p => ({
    project: {
      id: p.id,
      name: p.name,
      country: p.country,
      projectType: p.projectType,
      investmentAmount: p.investmentAmount,
      overallRisk: p.overallRisk,
    },
    services: scopeServicesForProject(p),
  }));

  const totalRevenue = projectScopes.reduce((s, ps) => s + ps.services.reduce((t, svc) => t + svc.estimatedFee, 0), 0);
  const criticalRevenue = projectScopes.reduce((s, ps) => s + ps.services.filter(svc => svc.priority === "CRITICAL").reduce((t, svc) => t + svc.estimatedFee, 0), 0);
  const totalServices = projectScopes.reduce((s, ps) => s + ps.services.length, 0);
  const criticalServices = projectScopes.reduce((s, ps) => s + ps.services.filter(svc => svc.priority === "CRITICAL").length, 0);

  const serviceBreakdown: Record<string, { name: string; category: string; count: number; revenue: number; criticalCount: number }> = {};
  for (const ps of projectScopes) {
    for (const svc of ps.services) {
      if (!serviceBreakdown[svc.id]) {
        serviceBreakdown[svc.id] = { name: svc.name, category: svc.category, count: 0, revenue: 0, criticalCount: 0 };
      }
      serviceBreakdown[svc.id].count++;
      serviceBreakdown[svc.id].revenue += svc.estimatedFee;
      if (svc.priority === "CRITICAL") serviceBreakdown[svc.id].criticalCount++;
    }
  }

  const topProjects = projectScopes
    .map(ps => ({
      ...ps.project,
      serviceCount: ps.services.length,
      criticalCount: ps.services.filter(s => s.priority === "CRITICAL").length,
      totalFee: ps.services.reduce((s, svc) => s + svc.estimatedFee, 0),
    }))
    .sort((a, b) => b.totalFee - a.totalFee);

  const totalCapital = projects.reduce((s, p) => s + p.investmentAmount, 0);

  res.json({
    totalRevenue,
    criticalRevenue,
    totalCapital: totalCapital * 1_000_000,
    eslAsPercentOfCapital: Math.round((totalRevenue / (totalCapital * 1_000_000)) * 10000) / 100,
    summary: {
      totalServices,
      criticalServices,
      projectsWithCritical: projectScopes.filter(ps => ps.services.some(s => s.priority === "CRITICAL")).length,
      totalProjects: projects.length,
    },
    serviceBreakdown: Object.values(serviceBreakdown).sort((a, b) => b.revenue - a.revenue),
    topProjects: topProjects.slice(0, 10),
  });
});

export default router;
