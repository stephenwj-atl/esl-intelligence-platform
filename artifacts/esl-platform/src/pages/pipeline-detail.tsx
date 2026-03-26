import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import {
  FileStack, Upload, Download, ArrowLeft, Loader2, Check, X,
  AlertTriangle, Shield, Gift, Building2, Layers, ChevronDown,
  ChevronUp, ArrowRight, FileText, BarChart3, Filter
} from "lucide-react";

const BASE = "/api";

interface Pipeline {
  id: number;
  name: string;
  description: string | null;
  orgType: string;
  frameworks: string[];
  thresholds: { maxRisk?: number; minConfidence?: number };
  capitalModeDefault: string;
  capitalConstraints: { totalEnvelope?: number; maxSingleProject?: number };
  status: string;
  projectCount: number;
}

interface ScreenedProject {
  id: number;
  name: string;
  country: string;
  projectType: string;
  investmentAmount: number;
  overallRisk: number;
  dataConfidence: number;
  decision: string;
  recommendedMode: string;
  blendedSplit: { grantPercent: number; loanPercent: number; grantAmount: number; loanAmount: number };
  frameworkCompliance: Array<{ framework: string; status: string; gaps: string[] }>;
  frameworkGaps: number;
  screeningResult: "ELIGIBLE" | "CONDITIONAL" | "INELIGIBLE";
}

interface ScreeningData {
  pipeline: Pipeline;
  summary: {
    total: number; eligible: number; conditional: number; ineligible: number;
    totalCapital: number; eligibleCapital: number; conditionalCapital: number;
    avgRisk: number; avgConfidence: number;
    capitalAllocation: { totalGrantComponent: number; totalLoanComponent: number; avgGrantPercent: number };
  };
  projects: ScreenedProject[];
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      values.push(current.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return obj;
    });
}

