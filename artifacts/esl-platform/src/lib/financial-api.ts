const BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface ProjectFinancialImpact {
  project: { id: number; name: string; country: string; projectType: string; investmentAmount: number };
  loanPricing: { baseRate: number; riskPremium: number; confidencePenalty: number; totalAdjustment: number; finalRate: number };
  insurance: { basePremium: number; adjustedPremium: number; increase: number; multiplier: number; factors: string[] };
  covenant: { level: string; requirements: string[] };
  capitalConstraint: { highRiskAllocation: number; policyLimit: number; breach: boolean; reallocationRequired: boolean };
  totalImpact: { additionalFinancingCost: number; insuranceUplift: number; totalLifetimeImpact: number; loanTermYears: number };
}

export interface PortfolioFinancialImpact {
  totalFinancingCost: number;
  totalInsuranceUplift: number;
  totalRiskCost: number;
  projectCount: number;
  avgRateAdjustment: number;
  capitalConstraint: { highRiskAllocation: number; policyLimit: number; breach: boolean };
  projects: Array<{ id: number; name: string; overallRisk: number; rateAdjustment: number; finalRate: number; premiumIncrease: number; covenantLevel: string; lifetimeImpact: number }>;
}

export interface ESLComparison {
  withoutESL: { approach: string; riskPricing: string; discovery: string; covenants: string; financingCost: number; insuranceCost: number; lateDiscoveryCost: number; totalCost: number; issues: string[] };
  withESL: { approach: string; riskPricing: string; discovery: string; covenants: string; financingCost: number; insuranceCost: number; totalCost: number; advantages: string[] };
  savings: { total: number; financingReduction: number; insuranceReduction: number; lateDiscoveryAvoidance: number; roiMultiple: number };
  portfolioStats: { totalCapital: number; projectCount: number; avgRisk: number; avgConfidence: number };
}

export interface FinancialScenario {
  before: { rate: number; rateAdjustment: number; premium: number; premiumIncrease: number; covenantLevel: string; lifetimeImpact: number };
  after: { rate: number; rateAdjustment: number; premium: number; premiumIncrease: number; covenantLevel: string; lifetimeImpact: number };
  savings: { rateSavings: number; premiumSavings: number; lifetimeSavings: number };
  mitigations: string[];
}

export interface ProjectStructure {
  project: { id: number; name: string; country: string; projectType: string; investmentAmount: number };
  deploymentReadiness: string;
  recommendedMode: string;
  loan: {
    viable: boolean;
    conditions: string[];
    conditionsPrecedent: string[];
    riskMitigation: string[];
    covenantLevel: string;
    rate: number;
  };
  grant: {
    required: boolean;
    purpose: string;
    disbursementPhases: Array<{
      phase: number;
      name: string;
      conditions: string[];
      allocation: number;
      status: string;
    }>;
  };
  blended: {
    grantRequired: boolean;
    grantPurpose: string;
    grantPercent: number;
    loanViability: string;
    loanTriggers: string[];
    transitionMilestones: string[];
  };
}

export interface ProjectImpactAssessment {
  project: { id: number; name: string };
  deliveryRisk: { level: string; drivers: string[] };
  impactEfficiency: { score: number; factors: Array<{ factor: string; adjustment: number }> };
  monitoringIntensity: { level: string; requirements: string[] };
  disbursementRisk: { level: string; factors: string[] };
}

export interface PortfolioDeployment {
  capitalMix: {
    loan: { count: number; capital: number; percent: number };
    grant: { count: number; capital: number; percent: number };
    blended: { count: number; capital: number; percent: number };
  };
  readiness: {
    ready: { count: number; percent: number };
    conditional: { count: number; percent: number };
    notReady: { count: number; percent: number };
  };
  capitalEfficiency: { atRisk: number; atRiskPercent: number; drivers: string[] };
  structuringInsights: string[];
  projects: Array<{ id: number; name: string; recommendedMode: string; readiness: string; overallRisk: number; dataConfidence: number; investmentAmount: number }>;
}

export const financialApi = {
  getProjectImpact: (id: number) => fetchJson<ProjectFinancialImpact>(`/financial/project/${id}`),
  getPortfolioImpact: () => fetchJson<PortfolioFinancialImpact>("/financial/portfolio"),
  getComparison: () => fetchJson<ESLComparison>("/financial/comparison"),
  getScenario: (id: number) => fetchJson<FinancialScenario>(`/financial/scenario/${id}`),
  getProjectStructure: (id: number) => fetchJson<ProjectStructure>(`/financial/project/${id}/structure`),
  getProjectImpactAssessment: (id: number) => fetchJson<ProjectImpactAssessment>(`/financial/project/${id}/impact`),
  getPortfolioDeployment: () => fetchJson<PortfolioDeployment>("/financial/portfolio/deployment"),
};
