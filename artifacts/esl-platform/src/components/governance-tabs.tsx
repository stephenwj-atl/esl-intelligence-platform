import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button } from "@/components/ui";
import {
  governanceApi,
  type FrameworkAlignment,
  type Covenant,
  type EsapItem,
  type MonitoringEvent,
  type AuditLogEntry,
} from "@/lib/governance-api";
import {
  Shield, FileCheck, ClipboardList, Activity, History,
  AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown,
  FileText, AlertOctagon
} from "lucide-react";

const severityColor: Record<string, string> = {
  Critical: "text-destructive",
  High: "text-destructive",
  Medium: "text-warning",
  Low: "text-success",
};

const statusBadge: Record<string, string> = {
  Compliant: "success",
  Partial: "warning",
  "Non-Compliant": "destructive",
  "Not Applicable": "outline",
  Applicable: "outline",
  Aligned: "success",
  "Gaps Identified": "warning",
  "Below Threshold": "outline",
};

export function FrameworkAlignmentTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<FrameworkAlignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceApi.getFrameworkAlignment(projectId).then(d => { setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading framework alignment...</div>;

  const ifcItems = data.filter(d => d.framework === "IFC");
  const otherItems = data.filter(d => d.framework !== "IFC");
  const compliant = data.filter(d => d.status === "Compliant" || d.status === "Aligned").length;
  const total = data.filter(d => d.status !== "Not Applicable" && d.status !== "Below Threshold").length;
  const alignmentScore = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Framework Alignment
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Mapping against IFC Performance Standards, Equator Principles, and IDB Invest Policy</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-primary">{alignmentScore}%</div>
          <div className="text-xs text-muted-foreground">Alignment Score</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-secondary/30 border-b border-border/50">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">IFC Performance Standards (PS1–PS8)</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left px-4 py-3 font-semibold">Standard</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Gap</th>
              <th className="text-center px-4 py-3 font-semibold">Severity</th>
            </tr>
          </thead>
          <tbody>
            {ifcItems.map(item => (
              <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/20">
                <td className="px-4 py-3 font-medium">{item.standard}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge[item.status] as any || "outline"}>{item.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.gap || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-mono font-bold text-xs ${severityColor[item.severity] || ""}`}>{item.severity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {otherItems.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/50">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Additional Frameworks</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left px-4 py-3 font-semibold">Framework</th>
                <th className="text-left px-4 py-3 font-semibold">Standard</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Gap</th>
                <th className="text-center px-4 py-3 font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody>
              {otherItems.map(item => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{item.framework}</td>
                  <td className="px-4 py-3">{item.standard}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[item.status] as any || "outline"}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.gap || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono font-bold text-xs ${severityColor[item.severity] || ""}`}>{item.severity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

const covenantStatusColors: Record<string, string> = {
  Met: "success",
  "In Progress": "warning",
  Pending: "outline",
  Breach: "destructive",
};

export function CovenantsTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<Covenant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    governanceApi.getCovenants(projectId).then(d => { setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await governanceApi.updateCovenant(id, newStatus);
    load();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading covenants...</div>;

  const met = data.filter(c => c.status === "Met").length;
  const breached = data.filter(c => c.status === "Breach").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-primary" /> Investment Covenants
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Auto-generated enforceable conditions from risk analysis</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-success">{met}</div>
            <div className="text-xs text-muted-foreground">Met</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-warning">{data.filter(c => c.status === "In Progress" || c.status === "Pending").length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          {breached > 0 && (
            <div>
              <div className="text-2xl font-mono font-bold text-destructive">{breached}</div>
              <div className="text-xs text-muted-foreground">Breach</div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {data.map((c, i) => (
          <Card key={c.id} className={`p-4 ${c.status === "Breach" ? "border-destructive/50 bg-destructive/5" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">COV-{String(i + 1).padStart(3, "0")}</span>
                  <Badge variant={c.category === "Environmental" ? "default" : c.category === "Social" ? "warning" : "outline"} className="text-[10px]">{c.category}</Badge>
                </div>
                <p className="text-sm font-medium">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Trigger: {c.triggerCondition}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id, e.target.value)}
                  className="bg-secondary border border-border rounded px-2 py-1 text-xs font-mono"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Met">Met</option>
                  <option value="Breach">Breach</option>
                </select>
                <Badge variant={covenantStatusColors[c.status] as any}>{c.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const esapStatusColors: Record<string, string> = {
  Complete: "success",
  "In Progress": "warning",
  "Not Started": "outline",
  Overdue: "destructive",
};

export function EsapTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<EsapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    governanceApi.getEsap(projectId).then(d => { setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await governanceApi.updateEsap(id, newStatus);
    load();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading ESAP...</div>;

  const complete = data.filter(e => e.status === "Complete").length;
  const completion = data.length > 0 ? Math.round((complete / data.length) * 100) : 0;
  const overdue = data.filter(e => e.status === "Overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary" /> Environmental & Social Action Plan
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Timeline-tracked action items with ownership and evidence</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-primary">{completion}%</div>
          <div className="text-xs text-muted-foreground">ESAP Complete</div>
        </div>
      </div>

      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${completion}%` }} />
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/30">
          <AlertOctagon className="w-4 h-4" />
          {overdue} action item{overdue > 1 ? "s" : ""} overdue — escalation may be required
        </div>
      )}

      <div className="space-y-3">
        {data.map((item, i) => (
          <Card key={item.id} className={`p-4 ${item.status === "Overdue" ? "border-destructive/50 bg-destructive/5" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">ESAP-{String(i + 1).padStart(3, "0")}</span>
                  <Badge variant="outline" className="text-[10px]">{item.deadline}</Badge>
                </div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground mt-1">Owner: {item.owner}</p>
                {item.evidence && (
                  <p className="text-xs text-success mt-1 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> {item.evidence}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className="bg-secondary border border-border rounded px-2 py-1 text-xs font-mono"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Complete">Complete</option>
                  <option value="Overdue">Overdue</option>
                </select>
                <Badge variant={esapStatusColors[item.status] as any}>{item.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const monitoringTypeIcon: Record<string, any> = {
  "Site Visit": Activity,
  "Lab Test": FileCheck,
  "Community Review": ClipboardList,
  Audit: Shield,
};

export function MonitoringTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<MonitoringEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    governanceApi.getMonitoring(projectId).then(d => { setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading monitoring events...</div>;

  const verified = data.filter(m => m.status === "Verified").length;
  const escalated = data.filter(m => m.status === "Escalated").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" /> Monitoring Events
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Site visits, lab tests, community reviews, and audits</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-success">{verified}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
          {escalated > 0 && (
            <div>
              <div className="text-2xl font-mono font-bold text-destructive">{escalated}</div>
              <div className="text-xs text-muted-foreground">Escalated</div>
            </div>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No monitoring events recorded. Deploy monitoring stations to begin data collection.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Result</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Findings</th>
              </tr>
            </thead>
            <tbody>
              {data.map(event => {
                const Icon = monitoringTypeIcon[event.type] || Activity;
                return (
                  <tr key={event.id} className={`border-b border-border/30 hover:bg-secondary/20 ${event.status === "Escalated" ? "bg-destructive/5" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">{event.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {event.type}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={event.result === "Pass" ? "success" : event.result === "Fail" ? "destructive" : "warning"}>
                        {event.result}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={event.status === "Verified" ? "success" : "destructive"}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{event.findings || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function AuditTrailTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceApi.getAuditLog(projectId).then(d => { setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading audit trail...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center">
          <History className="w-5 h-5 mr-2 text-primary" /> Audit Trail
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Complete record of all risk changes, covenant updates, and monitoring results</p>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No audit entries found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.map(entry => (
                <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      entry.action.includes("Breach") || entry.action.includes("Escalation") ? "destructive" :
                      entry.action.includes("Updated") || entry.action.includes("Complete") ? "success" :
                      "outline"
                    }>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.user}</td>
                  <td className="px-4 py-3 text-xs text-foreground/80">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function ReportTab({ projectId }: { projectId: number }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await governanceApi.getProjectReport(projectId);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" /> Institutional Report
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Generate Pre-IC or Post-Close monitoring reports</p>
        </div>
        <Button onClick={generateReport} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {report && (
        <Card className="p-8 bg-[#0f0f0f] border-primary/20" id="report-content">
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center border-b border-border/50 pb-6">
              <h2 className="text-2xl font-display font-bold text-primary">ESL INTELLIGENCE</h2>
              <h3 className="text-lg font-semibold mt-2">Environmental & Social Risk Assessment Report</h3>
              <p className="text-sm text-muted-foreground mt-1">{report.project.name} — {report.project.country}</p>
              <p className="text-xs text-muted-foreground mt-1">Generated: {new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Executive Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className={`text-3xl font-mono font-bold ${report.project.overallRisk > 70 ? "text-destructive" : report.project.overallRisk > 40 ? "text-warning" : "text-success"}`}>
                    {report.project.overallRisk.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Overall Risk</div>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-3xl font-mono font-bold text-primary">{report.project.dataConfidence.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Data Confidence</div>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <Badge variant={report.project.decisionOutcome === "PROCEED" ? "success" : report.project.decisionOutcome === "CONDITION" ? "warning" : "destructive"} className="text-lg px-4 py-1">
                    {report.project.decisionOutcome}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2">Decision Signal</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Risk Summary</h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                {Object.entries(report.riskScores).map(([key, val]) => (
                  <div key={key} className="p-3 bg-secondary/30 rounded-lg">
                    <div className="font-mono font-bold">{(val as number).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Covenant Status</h4>
              <p className="text-sm mb-2">{report.covenantSummary.met} of {report.covenantSummary.total} covenants met ({report.covenantSummary.compliance}% compliance)</p>
              <div className="space-y-1">
                {report.covenants.map((c: any) => (
                  <div key={c.id} className="flex justify-between text-xs py-1 border-b border-border/20">
                    <span>{c.description}</span>
                    <Badge variant={covenantStatusColors[c.status] as any} className="text-[10px]">{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">ESAP Progress</h4>
              <p className="text-sm mb-2">{report.esapSummary.complete} of {report.esapSummary.total} items complete ({report.esapSummary.completion}%)</p>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full" style={{ width: `${report.esapSummary.completion}%` }} />
              </div>
            </div>

            {report.monitoring.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Monitoring Findings</h4>
                <div className="space-y-1">
                  {report.monitoring.map((m: any) => (
                    <div key={m.id} className="flex justify-between text-xs py-1 border-b border-border/20">
                      <span>{m.date} — {m.type}: {m.findings || m.result}</span>
                      <Badge variant={m.status === "Verified" ? "success" : "destructive"} className="text-[10px]">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export function BreachAlert({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [breaches, setBreaches] = useState<any[]>([]);
  
  useEffect(() => {
    Promise.all([
      governanceApi.getCovenants(projectId),
      governanceApi.getEsap(projectId),
      governanceApi.getMonitoring(projectId),
    ]).then(([covenants, esap, monitoring]) => {
      const items: any[] = [];
      covenants.filter(c => c.status === "Breach").forEach(c => items.push({ type: "Covenant Breach", issue: c.description, severity: "High" }));
      esap.filter(e => e.status === "Overdue").forEach(e => items.push({ type: "ESAP Overdue", issue: e.action, severity: "Medium" }));
      monitoring.filter(m => m.status === "Escalated").forEach(m => items.push({ type: "Monitoring Escalation", issue: m.findings || m.result, severity: "High" }));
      setBreaches(items);
    });
  }, [projectId]);

  if (breaches.length === 0) return null;

  return (
    <Card className="p-4 border-destructive/50 bg-destructive/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h4 className="text-sm font-bold text-destructive uppercase tracking-wider">Breach / Escalation Detected</h4>
      </div>
      <div className="space-y-2">
        {breaches.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{b.type}:</span> {b.issue}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Recommended: Escalate to Investment Officer for review</p>
    </Card>
  );
}
