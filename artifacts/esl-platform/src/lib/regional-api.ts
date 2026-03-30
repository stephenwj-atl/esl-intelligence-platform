const BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface AuthoritySummary {
  ceri: number;
  avgConfidence: number;
  coveragePct: number;
  totalCountries: number;
  totalProjects: number;
  dataMoat: {
    projectsAnalyzed: number;
    labSamples: number;
    monitoringPoints: number;
    countriesCovered: number;
    dataPoints: number;
  };
  dataCoverage: { high: number; medium: number; low: number };
  highRiskCountries: Array<{ country: string; riskScore: number; confidence: number }>;
  sectorOverview: Array<{ sector: string; avgRisk: number; avgConfidence: number; sampleSize: number }>;
  countries: Array<{
    country: string;
    riskScore: number;
    infrastructureScore: number;
    waterStressScore: number;
    confidence: number;
  }>;
  dataProvenance?: {
    status: "SIMULATED" | "LIVE";
    label: string;
    detail: string;
    realSources: string[];
    simulatedSources: string[];
  };
}

export interface RegionalIndices {
  ceri: number;
  avgConfidence: number;
  countriesCount: number;
  countries: Array<{
    country: string;
    current: { year: number; riskScore: number; infrastructureScore: number; waterStressScore: number; confidence: number };
    trend: Array<{ year: number; riskScore: number; infrastructureScore: number; waterStressScore: number; confidence: number }>;
  }>;
}

export interface ProjectBenchmark {
  project: { id: number; name: string; country: string; sector: string; risk: number };
  regional: { country: string; avgRisk: number | null; diff: number | null; diffLabel: string | null; datasetAverages: Record<string, number> };
  sector: { name: string; avgRisk: number | null; diff: number | null; diffLabel: string | null; sampleSize: number };
  percentile: number;
  percentileLabel: string;
  countryProjectCount: number;
  sectorProjectCount: number;
}

export interface PortfolioBenchmark {
  portfolioAvg: number;
  regionalAvg: number;
  diff: number;
  diffLabel: string;
  portfolioProjects: number;
  countriesBenchmarked: number;
}

export interface SectorBenchmark {
  sector: string;
  metric: string;
  current: { year: number; avgRisk: number; avgConfidence: number; sampleSize: number };
  trend: Array<{ year: number; avgRisk: number; avgConfidence: number; sampleSize: number }>;
}

export interface RegionalConfidence {
  total: number;
  high: { count: number; pct: number };
  medium: { count: number; pct: number };
  low: { count: number; pct: number };
  countries: Array<{ country: string; confidence: number; level: string }>;
}

export interface Insight {
  category: string;
  insight: string;
  severity: string;
  dataPoints: number;
}

export const regionalApi = {
  getAuthoritySummary: () => fetchJson<AuthoritySummary>("/regional/authority-summary"),
  getIndices: () => fetchJson<RegionalIndices>("/regional/indices"),
  getCountryTrend: (country: string) => fetchJson<any>(`/regional/indices/${encodeURIComponent(country)}`),
  getSectorBenchmarks: () => fetchJson<SectorBenchmark[]>("/regional/benchmarks/sector"),
  getProjectBenchmark: (id: number) => fetchJson<ProjectBenchmark>(`/regional/benchmarks/project/${id}`),
  getPortfolioBenchmark: () => fetchJson<PortfolioBenchmark>("/regional/benchmarks/portfolio"),
  getConfidence: () => fetchJson<RegionalConfidence>("/regional/confidence"),
  getInsights: () => fetchJson<Insight[]>("/regional/insights"),
};
