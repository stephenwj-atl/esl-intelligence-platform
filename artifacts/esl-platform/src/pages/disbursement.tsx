import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ArrowRightLeft, CheckCircle2, Clock, AlertTriangle, Shield, ChevronDown, ChevronRight, GitBranch } from "lucide-react";

const BASE = "/api";

const READINESS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  READY: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  CONDITIONALLY_READY: { label: "Conditionally Ready", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  NOT_READY: { label: "Not Ready", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const TRANSITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOAN_READY: { label: "Loan Ready", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  BLENDED_ELIGIBLE: { label: "Blended Eligible", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  GRANT_PHASE: { label: "Grant Phase", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  PRE_READINESS: { label: "Pre-Readiness", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

export default function DisbursementPage() {
  const [view, setView] = useState<"disbursement" | "transition">("disbursement");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.projects || [];
    },
  });

  const readinessCounts = {
    READY: projects.filter((p: any) => p.disbursementReadiness === "READY").length,
    CONDITIONALLY_READY: projects.filter((p: any) => p.disbursementReadiness === "CONDITIONALLY_READY").length,
    NOT_READY: projects.filter((p: any) => p.disbursementReadiness === "NOT_READY").length,
  };

  const transitionCounts = {
    LOAN_READY: projects.filter((p: any) => p.transitionReadiness === "LOAN_READY").length,
    BLENDED_ELIGIBLE: projects.filter((p: any) => p.transitionReadiness === "BLENDED_ELIGIBLE").length,
    GRANT_PHASE: projects.filter((p: any) => p.transitionReadiness === "GRANT_PHASE").length,
    PRE_READINESS: projects.filter((p: any) => p.transitionReadiness === "PRE_READINESS").length,
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <AnimatedContainer>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Disbursement & Transitions</h1>
              <p className="text-sm text-muted-foreground mt-1">Milestone-based disbursement readiness and instrument transition pathways</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
              <button onClick={() => setView("disbursement")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "disbursement" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <Banknote className="h-4 w-4 inline mr-1.5" />Disbursement
              </button>
              <button onClick={() => setView("transition")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "transition" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <ArrowRightLeft className="h-4 w-4 inline mr-1.5" />Transitions
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {view === "disbursement" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(readinessCounts).map(([key, count], i) => {
                const cfg = READINESS_CONFIG[key];
                return (
                  <AnimatedContainer key={key} delay={0.05 * (i + 1)}>
                    <Card className={`p-4 border ${cfg.bg}`}>
                      <div className="text-xs text-muted-foreground">{cfg.label}</div>
                      <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                      <div className="text-xs text-muted-foreground mt-1">projects</div>
                    </Card>
                  </AnimatedContainer>
                );
              })}
            </div>

            <AnimatedContainer delay={0.2}>
              <Card className="p-0">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-foreground">Disbursement Milestones by Project</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {projects.map((p: any) => (
                    <DisbursementProjectRow
                      key={p.id}
                      project={p}
                      expanded={expandedId === p.id}
                      onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    />
                  ))}
                </div>
              </Card>
            </AnimatedContainer>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(transitionCounts).map(([key, count], i) => {
                const cfg = TRANSITION_CONFIG[key];
                return (
                  <AnimatedContainer key={key} delay={0.05 * (i + 1)}>
                    <Card className={`p-4 border ${cfg.bg}`}>
                      <div className="text-xs text-muted-foreground">{cfg.label}</div>
                      <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                      <div className="text-xs text-muted-foreground mt-1">projects</div>
                    </Card>
                  </AnimatedContainer>
                );
              })}
            </div>

            <AnimatedContainer delay={0.25}>
              <Card className="p-0">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-foreground">Transition Pathways</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {projects.map((p: any) => (
                    <TransitionProjectRow
                      key={p.id}
                      project={p}
                      expanded={expandedId === p.id}
                      onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    />
                  ))}
                </div>
              </Card>
            </AnimatedContainer>
          </>
        )}
      </div>
    </Layout>
  );
}

