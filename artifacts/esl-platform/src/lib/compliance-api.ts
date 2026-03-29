const BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export type ControlStatus = "Implemented" | "Partial" | "Planned" | "Gap";

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ControlStatus;
  evidence: string | null;
  platformFeature: string | null;
  lastAssessed: string;
}

export interface CategoryScore {
  total: number;
  implemented: number;
  partial: number;
  planned: number;
  gap: number;
  score: number;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  controls: ComplianceControl[];
  overallScore: number;
  categoryScores: Record<string, CategoryScore>;
}

export interface FrameworkScore {
  id: string;
  name: string;
  shortName: string;
  score: number;
  totalControls: number;
  implemented: number;
  partial: number;
  planned: number;
  gap: number;
}

export interface ComplianceSummary {
  overallScore: number;
  totalControls: number;
  implemented: number;
  partial: number;
  planned: number;
  gap: number;
  frameworks: FrameworkScore[];
  lastUpdated: string;
}

export interface ComplianceExport {
  title: string;
  generatedAt: string;
  overallScore: number;
  totalControls: number;
  implemented: number;
  partial: number;
  planned: number;
  gap: number;
  frameworks: Array<{
    id: string;
    name: string;
    version: string;
    overallScore: number;
    categoryScores: Record<string, CategoryScore>;
    controls: Array<{
      id: string;
      name: string;
      category: string;
      status: ControlStatus;
      evidence: string | null;
      platformFeature: string | null;
    }>;
  }>;
}

export const complianceApi = {
  getFrameworks: () => fetchJson<ComplianceFramework[]>("/compliance/frameworks"),
  getFramework: (id: string) => fetchJson<ComplianceFramework>(`/compliance/frameworks/${id}`),
  getSummary: () => fetchJson<ComplianceSummary>("/compliance/summary"),
  getExport: () => fetchJson<ComplianceExport>("/compliance/export"),
};
