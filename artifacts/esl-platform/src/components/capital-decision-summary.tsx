import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import {
  financialApi,
  type ProjectStructure,
  type ProjectImpactAssessment,
  type ProjectFinancialImpact,
  type TranslationResult,
} from "@/lib/financial-api";
import {
  Layers, CheckCircle, XCircle, Clock, AlertTriangle,
  ArrowRight, Shield, Gift, Building2,
  Zap, Activity, FileCheck, Loader2, Info
} from "lucide-react";
import { useCapitalMode } from "@/components/capital-mode-context";

interface DecisionData {
  structure: ProjectStructure | null;
  impact: ProjectImpactAssessment | null;
  financial: ProjectFinancialImpact | null;
  translation: TranslationResult | null;
}

const readinessCfg: Record<string, { color: string; bg: string; border: string; icon: any; badge: "success" | "warning" | "destructive" }> = {
  READY: { color: "text-success", bg: "bg-success/10", border: "border-success/40", icon: CheckCircle, badge: "success" },
  "CONDITIONALLY READY": { color: "text-warning", bg: "bg-warning/10", border: "border-warning/40", icon: Clock, badge: "warning" },
  "NOT READY": { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40", icon: XCircle, badge: "destructive" },
};

export function CapitalDecisionSummary({ projectId }: { projectId: number }) {
  const [data, setData] = useState<DecisionData>({ structure: null, impact: null, financial: null, translation: null });
  const [loading, setLoading] = useState(true);
  const { mode: capitalMode } = useCapitalMode();

  useEffect(() => {
    setLoading(true);
    const fetches = [
      financialApi.getProjectStructure(projectId).catch(() => null),
      financialApi.getProjectImpactAssessment(projectId).catch(() => null),
      financialApi.getProjectImpact(projectId).catch(() => null),
      financialApi.getTranslation(projectId, capitalMode).catch(() => null),
    ];
    Promise.all(fetches).then(([structure, impact, financial, translation]) => {
      setData({
        structure: structure as ProjectStructure | null,
        impact: impact as ProjectImpactAssessment | null,
        financial: financial as ProjectFinancialImpact | null,
        translation: translation as TranslationResult | null,
      });
    }).finally(() => setLoading(false));
  }, [projectId, capitalMode]);

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

  const { structure, impact, financial, translation } = data;

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
                  {translation?.decision?.reasoning && (
                    <div className="text-[11px] text-foreground/60 mt-1 leading-relaxed">{translation.decision.reasoning}</div>
                  )}
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
          </div>

          <div className="space-y-4">
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
