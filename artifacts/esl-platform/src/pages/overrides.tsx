import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown, ArrowUpDown, RefreshCw, ChevronDown, ChevronRight, Eye } from "lucide-react";

const BASE = "/api";

const OVERRIDE_TYPES: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  decision_upgrade: { label: "Decision Upgrade", icon: TrendingUp, color: "text-emerald-400" },
  decision_downgrade: { label: "Decision Downgrade", icon: TrendingDown, color: "text-red-400" },
  score_adjustment: { label: "Score Adjustment", icon: ArrowUpDown, color: "text-amber-400" },
  instrument_change: { label: "Instrument Change", icon: RefreshCw, color: "text-cyan-400" },
};

export default function OverridesPage() {
  const [tab, setTab] = useState<"overrides" | "validation">("overrides");
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  const { data: overrides = [] } = useQuery({
    queryKey: ["overrides"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/overrides`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: validationCases = [] } = useQuery({
    queryKey: ["validation-cases"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation/cases`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const overrideStats = {
    total: overrides.length,
    upgrades: overrides.filter((o: any) => o.overrideType === "decision_upgrade").length,
    downgrades: overrides.filter((o: any) => o.overrideType === "decision_downgrade").length,
    provedCorrect: overrides.filter((o: any) => o.provedCorrect === true).length,
    provedIncorrect: overrides.filter((o: any) => o.provedCorrect === false).length,
    pending: overrides.filter((o: any) => o.provedCorrect == null).length,
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <AnimatedContainer>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Override Review & Validation</h1>
              <p className="text-sm text-muted-foreground mt-1">Track analyst overrides and model validation for continuous calibration</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
              <button onClick={() => setTab("overrides")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "overrides" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <Shield className="h-4 w-4 inline mr-1.5" />Overrides ({overrides.length})
              </button>
              <button onClick={() => setTab("validation")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "validation" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <Eye className="h-4 w-4 inline mr-1.5" />Validation ({validationCases.length})
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {tab === "overrides" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <AnimatedContainer delay={0.05}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Total Overrides</div>
                  <div className="text-2xl font-bold text-foreground">{overrideStats.total}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.1}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Upgrades</div>
                  <div className="text-2xl font-bold text-emerald-400">{overrideStats.upgrades}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.15}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Downgrades</div>
                  <div className="text-2xl font-bold text-red-400">{overrideStats.downgrades}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.2}>
                <Card className="p-4">
                  <div className="text-xs text-emerald-400">Proved Correct</div>
                  <div className="text-2xl font-bold text-emerald-400">{overrideStats.provedCorrect}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.25}>
                <Card className="p-4">
                  <div className="text-xs text-amber-400">Pending Review</div>
                  <div className="text-2xl font-bold text-amber-400">{overrideStats.pending}</div>
                </Card>
              </AnimatedContainer>
            </div>

            <AnimatedContainer delay={0.3}>
              <Card className="p-0">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-foreground">Override Decisions</h2>
                </div>
                {overrides.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No overrides recorded</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {overrides.map((o: any) => (
                      <OverrideRow key={o.id} override={o} />
                    ))}
                  </div>
                )}
              </Card>
            </AnimatedContainer>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatedContainer delay={0.05}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Total Cases</div>
                  <div className="text-2xl font-bold text-foreground">{validationCases.length}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.1}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">With Observed Risk</div>
                  <div className="text-2xl font-bold text-cyan-400">{validationCases.filter((c: any) => c.observedRisk != null).length}</div>
                </Card>
              </AnimatedContainer>
              <AnimatedContainer delay={0.15}>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Avg Prediction Error</div>
                  <div className="text-2xl font-bold text-amber-400">{avgPredictionError(validationCases)}</div>
                </Card>
              </AnimatedContainer>
            </div>

            <AnimatedContainer delay={0.2}>
              <Card className="p-0">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-foreground">Validation Cases</h2>
                </div>
                {validationCases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No validation cases recorded</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {validationCases.map((vc: any) => (
                      <ValidationCaseRow
                        key={vc.id}
                        validationCase={vc}
                        expanded={expandedCase === vc.id}
                        onToggle={() => setExpandedCase(expandedCase === vc.id ? null : vc.id)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </AnimatedContainer>
          </>
        )}
      </div>
    </Layout>
  );
}

function OverrideRow({ override: o }: { override: any }) {
  const typeCfg = OVERRIDE_TYPES[o.overrideType] || { label: o.overrideType, icon: ArrowUpDown, color: "text-muted-foreground" };
  const TypeIcon = typeCfg.icon;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <TypeIcon className={`h-4 w-4 ${typeCfg.color}`} />
        <span className={`text-sm font-medium ${typeCfg.color}`}>{typeCfg.label}</span>
        <span className="text-xs text-muted-foreground">Project #{o.projectId}</span>
        <span className="text-xs text-muted-foreground ml-auto">{new Date(o.createdAt).toLocaleDateString()}</span>
        {o.provedCorrect === true && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {o.provedCorrect === false && <XCircle className="h-4 w-4 text-red-400" />}
        {o.provedCorrect == null && <AlertTriangle className="h-4 w-4 text-amber-400" />}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-white/[0.03] border border-white/5">
          <div className="text-muted-foreground">Original</div>
          <div className="text-foreground font-mono">{o.originalValue}</div>
        </div>
        <div className="p-2 rounded bg-white/[0.03] border border-white/5">
          <div className="text-muted-foreground">Overridden To</div>
          <div className="text-foreground font-mono">{o.overriddenValue}</div>
        </div>
        {o.reviewer && (
          <div className="p-2 rounded bg-white/[0.03] border border-white/5">
            <div className="text-muted-foreground">Reviewer</div>
            <div className="text-foreground">{o.reviewer}</div>
          </div>
        )}
        {o.sectorFamily && (
          <div className="p-2 rounded bg-white/[0.03] border border-white/5">
            <div className="text-muted-foreground">Sector Family</div>
            <div className="text-foreground">{o.sectorFamily}</div>
          </div>
        )}
      </div>
      {o.reason && <div className="text-xs text-muted-foreground"><span className="text-foreground/70">Reason:</span> {o.reason}</div>}
      {o.mitigationRationale && <div className="text-xs text-muted-foreground"><span className="text-foreground/70">Mitigation:</span> {o.mitigationRationale}</div>}
    </div>
  );
}

function ValidationCaseRow({ validationCase: vc, expanded, onToggle }: { validationCase: any; expanded: boolean; onToggle: () => void }) {
  const { data: observations = [] } = useQuery({
    queryKey: ["validation-observations", vc.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation/cases/${vc.id}/observations`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: expanded,
  });

  const Chevron = expanded ? ChevronDown : ChevronRight;
  const error = vc.observedRisk != null ? Math.abs(vc.predictedRisk - vc.observedRisk) : null;

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
        <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">Project #{vc.projectId} &middot; {vc.caseType?.replace(/_/g, " ")}</div>
          <div className="text-xs text-muted-foreground">{vc.sectorFamily || "N/A"} &middot; Profile: {vc.profileUsed || "default"}</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Predicted</div>
            <div className={`font-mono font-bold ${riskColor(vc.predictedRisk)}`}>{vc.predictedRisk}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Observed</div>
            <div className={`font-mono font-bold ${vc.observedRisk != null ? riskColor(vc.observedRisk) : "text-muted-foreground"}`}>{vc.observedRisk ?? "N/A"}</div>
          </div>
          {error != null && (
            <div className="text-center">
              <div className="text-muted-foreground">Error</div>
              <div className={`font-mono font-bold ${error > 15 ? "text-red-400" : error > 5 ? "text-amber-400" : "text-emerald-400"}`}>{error.toFixed(1)}</div>
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-4 space-y-3 bg-white/[0.01]">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {vc.predictedOutcome && (
              <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                <div className="text-muted-foreground mb-1">Predicted Outcome</div>
                <div className="text-foreground">{vc.predictedOutcome}</div>
              </div>
            )}
            {vc.observedOutcome && (
              <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                <div className="text-muted-foreground mb-1">Observed Outcome</div>
                <div className="text-foreground">{vc.observedOutcome}</div>
              </div>
            )}
          </div>
          {observations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Observations ({observations.length})</h4>
              <div className="space-y-2">
                {observations.map((obs: any) => (
                  <div key={obs.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{obs.observationType?.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{new Date(obs.createdAt).toLocaleDateString()}</span>
                    </div>
                    {obs.description && <div className="text-foreground mb-1">{obs.description}</div>}
                    {obs.impact && <div className="text-muted-foreground">Impact: {obs.impact}</div>}
                    {obs.recommendation && <div className="text-muted-foreground">Recommendation: {obs.recommendation}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {observations.length === 0 && <div className="py-2 text-center text-muted-foreground text-sm">No observations recorded</div>}
        </div>
      )}
    </div>
  );
}

function riskColor(v: number) {
  if (v > 70) return "text-red-400";
  if (v > 40) return "text-amber-400";
  return "text-emerald-400";
}

function avgPredictionError(cases: any[]): string {
  const withBoth = cases.filter((c: any) => c.predictedRisk != null && c.observedRisk != null);
  if (withBoth.length === 0) return "N/A";
  const avg = withBoth.reduce((sum: number, c: any) => sum + Math.abs(c.predictedRisk - c.observedRisk), 0) / withBoth.length;
  return avg.toFixed(1);
}
