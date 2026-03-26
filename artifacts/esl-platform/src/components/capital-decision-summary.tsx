import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import {
  financialApi,
  type ProjectStructure,
  type ProjectImpactAssessment,
  type ProjectFinancialImpact,
  type FinancialScenario,
} from "@/lib/financial-api";
import {
  Layers, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, ArrowRight, Shield, Gift, Building2,
  Zap, TrendingDown, Activity, FileCheck, Loader2, Info
} from "lucide-react";
import { useCapitalMode } from "@/components/capital-mode-context";

function fmtDollar(value: number): string {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

interface DecisionData {
  structure: ProjectStructure | null;
  impact: ProjectImpactAssessment | null;
  financial: ProjectFinancialImpact | null;
  scenario: FinancialScenario | null;
}

const readinessCfg: Record<string, { color: string; bg: string; border: string; icon: any; badge: "success" | "warning" | "destructive" }> = {
  READY: { color: "text-success", bg: "bg-success/10", border: "border-success/40", icon: CheckCircle, badge: "success" },
  "CONDITIONALLY READY": { color: "text-warning", bg: "bg-warning/10", border: "border-warning/40", icon: Clock, badge: "warning" },
  "NOT READY": { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40", icon: XCircle, badge: "destructive" },
};

export function CapitalDecisionSummary({ projectId }: { projectId: number }) {
  const [data, setData] = useState<DecisionData>({ structure: null, impact: null, financial: null, scenario: null });
  const [loading, setLoading] = useState(true);
  const [explainOpen, setExplainOpen] = useState(false);
  const { mode: capitalMode } = useCapitalMode();

  useEffect(() => {
    const fetches = [
      financialApi.getProjectStructure(projectId).catch(() => null),
      financialApi.getProjectImpactAssessment(projectId).catch(() => null),
      financialApi.getProjectImpact(projectId).catch(() => null),
      financialApi.getScenario(projectId).catch(() => null),
    ];
    Promise.all(fetches).then(([structure, impact, financial, scenario]) => {
      setData({
        structure: structure as ProjectStructure | null,
        impact: impact as ProjectImpactAssessment | null,
        financial: financial as ProjectFinancialImpact | null,
        scenario: scenario as FinancialScenario | null,
      });
    }).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-border/40 p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs uppercase tracking-wider">Loading capital decision...</span>
        </div>
      </Card>
    );
  }

  const { structure, impact, financial, scenario } = data;

  if (!structure) {
    return (
      <Card className="border-border/40 p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Capital decision data unavailable</span>
        </div>
      </Card>
    );
  }

  const systemMode = structure.recommendedMode as "Loan" | "Grant" | "Blended";
  const activeMode = capitalMode as "Loan" | "Grant" | "Blended";
  const isOverride = activeMode !== systemMode;

  const rc = readinessCfg[structure.deploymentReadiness] || readinessCfg["NOT READY"];
  const ReadinessIcon = rc.icon;

  const constraints: string[] = [];
  if (financial?.loanPricing.confidencePenalty && financial.loanPricing.confidencePenalty > 0) constraints.push("Data confidence below threshold");
  if (impact?.monitoringIntensity?.level === "HIGH") constraints.push("Elevated monitoring intensity required");
  if (structure.loan.conditionsPrecedent.some(c => c.toLowerCase().includes("monitoring"))) constraints.push("Monitoring not established");
  if (impact?.deliveryRisk.level === "HIGH") constraints.push("High environmental exposure");
  if (financial?.capitalConstraint.breach) constraints.push("Portfolio capital concentration breach");
  if (impact?.disbursementRisk.level === "ELEVATED") constraints.push("Elevated disbursement risk");
  if (activeMode === "Loan" && !structure.loan.viable) constraints.push("Loan not viable at current risk level");
  if (activeMode === "Loan" && structure.loan.riskMitigation.length > 0) constraints.push("Risk mitigation infrastructure required");
  if (activeMode === "Grant" && !structure.grant.required) constraints.push("Grant not required — loan may be more efficient");
  if (activeMode === "Blended" && !structure.blended.grantRequired) constraints.push("Blended structure not required at current risk");

  const nextActions: string[] = [];
  if (activeMode === "Loan") {
    structure.loan.conditionsPrecedent.forEach(cp => { if (nextActions.length < 4) nextActions.push(cp); });
    structure.loan.riskMitigation.forEach(rm => { if (nextActions.length < 4) nextActions.push(rm); });
  } else if (activeMode === "Grant") {
    const pendingPhases = structure.grant.disbursementPhases.filter(p => p.status !== "COMPLETE");
    if (pendingPhases.length > 0) {
      pendingPhases[0].conditions.forEach(c => { if (nextActions.length < 4) nextActions.push(c); });
    }
    if (nextActions.length < 4) nextActions.push("Complete disbursement phase validation");
  } else {
    structure.blended.loanTriggers.forEach(t => { if (nextActions.length < 4) nextActions.push(t); });
    structure.blended.transitionMilestones.forEach(m => { if (nextActions.length < 4) nextActions.push(m); });
  }
  if (nextActions.length === 0) {
    nextActions.push("Proceed with standard due diligence");
    nextActions.push("Execute capital deployment");
  }

  const ModeIcon = activeMode === "Loan" ? Building2 : activeMode === "Grant" ? Gift : Layers;

  return (
    <Card className={`${rc.border} ${rc.bg} overflow-hidden`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center">
            <Zap className="w-4 h-4 mr-2 text-primary" />
            Capital Decision Summary
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${rc.bg} border ${rc.border}`}>
            <ReadinessIcon className={`w-4 h-4 ${rc.color}`} />
            <span className={`text-sm font-bold ${rc.color}`}>{structure.deploymentReadiness}</span>
          </div>
        </div>

        {isOverride && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Viewing as <span className="font-bold text-foreground">{activeMode}</span> mode.
              System recommends <span className="font-bold text-primary">{systemMode}</span>.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold">Core Decision</div>
              <div className="flex items-center gap-3 bg-background/60 rounded-xl p-4 border border-border/30">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <ModeIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{activeMode} Mode</div>
                  <div className="text-xs text-muted-foreground">
                    {isOverride ? "User selected" : "System recommendation"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold">Recommended Structure</div>
              <div className="bg-background/60 rounded-xl p-4 border border-border/30 space-y-2">
                {activeMode === "Loan" && (
                  <>
                    <StructureLine icon={Shield} text={`Proceed with ${structure.loan.covenantLevel.toLowerCase()} covenants`} />
                    {!structure.loan.viable && <StructureLine icon={XCircle} text="Loan not viable — consider grant or blended" alert />}
                    {structure.loan.conditionsPrecedent.length > 0 && <StructureLine icon={FileCheck} text={`${structure.loan.conditionsPrecedent.length} conditions precedent`} />}
                    <StructureLine icon={Activity} text="Monitoring required pre-disbursement" />
                  </>
                )}
                {activeMode === "Grant" && (
                  <>
                    <StructureLine icon={Gift} text="Phased disbursement required" />
                    <StructureLine icon={FileCheck} text="Validation required before Phase 2" />
                    <StructureLine icon={Activity} text={`${structure.grant.disbursementPhases.filter(p => p.status === "COMPLETE").length}/${structure.grant.disbursementPhases.length} phases complete`} />
                  </>
                )}
                {activeMode === "Blended" && (
                  <>
                    <StructureLine icon={Gift} text={`Grant ${structure.blended.grantPercent}% — $${structure.blended.grantAmount}M`} />
                    <StructureLine icon={Building2} text={`Loan ${structure.blended.loanPercent}% — $${structure.blended.loanAmount}M`} />
                    {structure.blended.splitDrivers && structure.blended.splitDrivers.length > 0 && (
                      <div className="pt-1 border-t border-border/20 mt-1">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Split Drivers</div>
                        {structure.blended.splitDrivers.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-foreground/70 ml-1 mb-0.5">
                            <span>{d.factor}</span>
                            <span className="font-mono text-primary">+{d.contribution}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {structure.blended.loanTriggers.length > 0 && (
                      <div className="pt-1 border-t border-border/20 mt-1">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Loan Activation Triggers</div>
                        {structure.blended.loanTriggers.map((t, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/70 ml-1">
                            <ArrowRight className="w-2.5 h-2.5 text-primary shrink-0" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold">
                {activeMode === "Grant" ? "Impact Risk" : activeMode === "Blended" ? "Combined Impact" : "Financial Impact"}
              </div>
              <div className="bg-background/60 rounded-xl p-4 border border-border/30 space-y-3">
                {activeMode === "Loan" && financial && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Rate adjustment</span>
                      <span className="text-sm font-mono font-bold text-foreground">+{financial.loanPricing.totalAdjustment}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Insurance uplift</span>
                      <span className="text-sm font-mono font-bold text-foreground">{fmtDollar(financial.insurance.increase)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">Lifetime cost</span>
                      <span className="text-sm font-mono font-bold text-destructive">{fmtDollar(financial.totalImpact.totalLifetimeImpact)}</span>
                    </div>
                  </>
                )}
                {activeMode === "Grant" && impact && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Delivery risk</span>
                      <Badge variant={impact.deliveryRisk.level === "HIGH" ? "destructive" : impact.deliveryRisk.level === "MEDIUM" ? "warning" : "success"}>
                        {impact.deliveryRisk.level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Impact efficiency</span>
                      <span className={`text-sm font-mono font-bold ${impact.impactEfficiency.score >= 70 ? "text-success" : impact.impactEfficiency.score >= 50 ? "text-warning" : "text-destructive"}`}>
                        {impact.impactEfficiency.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Disbursement risk</span>
                      <Badge variant={impact.disbursementRisk.level === "ELEVATED" ? "destructive" : impact.disbursementRisk.level === "MODERATE" ? "warning" : "success"}>
                        {impact.disbursementRisk.level}
                      </Badge>
                    </div>
                    {impact.deliveryRisk.level !== "LOW" && (
                      <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        High probability of delivery inefficiency without validation
                      </div>
                    )}
                  </>
                )}
                {activeMode === "Blended" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Grant de-risk</span>
                      <span className="text-sm font-mono font-bold text-primary">{structure.blended.grantPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Loan viability</span>
                      <Badge variant={structure.blended.loanViability === "VIABLE" ? "success" : structure.blended.loanViability === "CONDITIONAL" ? "warning" : "destructive"}>
                        {structure.blended.loanViability}
                      </Badge>
                    </div>
                    {scenario && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">Savings if mitigated</span>
                        <span className="text-sm font-mono font-bold text-success">{fmtDollar(scenario.savings.lifetimeSavings)}</span>
                      </div>
                    )}
                  </>
                )}
                {!financial && activeMode === "Loan" && (
                  <div className="text-xs text-muted-foreground">Financial data unavailable</div>
                )}
                {!impact && activeMode === "Grant" && (
                  <div className="text-xs text-muted-foreground">Impact data unavailable</div>
                )}
              </div>
            </div>

            {scenario && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Before / After
                </div>
                <div className="bg-background/60 rounded-xl border border-border/30 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-border/30">
                    <div className="p-3 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Without Intervention</div>
                      <div className="text-sm font-mono font-bold text-foreground">{scenario.before.rate}%</div>
                      <div className="text-[10px] text-muted-foreground">Rate</div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">{fmtDollar(scenario.before.premium)}</div>
                      <div className="text-[10px] text-muted-foreground">Premium</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">With Intervention</div>
                      <div className="text-sm font-mono font-bold text-success">{scenario.after.rate}%</div>
                      <div className="text-[10px] text-muted-foreground">Rate</div>
                      <div className="text-xs font-mono text-success mt-1">{fmtDollar(scenario.after.premium)}</div>
                      <div className="text-[10px] text-muted-foreground">Premium</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-success/5 border-t border-border/30 text-center">
                    <span className="text-xs text-muted-foreground">Savings: </span>
                    <span className="text-sm font-mono font-bold text-success">{fmtDollar(scenario.savings.lifetimeSavings)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {constraints.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-warning" /> Key Constraints
                </div>
                <div className="bg-background/60 rounded-xl p-4 border border-border/30 space-y-2">
                  {constraints.slice(0, 4).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1 shrink-0" />
                      <span className="text-foreground/80">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" /> Next Required Actions
              </div>
              <div className="bg-background/60 rounded-xl p-4 border border-border/30 space-y-2">
                {nextActions.slice(0, 4).map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-foreground/80 leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {impact && (
          <>
            <button
              onClick={() => setExplainOpen(!explainOpen)}
              className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-lg hover:bg-background/40"
            >
              {explainOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {explainOpen ? "Hide decision rationale" : "Why this decision?"}
            </button>

            {explainOpen && (
              <div className="mt-3 bg-background/60 rounded-xl border border-border/30 p-5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-bold">Decision Explainability</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {impact.deliveryRisk.drivers.map((driver, i) => (
                    <div key={i} className="text-xs bg-secondary/30 rounded-lg px-3 py-2 text-foreground/80">
                      {driver}
                    </div>
                  ))}
                  {financial && (
                    <>
                      <div className="text-xs bg-secondary/30 rounded-lg px-3 py-2 text-foreground/80">
                        Overall Risk: {financial.loanPricing.riskPremium > 0 ? "Elevated" : "Low"}
                      </div>
                      <div className="text-xs bg-secondary/30 rounded-lg px-3 py-2 text-foreground/80">
                        Confidence: {financial.loanPricing.confidencePenalty > 0 ? "Below 50%" : "Adequate"}
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t border-border/30 pt-3 space-y-1.5">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span>
                      {activeMode === "Grant"
                        ? "Grant-first approach de-risks before deployment — phased disbursement ensures accountability"
                        : activeMode === "Blended"
                          ? "Blended approach — grant component reduces exposure before commercial lending activates"
                          : "Direct commercial lending with standard covenants — risk and confidence within acceptable thresholds"}
                    </span>
                  </div>
                  {isOverride && (
                    <div className="flex items-start gap-2 text-xs text-primary/80">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        System recommends {systemMode} mode based on risk ({systemMode === "Grant" ? "Risk>70 + Confidence<50" : systemMode === "Blended" ? "Risk>60 OR Confidence<60" : "acceptable thresholds"})
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span>
                      {structure.deploymentReadiness === "READY"
                        ? "All deployment prerequisites met — capital can be deployed immediately"
                        : structure.deploymentReadiness === "NOT READY"
                          ? "Critical prerequisites unmet — deployment must be deferred pending data improvement and monitoring"
                          : "Partial prerequisites met — conditional deployment possible with additional safeguards"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function StructureLine({ icon: Icon, text, alert }: { icon: any; text: string; alert?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${alert ? "text-destructive" : "text-primary"}`} />
      <span className={alert ? "text-destructive" : "text-foreground/80"}>{text}</span>
    </div>
  );
}
