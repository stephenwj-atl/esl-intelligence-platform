import { db, projectsTable } from "@workspace/db";
import { analyzeProject } from "../lib/risk-engine";
import {
  calculatePERS,
  buildInterventionRiskProfile,
  determineMonitoringIntensity,
  recommendCapitalMode,
  inferCategory,
  inferInterventionType,
  type ProjectCategory,
  type InterventionType,
  type LenderFramework,
} from "../lib/pers-engine";
import { encrypt } from "../lib/encryption";

interface DemoProject {
  name: string;
  country: string;
  projectType: string;
  projectCategory: ProjectCategory;
  interventionType: InterventionType;
  lenderFramework: LenderFramework | null;
  latitude: number;
  longitude: number;
  investmentAmount: number;
  floodRisk: number;
  coastalExposure: number;
  contaminationRisk: number;
  regulatoryComplexity: number;
  communitySensitivity: number;
  waterStress: number;
  hasLabData: boolean;
  hasMonitoringData: boolean;
  isIFCAligned: boolean;
  hasSEA: boolean;
  hasESIA: boolean;
}

const DEMO_PROJECTS: DemoProject[] = [
  {
    name: "Kingston Harbour Water Treatment Upgrade",
    country: "Jamaica",
    projectType: "Water Treatment",
    projectCategory: "Hard Infrastructure",
    interventionType: "Physical Infrastructure",
    lenderFramework: "IDB ESPF",
    latitude: 17.9714,
    longitude: -76.7920,
    investmentAmount: 45000000,
    floodRisk: 3,
    coastalExposure: 4,
    contaminationRisk: 6,
    regulatoryComplexity: 4,
    communitySensitivity: 3,
    waterStress: 7,
    hasLabData: true,
    hasMonitoringData: true,
    isIFCAligned: true,
    hasSEA: true,
    hasESIA: true,
  },
  {
    name: "Barbados Solar Farm & Grid Modernization",
    country: "Barbados",
    projectType: "Solar",
    projectCategory: "Climate & Environment",
    interventionType: "Environmental",
    lenderFramework: "GCF",
    latitude: 13.1939,
    longitude: -59.5432,
    investmentAmount: 28000000,
    floodRisk: 2,
    coastalExposure: 5,
    contaminationRisk: 2,
    regulatoryComplexity: 3,
    communitySensitivity: 2,
    waterStress: 4,
    hasLabData: true,
    hasMonitoringData: true,
    isIFCAligned: true,
    hasSEA: true,
    hasESIA: false,
  },
  {
    name: "Dominica Post-Hurricane Housing Reconstruction",
    country: "Dominica",
    projectType: "Emergency Shelter",
    projectCategory: "Disaster Response & Recovery",
    interventionType: "Disaster",
    lenderFramework: "CDB ESRP",
    latitude: 15.4150,
    longitude: -61.3710,
    investmentAmount: 65000000,
    floodRisk: 9,
    coastalExposure: 8,
    contaminationRisk: 5,
    regulatoryComplexity: 7,
    communitySensitivity: 9,
    waterStress: 6,
    hasLabData: false,
    hasMonitoringData: false,
    isIFCAligned: false,
    hasSEA: false,
    hasESIA: false,
  },
  {
    name: "Trinidad Agricultural Supply Chain Platform",
    country: "Trinidad and Tobago",
    projectType: "Food Processing",
    projectCategory: "Agriculture & Food Security",
    interventionType: "Social/Programmatic",
    lenderFramework: "World Bank ESF",
    latitude: 10.6918,
    longitude: -61.2225,
    investmentAmount: 12000000,
    floodRisk: 4,
    coastalExposure: 3,
    contaminationRisk: 4,
    regulatoryComplexity: 5,
    communitySensitivity: 4,
    waterStress: 3,
    hasLabData: false,
    hasMonitoringData: true,
    isIFCAligned: true,
    hasSEA: false,
    hasESIA: true,
  },
  {
    name: "Guyana Public Financial Management Reform",
    country: "Guyana",
    projectType: "Regulatory Capacity",
    projectCategory: "Governance & Institutional",
    interventionType: "Governance",
    lenderFramework: "IDB ESPF",
    latitude: 6.8013,
    longitude: -58.1551,
    investmentAmount: 8500000,
    floodRisk: 5,
    coastalExposure: 6,
    contaminationRisk: 3,
    regulatoryComplexity: 8,
    communitySensitivity: 5,
    waterStress: 4,
    hasLabData: false,
    hasMonitoringData: false,
    isIFCAligned: false,
    hasSEA: false,
    hasESIA: false,
  },
  {
    name: "St. Lucia Community Health Network Expansion",
    country: "Saint Lucia",
    projectType: "Hospital",
    projectCategory: "Soft Infrastructure",
    interventionType: "Social/Programmatic",
    lenderFramework: "CDB ESRP",
    latitude: 13.9094,
    longitude: -60.9789,
    investmentAmount: 18000000,
    floodRisk: 5,
    coastalExposure: 6,
    contaminationRisk: 4,
    regulatoryComplexity: 5,
    communitySensitivity: 6,
    waterStress: 5,
    hasLabData: true,
    hasMonitoringData: false,
    isIFCAligned: false,
    hasSEA: true,
    hasESIA: false,
  },
  {
    name: "Bahamas Coastal Resilience & Mangrove Restoration",
    country: "Bahamas",
    projectType: "Mangrove Restoration",
    projectCategory: "Climate & Environment",
    interventionType: "Environmental",
    lenderFramework: "GCF",
    latitude: 25.0343,
    longitude: -77.3963,
    investmentAmount: 35000000,
    floodRisk: 7,
    coastalExposure: 9,
    contaminationRisk: 3,
    regulatoryComplexity: 6,
    communitySensitivity: 7,
    waterStress: 5,
    hasLabData: false,
    hasMonitoringData: true,
    isIFCAligned: true,
    hasSEA: true,
    hasESIA: true,
  },
];

