import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Badge, AnimatedContainer, Button } from "@/components/ui";
import {
  Shield, ShieldCheck, ChevronRight, ExternalLink, Download,
  Loader2, CheckCircle2, AlertTriangle, Clock, XCircle,
  FileText
} from "lucide-react";
import {
  complianceApi,
  type ComplianceFramework,
  type ComplianceSummary,
  type ComplianceControl,
  type ControlStatus,
  type ComplianceExport,
} from "@/lib/compliance-api";

const STATUS_CONFIG: Record<ControlStatus, { label: string; color: string; bg: string; border: string; badge: "success" | "warning" | "outline" | "destructive"; icon: typeof CheckCircle2 }> = {
  Implemented: { label: "Implemented", color: "text-success", bg: "bg-success/10", border: "border-success/20", badge: "success", icon: CheckCircle2 },
  Partial: { label: "Partial", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", badge: "warning", icon: AlertTriangle },
  Planned: { label: "Planned", color: "text-muted-foreground", bg: "bg-secondary/30", border: "border-border/30", badge: "outline", icon: Clock },
  Gap: { label: "Gap", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", badge: "destructive", icon: XCircle },
};

function ScoreGauge({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-mono font-bold text-foreground">{score}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground mt-2 font-medium">{label}</span>}
    </div>
  );
}

function CategoryAccordion({ category, controls }: { category: string; controls: ComplianceControl[] }) {
  const [open, setOpen] = useState(false);
  const implemented = controls.filter(c => c.status === "Implemented").length;
  const total = controls.length;
  const score = Math.round(((controls.reduce((s, c) => s + (c.status === "Implemented" ? 1 : c.status === "Partial" ? 0.5 : 0), 0)) / total) * 100);

  return (
    <div className="border border-white/[0.05] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
          <span className="font-medium text-foreground text-sm truncate">{category}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${score}%`,
                  backgroundColor: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e",
                }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">{score}%</span>
          </div>
          <span className="text-xs text-muted-foreground">{implemented}/{total}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/[0.05]">
          {controls.map((control) => {
            const cfg = STATUS_CONFIG[control.status];
            const Icon = cfg.icon;
            return (
              <div key={control.id} className="px-4 py-3 border-b border-white/[0.03] last:border-b-0 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-primary/70">{control.id}</span>
                      <span className="text-sm font-medium text-foreground">{control.name}</span>
                      <Badge variant={cfg.badge} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{control.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {control.platformFeature && (
                        <span className="text-[11px] text-primary/80 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> {control.platformFeature}
                        </span>
                      )}
                      {control.evidence && (
                        <span className="text-[11px] text-foreground/50 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {control.evidence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CompliancePage() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFramework, setActiveFramework] = useState<string>("soc2");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      complianceApi.getFrameworks(),
      complianceApi.getSummary(),
    ]).then(([fw, sum]) => {
      setFrameworks(fw);
      setSummary(sum);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await complianceApi.getExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
          <h2 className="text-xl font-display font-semibold text-foreground">Loading Compliance Data...</h2>
        </div>
      </Layout>
    );
  }

  const selected = frameworks.find(f => f.id === activeFramework);
  const categories = selected ? Object.entries(selected.categoryScores) : [];

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Compliance & Security Posture</h1>
            <p className="text-muted-foreground mt-1">Real-time framework mapping and control status across SOC 2, ISO 27001, ISO 27701, and IFC Performance Standards.</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Report
          </Button>
        </div>

        {summary && (
          <AnimatedContainer delay={0.05}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Aggregate Compliance Posture</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                <div className="md:col-span-2 flex justify-center">
                  <ScoreGauge score={summary.overallScore} size={140} label="Overall Score" />
                </div>
                <div className="md:col-span-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                      <div className="text-2xl font-mono font-bold text-success">{summary.implemented}</div>
                      <div className="text-xs text-muted-foreground mt-1">Implemented</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                      <div className="text-2xl font-mono font-bold text-warning">{summary.partial}</div>
                      <div className="text-xs text-muted-foreground mt-1">Partial</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <div className="text-2xl font-mono font-bold text-muted-foreground">{summary.planned}</div>
                      <div className="text-xs text-muted-foreground mt-1">Planned</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="text-2xl font-mono font-bold text-destructive">{summary.gap}</div>
                      <div className="text-xs text-muted-foreground mt-1">Gap</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {summary.frameworks.map(fw => (
                      <button
                        key={fw.id}
                        onClick={() => setActiveFramework(fw.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          activeFramework === fw.id
                            ? "border-primary/40 bg-primary/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "border-white/[0.05] bg-card/30 hover:bg-secondary/20"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{fw.shortName}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold text-foreground">{fw.score}%</span>
                          <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${fw.score}%`,
                                backgroundColor: fw.score >= 80 ? "#10b981" : fw.score >= 60 ? "#f59e0b" : "#f43f5e",
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">{fw.implemented}/{fw.totalControls} controls met</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {selected && (
          <AnimatedContainer delay={0.1}>
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-white/[0.05] bg-card/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-display font-bold text-foreground">{selected.name}</h2>
                    <Badge variant="outline" className="text-[10px]">v{selected.version}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl">{selected.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <ScoreGauge score={selected.overallScore} size={80} />
                  <div className="text-right">
                    <div className="text-sm font-mono text-foreground">{selected.controls.length} controls</div>
                    <div className="text-xs text-muted-foreground">{categories.length} categories</div>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {categories.map(([catName, catScore]) => {
                  const catControls = selected.controls.filter(c => c.category === catName);
                  return (
                    <CategoryAccordion key={catName} category={catName} controls={catControls} />
                  );
                })}
              </div>
            </Card>
          </AnimatedContainer>
        )}

        <AnimatedContainer delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map(fw => {
              const totalImplemented = fw.controls.filter(c => c.status === "Implemented").length;
              const totalPartial = fw.controls.filter(c => c.status === "Partial").length;
              const totalPlanned = fw.controls.filter(c => c.status === "Planned").length;
              const totalGap = fw.controls.filter(c => c.status === "Gap").length;

              return (
                <Card
                  key={fw.id}
                  className={`p-5 cursor-pointer transition-all hover:bg-secondary/10 ${activeFramework === fw.id ? "border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : ""}`}
                  onClick={() => setActiveFramework(fw.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">{fw.shortName}</h3>
                    </div>
                    <span className="text-lg font-mono font-bold" style={{ color: fw.overallScore >= 80 ? "#10b981" : fw.overallScore >= 60 ? "#f59e0b" : "#f43f5e" }}>
                      {fw.overallScore}%
                    </span>
                  </div>
                  <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-secondary mb-3">
                    <div className="bg-success transition-all" style={{ width: `${(totalImplemented / fw.controls.length) * 100}%` }} />
                    <div className="bg-warning transition-all" style={{ width: `${(totalPartial / fw.controls.length) * 100}%` }} />
                    <div className="bg-muted-foreground/30 transition-all" style={{ width: `${(totalPlanned / fw.controls.length) * 100}%` }} />
                    <div className="bg-destructive transition-all" style={{ width: `${(totalGap / fw.controls.length) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> {totalImplemented}</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" /> {totalPartial}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {totalPlanned}</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" /> {totalGap}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}