function DisbursementProjectRow({ project, expanded, onToggle }: { project: any; expanded: boolean; onToggle: () => void }) {
  const { data } = useQuery({
    queryKey: ["project-outcomes", project.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects/${project.id}/outcomes`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: expanded,
  });

  const milestones = data?.milestones || [];
  const completed = milestones.filter((m: any) => m.currentStatus === "completed").length;
  const total = milestones.length;

  const readiness = READINESS_CONFIG[project.disbursementReadiness] || { label: "Unknown", color: "text-muted-foreground", bg: "" };
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
        <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
          <div className="text-xs text-muted-foreground">{project.country} &middot; {project.instrumentType || "N/A"}</div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs border ${readiness.bg} ${readiness.color}`}>{readiness.label}</span>
      </button>
      {expanded && (
        <div className="px-6 pb-4 space-y-2 bg-white/[0.01]">
          {milestones.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>Progress: {completed}/{total} milestones completed</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
                </div>
              </div>
              {milestones.map((ms: any, i: number) => (
                <div key={ms.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="text-xs text-muted-foreground w-6">{i + 1}.</div>
                  <div className={`w-2 h-2 rounded-full ${ms.currentStatus === "completed" ? "bg-emerald-500" : ms.currentStatus === "blocked" ? "bg-red-500" : ms.currentStatus === "in_progress" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                  <div className="flex-1 text-sm text-foreground">{ms.milestoneName}</div>
                  <span className="text-xs text-muted-foreground">{ms.milestoneType}</span>
                  {ms.gatingEffect && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{ms.gatingEffect.replace(/_/g, " ")}</span>}
                  <StatusDot status={ms.currentStatus} />
                </div>
              ))}
            </>
          ) : (
            <div className="py-3 text-center text-muted-foreground text-sm">No milestones recorded</div>
          )}
        </div>
      )}
    </div>
  );
}

function TransitionProjectRow({ project, expanded, onToggle }: { project: any; expanded: boolean; onToggle: () => void }) {
  const { data } = useQuery({
    queryKey: ["project-outcomes", project.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects/${project.id}/outcomes`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: expanded,
  });

  const transitions = data?.transitions || [];
  const trCfg = TRANSITION_CONFIG[project.transitionReadiness] || { label: "Unknown", color: "text-muted-foreground", bg: "" };
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
        <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
          <div className="text-xs text-muted-foreground">{project.country} &middot; {project.instrumentType || "N/A"}</div>
        </div>
        {project.persScore != null && (
          <span className={`text-xs font-mono ${project.persScore > 70 ? "text-red-400" : project.persScore > 40 ? "text-amber-400" : "text-emerald-400"}`}>
            PERS: {project.persScore}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded text-xs border ${trCfg.bg} ${trCfg.color}`}>{trCfg.label}</span>
      </button>
      {expanded && (
        <div className="px-6 pb-4 space-y-2 bg-white/[0.01]">
          {transitions.length > 0 ? (
            transitions.map((t: any) => (
              <div key={t.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <GitBranch className="h-4 w-4 text-cyan-400" />
                  <span className="px-2 py-0.5 rounded text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">{t.fromInstrument}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{t.toInstrument}</span>
                  {t.timeHorizon && <span className="text-xs text-muted-foreground ml-auto">{t.timeHorizon}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {t.transitionTrigger && <div><span className="text-muted-foreground">Trigger:</span> <span className="text-foreground">{t.transitionTrigger}</span></div>}
                  {t.validationCriteria && <div><span className="text-muted-foreground">Validation:</span> <span className="text-foreground">{t.validationCriteria}</span></div>}
                  {t.confidenceThreshold && <div><span className="text-muted-foreground">Confidence Threshold:</span> <span className="text-cyan-400 font-mono">{t.confidenceThreshold}%</span></div>}
                  {t.responsibleReviewer && <div><span className="text-muted-foreground">Reviewer:</span> <span className="text-foreground">{t.responsibleReviewer}</span></div>}
                </div>
              </div>
            ))
          ) : (
            <div className="py-3 text-center text-muted-foreground text-sm">No transition pathways defined</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const labels: Record<string, string> = { completed: "Completed", in_progress: "In Progress", pending: "Pending", blocked: "Blocked", waived: "Waived" };
  const colors: Record<string, string> = { completed: "text-emerald-400", in_progress: "text-blue-400", pending: "text-muted-foreground", blocked: "text-red-400", waived: "text-amber-400" };
  return <span className={`text-xs font-medium ${colors[status] || "text-muted-foreground"}`}>{labels[status] || status}</span>;
}