async function seedDemoProjects() {
  console.log("Seeding 7 demo projects...\n");

  for (const demo of DEMO_PROJECTS) {
    const analysis = analyzeProject({
      floodRisk: demo.floodRisk,
      coastalExposure: demo.coastalExposure,
      contaminationRisk: demo.contaminationRisk,
      regulatoryComplexity: demo.regulatoryComplexity,
      communitySensitivity: demo.communitySensitivity,
      waterStress: demo.waterStress,
      hasLabData: demo.hasLabData,
      hasMonitoringData: demo.hasMonitoringData,
      isIFCAligned: demo.isIFCAligned,
    });

    const persBreakdown = calculatePERS(
      analysis.riskScores,
      demo.interventionType,
      demo.projectType,
      demo.hasSEA,
      demo.hasESIA,
    );

    const interventionProfile = buildInterventionRiskProfile(demo.interventionType, analysis.riskScores);
    const capitalMode = recommendCapitalMode(persBreakdown.persScore, analysis.riskScores.dataConfidence, demo.interventionType);
    const monitoring = determineMonitoringIntensity(persBreakdown.persScore, analysis.riskScores.dataConfidence, demo.interventionType, capitalMode);

    const [project] = await db.insert(projectsTable).values({
      name: demo.name,
      country: demo.country,
      projectType: demo.projectType,
      projectCategory: demo.projectCategory,
      interventionType: demo.interventionType,
      capitalMode,
      lenderFramework: demo.lenderFramework,
      latitude: demo.latitude,
      longitude: demo.longitude,
      floodRisk: demo.floodRisk,
      coastalExposure: demo.coastalExposure,
      contaminationRisk: demo.contaminationRisk,
      regulatoryComplexity: demo.regulatoryComplexity,
      communitySensitivity: demo.communitySensitivity,
      waterStress: demo.waterStress,
      hasLabData: demo.hasLabData,
      hasMonitoringData: demo.hasMonitoringData,
      isIFCAligned: demo.isIFCAligned,
      hasSEA: demo.hasSEA,
      hasESIA: demo.hasESIA,
      environmentalRisk: analysis.riskScores.environmentalRisk,
      infrastructureRisk: analysis.riskScores.infrastructureRisk,
      humanExposureRisk: analysis.riskScores.humanExposureRisk,
      regulatoryRisk: analysis.riskScores.regulatoryRisk,
      dataConfidence: analysis.riskScores.dataConfidence,
      overallRisk: analysis.riskScores.overallRisk,
      persScore: persBreakdown.persScore,
      interventionRiskScore: interventionProfile.adjustedRisk,
      monitoringIntensity: monitoring.level,
      persBreakdown,
      interventionRiskProfile: interventionProfile,
      investmentAmount: demo.investmentAmount as any,
      delayRiskPercent: analysis.financialRisk.delayRiskPercent,
      costOverrunPercent: analysis.financialRisk.costOverrunPercent,
      covenantBreachPercent: analysis.financialRisk.covenantBreachPercent,
      reputationalRisk: analysis.financialRisk.reputationalRisk,
      decisionOutcome: analysis.decision.outcome,
      decisionConditions: JSON.stringify(analysis.decision.conditions),
      decisionInsight: analysis.decision.insight,
    }).returning();

    const signal = persBreakdown.persScore < 40 ? "PROCEED" : persBreakdown.persScore < 70 ? "CONDITION" : "DECLINE";

    console.log(`  [${signal}] ${demo.name}`);
    console.log(`    Country: ${demo.country} | Category: ${demo.projectCategory}`);
    console.log(`    PERS: ${persBreakdown.persScore.toFixed(1)} | Capital: ${capitalMode} | Monitoring: ${monitoring.level}`);
    console.log(`    Intervention: ${demo.interventionType} (risk: ${interventionProfile.adjustedRisk.toFixed(1)})`);
    console.log(`    SEA: ${demo.hasSEA ? "Yes" : "No"} | ESIA: ${demo.hasESIA ? "Yes" : "No"} | Framework: ${demo.lenderFramework || "None"}`);
    console.log("");
  }

  console.log("Demo seeding complete.");
  process.exit(0);
}

seedDemoProjects().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
