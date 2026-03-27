import { useState, useEffect } from "react";
import { Card, Badge, Button } from "@/components/ui";
import {
  Briefcase, AlertTriangle, CheckCircle, Clock, DollarSign,
  TrendingDown, TrendingUp, FileText, Beaker, Eye, Shield,
  Droplet, Factory, Gavel, ChevronDown, ChevronUp, Zap,
  Download, ArrowRight, Target, Layers
} from "lucide-react";

const BASE = "/api";

interface ESLService {
  id: string;
  name: string;
  category: string;
  priority: "CRITICAL" | "RECOMMENDED" | "OPTIONAL";
  description: string;
  scope: string[];
  deliverables: string[];
  timelineWeeks: number;
  estimatedFee: number;
  trigger: string;
  valueProposition: string;
  riskReduction: number;
  confidenceGain: number;
}

interface ServiceData {
  project: {
    id: number;
    name: string;
    country: string;
    investmentAmount: number;
    overallRisk: number;
    dataConfidence: number;
  };
  services: ESLService[];
  summary: {
    totalServices: number;
    criticalServices: number;
    totalFee: number;
    criticalFee: number;
    totalRiskReduction: number;
    totalConfidenceGain: number;
    maxTimelineWeeks: number;
    projectedRiskAfterESL: number;
    projectedConfidenceAfterESL: number;
    eslFeeAsPercentOfInvestment: number;
  };
}

const categoryIcons: Record<string, typeof Briefcase> = {
  Assessment: FileText,
  Laboratory: Beaker,
  Monitoring: Eye,
  Compliance: Shield,
  Advisory: Gavel,
};

const priorityConfig = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Critical" },
  RECOMMENDED: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Recommended" },
  OPTIONAL: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Optional" },
};

function fmtDollar(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function ESLServicesTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/esl/project/${projectId}/services`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-pulse text-muted-foreground">Scoping ESL services...</div>
      </Card>
    );
  }

  if (!data || data.services.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-display font-bold text-foreground mb-2">No Additional Services Required</h3>
        <p className="text-sm text-muted-foreground">This project's environmental profile is well-validated.</p>
      </Card>
    );
  }

  const { services, summary, project } = data;

  const generateProposal = () => {
    const lines = [
      `ESL ENVIRONMENTAL SERVICES — SCOPE OF WORK PROPOSAL`,
      `${"=".repeat(60)}`,
      ``,
      `Project: ${project.name}`,
      `Country: ${project.country}`,
      `Investment: $${(project.investmentAmount).toFixed(0)}M`,
      `Current Risk: ${project.overallRisk.toFixed(0)}/100 | Confidence: ${project.dataConfidence.toFixed(0)}%`,
      ``,
      `PROJECTED OUTCOMES WITH ESL SERVICES`,
      `${"-".repeat(40)}`,
      `Risk Reduction: ${project.overallRisk.toFixed(0)} → ${summary.projectedRiskAfterESL.toFixed(0)} (-${summary.totalRiskReduction} points)`,
      `Confidence Gain: ${project.dataConfidence.toFixed(0)}% → ${summary.projectedConfidenceAfterESL.toFixed(0)}% (+${summary.totalConfidenceGain}%)`,
      `Total ESL Fee: ${fmtDollar(summary.totalFee)} (${summary.eslFeeAsPercentOfInvestment}% of investment)`,
      `Timeline: ${summary.maxTimelineWeeks} weeks (parallel execution)`,
      ``,
    ];

    services.forEach((svc, i) => {
      lines.push(`${i + 1}. ${svc.name} [${svc.priority}]`);
      lines.push(`   Category: ${svc.category}`);
      lines.push(`   Fee: ${fmtDollar(svc.estimatedFee)} | Timeline: ${svc.timelineWeeks} weeks`);
      lines.push(`   Trigger: ${svc.trigger}`);
      lines.push(`   Scope:`);
      svc.scope.forEach(s => lines.push(`     • ${s}`));
      lines.push(`   Deliverables:`);
      svc.deliverables.forEach(d => lines.push(`     • ${d}`));
      lines.push(`   Impact: -${svc.riskReduction} risk points, +${svc.confidenceGain}% confidence`);
      lines.push(``);
    });

    lines.push(`${"=".repeat(60)}`);
    lines.push(`ESL Caribbean Environmental Intelligence`);
    lines.push(`Generated: ${new Date().toISOString().split("T")[0]}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ESL-Proposal-${project.name.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">ESL Revenue</div>
          <div className="text-2xl font-mono font-bold text-primary">{fmtDollar(summary.totalFee)}</div>
          <div className="text-xs text-muted-foreground mt-1">{summary.eslFeeAsPercentOfInvestment}% of investment</div>
        </Card>
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Critical Services</div>
          <div className="text-2xl font-mono font-bold text-red-400">{summary.criticalServices}</div>
          <div className="text-xs text-muted-foreground mt-1">{fmtDollar(summary.criticalFee)} critical scope</div>
        </Card>
        <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Risk Reduction</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {project.overallRisk.toFixed(0)} → {summary.projectedRiskAfterESL.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">-{summary.totalRiskReduction} points</div>
        </Card>
        <Card className="p-4 border-blue-500/20 bg-blue-500/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Confidence Gain</div>
          <div className="text-2xl font-mono font-bold text-blue-400">
            {project.dataConfidence.toFixed(0)}% → {summary.projectedConfidenceAfterESL.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">+{summary.totalConfidenceGain}%</div>
        </Card>
      </div>

      <Card className="p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-foreground">ESL Service Package</h3>
              <p className="text-xs text-muted-foreground">
                {summary.totalServices} services identified • {summary.maxTimelineWeeks} weeks parallel execution • {fmtDollar(summary.totalFee)} total scope
              </p>
            </div>
          </div>
          <Button onClick={generateProposal} className="gap-2">
            <Download className="w-4 h-4" /> Generate Proposal
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {services.map((svc) => {
          const config = priorityConfig[svc.priority];
          const CategoryIcon = categoryIcons[svc.category] || Briefcase;
          const isExpanded = expandedService === svc.id;

          return (
            <Card
              key={svc.id}
              className={`border ${config.border} overflow-hidden transition-all duration-200`}
            >
              <button
                className="w-full p-5 text-left"
                onClick={() => setExpandedService(isExpanded ? null : svc.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.bg} border ${config.border} mt-0.5`}>
                      <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-display font-bold text-foreground">{svc.name}</h4>
                        <Badge variant="outline" className={`${config.color} text-[10px] px-1.5 py-0`}>
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">
                          {svc.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{svc.trigger}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary text-lg">{fmtDollar(svc.estimatedFee)}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {svc.timelineWeeks} weeks
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border/30 pt-4 space-y-4">
                  <p className="text-sm text-foreground/80">{svc.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Scope of Work</h5>
                      <ul className="space-y-1.5">
                        {svc.scope.map((s, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Deliverables</h5>
                      <ul className="space-y-1.5">
                        {svc.deliverables.map((d, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-emerald-400 mt-1 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={`rounded-lg p-3 ${config.bg} border ${config.border}`}>
                    <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Value Proposition</h5>
                    <p className="text-sm text-foreground/80">{svc.valueProposition}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span className="text-muted-foreground">Risk:</span>
                      <span className="font-mono font-bold text-emerald-400">-{svc.riskReduction} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-mono font-bold text-blue-400">+{svc.confidenceGain}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="font-mono font-bold text-amber-400">{svc.timelineWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
