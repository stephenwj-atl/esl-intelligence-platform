const BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patchJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface FrameworkAlignment {
  id: number;
  projectId: number;
  framework: string;
  standard: string;
  status: string;
  gap: string | null;
  severity: string;
}

export interface Covenant {
  id: number;
  projectId: number;
  category: string;
  description: string;
  triggerCondition: string;
  status: string;
}

export interface EsapItem {
  id: number;
  projectId: number;
  action: string;
  owner: string;
  deadline: string;
  status: string;
  evidence: string | null;
}

export interface MonitoringEvent {
  id: number;
  projectId: number;
  date: string;
  type: string;
  result: string;
  status: string;
  findings: string | null;
}

export interface AuditLogEntry {
  id: number;
  projectId: number | null;
  action: string;
  user: string;
  details: string;
  createdAt: string;
}

export interface GovernanceSummary {
  covenantCompliance: number;
  covenantsMet: number;
  covenantsTotal: number;
  covenantsBreach: number;
  esapCompletion: number;
  esapComplete: number;
  esapTotal: number;
  esapOverdue: number;
  monitoringEvents: number;
  breachCount: number;
  breaches: Array<{
    projectId: number;
    issue: string;
    type: string;
    severity: string;
  }>;
}

export interface ProjectReport {
  project: any;
  riskScores: any;
  financialRisk: any;
  framework: FrameworkAlignment[];
  covenants: Covenant[];
  covenantSummary: { total: number; met: number; compliance: number };
  esapItems: EsapItem[];
  esapSummary: { total: number; complete: number; completion: number };
  monitoring: MonitoringEvent[];
  auditLog: AuditLogEntry[];
  generatedAt: string;
}

export const governanceApi = {
  getFrameworkAlignment: (projectId: number) =>
    fetchJson<FrameworkAlignment[]>(`/projects/${projectId}/framework-alignment`),

  getCovenants: (projectId: number) =>
    fetchJson<Covenant[]>(`/projects/${projectId}/covenants`),

  updateCovenant: (id: number, status: string) =>
    patchJson<Covenant>(`/covenants/${id}`, { status }),

  getEsap: (projectId: number) =>
    fetchJson<EsapItem[]>(`/projects/${projectId}/esap`),

  updateEsap: (id: number, status: string, evidence?: string) =>
    patchJson<EsapItem>(`/esap/${id}`, { status, evidence }),

  getMonitoring: (projectId: number) =>
    fetchJson<MonitoringEvent[]>(`/projects/${projectId}/monitoring`),

  addMonitoringEvent: (projectId: number, data: { date: string; type: string; result: string; status?: string; findings?: string }) =>
    postJson<MonitoringEvent>(`/projects/${projectId}/monitoring`, data),

  getAuditLog: (projectId: number) =>
    fetchJson<AuditLogEntry[]>(`/projects/${projectId}/audit-log`),

  getGlobalAuditLog: () =>
    fetchJson<AuditLogEntry[]>(`/audit-log`),

  getGovernanceSummary: () =>
    fetchJson<GovernanceSummary>(`/governance/summary`),

  getProjectReport: (projectId: number) =>
    fetchJson<ProjectReport>(`/projects/${projectId}/report`),
};