export default function PipelineDetail() {
  const [, params] = useRoute("/pipelines/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [screening, setScreening] = useState<ScreeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [filterResult, setFilterResult] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${BASE}/pipelines/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${BASE}/pipelines/${id}/screening`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([p, s]) => {
      setPipeline(p);
      if (s?.projects) setScreening(s);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const projects = parseCSV(text);

      if (projects.length === 0) {
        setUploadResult({ error: "No valid rows found in CSV" });
        setUploading(false);
        return;
      }

      const res = await fetch(`${BASE}/pipelines/${id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });
      if (!res.ok) { setUploadResult({ error: "Upload failed: server error" }); setUploading(false); return; }
      const result = await res.json();
      setUploadResult(result);

      const screenRes = await fetch(`${BASE}/pipelines/${id}/screening`);
      if (screenRes.ok) {
        const screenData = await screenRes.json();
        if (screenData?.projects) setScreening(screenData);
      }

      setPipeline(prev => prev ? { ...prev, projectCount: result.totalProjects || result.uploaded, status: "screened" } : prev);
    } catch {
      setUploadResult({ error: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "name,country,projectType,investmentAmount,floodRisk,coastalExposure,contaminationRisk,regulatoryComplexity,communitySensitivity,waterStress,hasLabData,hasMonitoringData,isIFCAligned";
    const example1 = "Kingston Desalination Plant,Jamaica,Infrastructure,15,7,8,4,6,5,9,true,false,false";
    const example2 = "Barbados Water Recycling,Barbados,Infrastructure,8,3,6,3,4,3,7,true,true,true";
    const csv = [headers, example1, example2].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading pipeline...</span>
        </div>
      </Layout>
    );
  }

  if (!pipeline) {
    return (
      <Layout>
        <div className="text-center py-20 text-muted-foreground">Pipeline not found</div>
      </Layout>
    );
  }

  const filteredProjects = screening?.projects.filter(p =>
    filterResult === "all" || p.screeningResult === filterResult.toUpperCase()
  ) || [];

  const resultColors = {
    ELIGIBLE: { bg: "bg-success/10", border: "border-success/40", text: "text-success" },
    CONDITIONAL: { bg: "bg-warning/10", border: "border-warning/40", text: "text-warning" },
    INELIGIBLE: { bg: "bg-destructive/10", border: "border-destructive/40", text: "text-destructive" },
  };

  return (
    <Layout>
      <AnimatedContainer>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/pipelines" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{pipeline.orgType}</Badge>
              <Badge variant="outline" className="text-[10px]">{pipeline.capitalModeDefault}</Badge>
              <Badge variant={pipeline.status === "screened" ? "success" : "outline"} className="text-[10px]">{pipeline.status}</Badge>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mt-1">{pipeline.name}</h1>
            {pipeline.description && <p className="text-sm text-muted-foreground">{pipeline.description}</p>}
          </div>
        </div>

        {(!screening || screening.projects.length === 0) && (
          <Card className="border-primary/20 p-8 mt-6">
            <div className="text-center max-w-lg mx-auto">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 w-fit mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">Upload Proposals</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Upload a CSV file with project proposals. Each row will be scored against your configured frameworks and thresholds.
              </p>

              <div className="flex items-center justify-center gap-3 mb-6">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" /> Download Template
                </Button>
                <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Scoring..." : "Upload CSV"}
                </Button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
                Required columns: <span className="font-mono">name, country, projectType, investmentAmount</span><br />
                Risk columns (0-10): <span className="font-mono">floodRisk, coastalExposure, contaminationRisk, regulatoryComplexity, communitySensitivity, waterStress</span><br />
                Boolean columns: <span className="font-mono">hasLabData, hasMonitoringData, isIFCAligned</span>
              </div>

              {uploadResult?.error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {uploadResult.error}
                </div>
              )}
            </div>
          </Card>
        )}

        {screening && screening.projects.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
              <Card className="border-success/30 bg-success/5 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Eligible</div>
                <div className="text-3xl font-mono font-black text-success">{screening.summary.eligible}</div>
                <div className="text-xs text-muted-foreground">${screening.summary.eligibleCapital}M capital</div>
              </Card>
              <Card className="border-warning/30 bg-warning/5 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Conditional</div>
                <div className="text-3xl font-mono font-black text-warning">{screening.summary.conditional}</div>
                <div className="text-xs text-muted-foreground">${screening.summary.conditionalCapital}M capital</div>
              </Card>
              <Card className="border-destructive/30 bg-destructive/5 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Ineligible</div>
                <div className="text-3xl font-mono font-black text-destructive">{screening.summary.ineligible}</div>
                <div className="text-xs text-muted-foreground">Does not meet criteria</div>
              </Card>
              <Card className="border-primary/30 bg-primary/5 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Capital Split</div>
                <div className="text-lg font-mono font-black text-primary">
                  {screening.summary.capitalAllocation.avgGrantPercent}% Grant
                </div>
                <div className="text-xs text-muted-foreground">
                  ${screening.summary.capitalAllocation.totalGrantComponent}M grant / ${screening.summary.capitalAllocation.totalLoanComponent}M loan
                </div>
              </Card>
            </div>

            <Card className="border-border/40 mb-6 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">
                    Screening Results — {screening.summary.total} Projects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    {["all", "eligible", "conditional", "ineligible"].map(f => (
                      <button key={f} onClick={() => setFilterResult(f)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${filterResult === f ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-3 h-3 mr-1" /> Add More
                  </Button>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              <div className="space-y-2">
                {filteredProjects.map(project => {
                  const rc = resultColors[project.screeningResult];
                  const isExpanded = expandedProject === project.id;
                  return (
                    <div key={project.id} className={`rounded-xl border ${rc.border} ${rc.bg} overflow-hidden`}>
                      <button onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        className="w-full text-left p-4 flex items-center gap-4">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-7 gap-3 items-center">
                          <div className="col-span-2 md:col-span-2">
                            <div className="text-sm font-semibold text-foreground">{project.name}</div>
                            <div className="text-xs text-muted-foreground">{project.country} · {project.projectType}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Amount</div>
                            <div className="text-sm font-mono font-bold">${project.investmentAmount}M</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Risk</div>
                            <div className={`text-sm font-mono font-bold ${project.overallRisk > 70 ? "text-destructive" : project.overallRisk > 40 ? "text-warning" : "text-success"}`}>
                              {project.overallRisk.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Confidence</div>
                            <div className="text-sm font-mono font-bold">{project.dataConfidence.toFixed(0)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Split</div>
                            <div className="text-sm font-mono font-bold text-primary">{project.blendedSplit.grantPercent}%G / {project.blendedSplit.loanPercent}%L</div>
                          </div>
                          <div className="text-center">
                            <Badge variant={project.screeningResult === "ELIGIBLE" ? "success" : project.screeningResult === "CONDITIONAL" ? "warning" : "destructive"}>
                              {project.screeningResult}
                            </Badge>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Capital Structure</div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Mode</span>
                                  <span className="font-semibold">{project.recommendedMode}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Grant</span>
                                  <span className="font-mono font-bold text-primary">${project.blendedSplit.grantAmount}M ({project.blendedSplit.grantPercent}%)</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Loan</span>
                                  <span className="font-mono font-bold text-warning">${project.blendedSplit.loanAmount}M ({project.blendedSplit.loanPercent}%)</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Decision</span>
                                  <Badge variant={project.decision === "PROCEED" ? "success" : project.decision === "CONDITION" ? "warning" : "destructive"} className="text-[9px]">
                                    {project.decision}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Framework Compliance</div>
                              <div className="space-y-1">
                                {project.frameworkCompliance.map((fc, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    {fc.status === "PASS" ? (
                                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                                    ) : fc.status === "PARTIAL" ? (
                                      <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                      <span className="font-medium text-foreground">{fc.framework}</span>
                                      {fc.gaps.length > 0 && (
                                        <div className="text-muted-foreground ml-0">{fc.gaps.join(" · ")}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <Link href={`/project/${project.id}`}>
                              <Button variant="outline" size="sm">
                                View Full Report <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </AnimatedContainer>
    </Layout>
  );
}
