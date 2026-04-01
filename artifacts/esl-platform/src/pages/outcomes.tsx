import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, BarChart3, AlertTriangle, CheckCircle2, Clock, Activity, ChevronRight, ChevronDown } from "lucide-react";

const BASE = "/api";

const METRIC_CATEGORIES: Record<string, { label: string; color: string }> = {
  climate_resilience: { label: "Climate Resilience", color: "text-cyan-400" },
  economic: { label: "Economic", color: "text-emerald-400" },
  social: { label: "Social", color: "text-violet-400" },
  environmental: { label: "Environmental", color: "text-green-400" },
  governance: { label: "Governance", color: "text-amber-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  planned: { label: "Planned", color: "text-muted-foreground", icon: Clock },
  in_progress: { label: "In Progress", color: "text-blue-400", icon: Activity },
  achieved: { label: "Achieved", color: "text-emerald-400", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "text-amber-400", icon: AlertTriangle },
  abandoned: { label: "Abandoned", color: "text-red-400", icon: AlertTriangle },
};

export default function OutcomesPage() {
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.projects || [];
    },
  });

  const projectsWithOutcomes = projects.filter((p: any) =>
    p.sectorFamily || p.instrumentType || p.layeredScores?.outcomeDeliveryScore
  );

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <AnimatedContainer>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Outcomes Framework</h1>
              <p className="text-sm text-muted-foreground mt-1">Theory of change, outcome metrics, and delivery risk across the portfolio</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                {projectsWithOutcomes.length} Projects with Outcomes
              </div>
            </div>
          </div>
        </AnimatedContainer>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AnimatedContainer delay={0.05}>
            <SummaryCard icon={Target} label="Total Projects" value={projects.length} color="text-cyan-400" />
          </AnimatedContainer>
          <AnimatedContainer delay={0.1}>
            <SummaryCard icon={TrendingUp} label="With Outcomes" value={projectsWithOutcomes.length} color="text-emerald-400" />
          </AnimatedContainer>
          <AnimatedContainer delay={0.15}>
            <SummaryCard icon={BarChart3} label="Avg Delivery Risk" value={avgNestedScore(projectsWithOutcomes, "layeredScores", "outcomeDeliveryScore")} color="text-amber-400" suffix="%" />
          </AnimatedContainer>
          <AnimatedContainer delay={0.2}>
            <SummaryCard icon={Activity} label="With Instruments" value={projects.filter((p: any) => p.instrumentType).length} color="text-violet-400" />
          </AnimatedContainer>
        </div>

        <AnimatedContainer delay={0.25}>
          <Card className="p-0">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-foreground">Project Outcomes</h2>
            </div>
            {projects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No projects found</div>
            ) : (
              <div className="divide-y divide-white/5">
                {projects.map((project: any) => (
                  <ProjectOutcomeRow
                    key={project.id}
                    project={project}
                    expanded={expandedProject === project.id}
                    onToggle={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}

function SummaryCard({ icon: Icon, label, value, color, suffix = "" }: { icon: any; label: string; value: number | string; color: string; suffix?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}{suffix}</div>
        </div>
      </div>
    </Card>
  );
}

function ProjectOutcomeRow({ project, expanded, onToggle }: { project: any; expanded: boolean; onToggle: () => void }) {
  const { data: outcomeData } = useQuery({
    queryKey: ["project-outcomes", project.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects/${project.id}/outcomes`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: expanded,
  });

  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
        <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
          <div className="text-xs text-muted-foreground">{project.country} &middot; {project.sectorFamily || project.projectType || "Unclassified"}</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {project.instrumentType && (
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{project.instrumentType}</span>
          )}
          {project.layeredScores?.outcomeDeliveryScore != null && (
            <span className={`font-mono ${scoreColor(project.layeredScores.outcomeDeliveryScore)}`}>ODR: {project.layeredScores.outcomeDeliveryScore}</span>
          )}
          {project.disbursementReadiness && (
            <ReadinessBadge status={project.disbursementReadiness} />
          )}
        </div>
      </button>

      {expanded && outcomeData && (
        <div className="px-6 pb-4 space-y-4 bg-white/[0.01]">
          {outcomeData.outcome && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outcomeData.outcome.theoryOfChange && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Theory of Change</div>
                  <div className="text-sm text-foreground">{outcomeData.outcome.theoryOfChange}</div>
                </div>
              )}
              {outcomeData.outcome.outcomesSummary && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Outcomes Summary</div>
                  <div className="text-sm text-foreground">{outcomeData.outcome.outcomesSummary}</div>
                </div>
              )}
              <ScoreBar label="Outcome Delivery Risk" value={outcomeData.outcome.outcomeDeliveryRiskScore} />
              <ScoreBar label="Implementation Capacity" value={outcomeData.outcome.implementationCapacityScore} />
              <ScoreBar label="Outcome Confidence" value={outcomeData.outcome.outcomeConfidenceScore} />
              <ScoreBar label="Disbursement Readiness" value={outcomeData.outcome.disbursementReadinessScore} />
            </div>
          )}

          {outcomeData.metrics?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Outcome Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {outcomeData.metrics.map((m: any) => (
                  <MetricCard key={m.id} metric={m} />
                ))}
              </div>
            </div>
          )}

          {outcomeData.milestones?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Disbursement Milestones</h4>
              <div className="space-y-1">
                {outcomeData.milestones.map((ms: any) => (
                  <MilestoneRow key={ms.id} milestone={ms} />
                ))}
              </div>
            </div>
          )}

          {outcomeData.transitions?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Transition Pathways</h4>
              <div className="space-y-2">
                {outcomeData.transitions.map((t: any) => (
                  <TransitionCard key={t.id} transition={t} />
                ))}
              </div>
            </div>
          )}

          {!outcomeData.outcome && (!outcomeData.metrics || outcomeData.metrics.length === 0) && (
            <div className="py-4 text-center text-muted-foreground text-sm">No outcome data recorded for this project</div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-bold ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${value > 70 ? "bg-red-500" : value > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: any }) {
  const cat = METRIC_CATEGORIES[metric.category] || { label: metric.category, color: "text-muted-foreground" };
  const statusCfg = STATUS_CONFIG[metric.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusCfg.icon;
  const progress = metric.targetValue > 0 ? Math.min(100, ((metric.currentValue || 0) / metric.targetValue) * 100) : 0;

  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-sm font-medium text-foreground">{metric.metricName}</div>
          <div className={`text-xs ${cat.color}`}>{cat.label}</div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${statusCfg.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {metric.currentValue ?? 0}/{metric.targetValue ?? "?"} {metric.unit}
        </span>
      </div>
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: any }) {
  const statusColors: Record<string, string> = {
    completed: "text-emerald-400",
    in_progress: "text-blue-400",
    pending: "text-muted-foreground",
    blocked: "text-red-400",
    waived: "text-amber-400",
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
      <div className={`w-2 h-2 rounded-full ${milestone.currentStatus === "completed" ? "bg-emerald-500" : milestone.currentStatus === "blocked" ? "bg-red-500" : "bg-muted-foreground"}`} />
      <div className="flex-1 text-sm text-foreground">{milestone.milestoneName}</div>
      <span className="text-xs text-muted-foreground">{milestone.milestoneType}</span>
      {milestone.gatingEffect && (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{milestone.gatingEffect.replace(/_/g, " ")}</span>
      )}
      <span className={`text-xs font-medium ${statusColors[milestone.currentStatus] || "text-muted-foreground"}`}>{milestone.currentStatus}</span>
    </div>
  );
}

function TransitionCard({ transition }: { transition: any }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">{transition.fromInstrument}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{transition.toInstrument}</span>
        {transition.timeHorizon && <span className="text-xs text-muted-foreground ml-auto">{transition.timeHorizon}</span>}
      </div>
      {transition.transitionTrigger && <div className="text-xs text-muted-foreground">Trigger: {transition.transitionTrigger}</div>}
      {transition.validationCriteria && <div className="text-xs text-muted-foreground">Validation: {transition.validationCriteria}</div>}
    </div>
  );
}

function ReadinessBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    READY: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Ready" },
    CONDITIONALLY_READY: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Conditional" },
    NOT_READY: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Not Ready" },
  };
  const c = cfg[status] || cfg.NOT_READY;
  return <span className={`px-2 py-0.5 rounded text-xs border ${c.color}`}>{c.label}</span>;
}

function scoreColor(v: number) {
  if (v > 70) return "text-red-400";
  if (v > 40) return "text-amber-400";
  return "text-emerald-400";
}

function avgNestedScore(projects: any[], parent: string, field: string): string {
  const vals = projects.map((p: any) => p[parent]?.[field]).filter((v: any) => v != null && !isNaN(v));
  if (vals.length === 0) return "N/A";
  return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(0);
}
