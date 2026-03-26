import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { financialApi, type ProjectStructure } from "@/lib/financial-api";
import { useCapitalMode } from "./capital-mode-context";
import {
  Building2, Gift, Layers, Shield, CheckCircle, Clock,
  AlertTriangle, ArrowRight, Target, FileCheck, XCircle
} from "lucide-react";

const readinessConfig: Record<string, { badge: "success" | "warning" | "destructive"; icon: any }> = {
  READY: { badge: "success", icon: CheckCircle },
  "CONDITIONALLY READY": { badge: "warning", icon: Clock },
  "NOT READY": { badge: "destructive", icon: XCircle },
};

export function StructureTab({ projectId }: { projectId: number }) {
  const { mode } = useCapitalMode();
  const [data, setData] = useState<ProjectStructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialApi.getProjectStructure(projectId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading structure analysis...</div>;
  if (!data) return <div className="text-center py-8 text-muted-foreground">Structure data unavailable.</div>;

  const rc = readinessConfig[data.deploymentReadiness] || readinessConfig["NOT READY"];
  const ReadinessIcon = rc.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Layers className="w-5 h-5 mr-2 text-primary" /> Capital Structure
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "Loan" ? "Loan covenants, conditions precedent, and risk mitigation" :
             mode === "Grant" ? "Grant disbursement phases and conditions" :
             "Blended finance structure — grant/loan triggers and transitions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <div className="text-xs text-muted-foreground">Recommended</div>
            <Badge variant="outline" className="font-mono">{data.recommendedMode}</Badge>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${rc.badge === "success" ? "border-success/30 bg-success/5" : rc.badge === "warning" ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5"}`}>
            <ReadinessIcon className={`w-4 h-4 ${rc.badge === "success" ? "text-success" : rc.badge === "warning" ? "text-warning" : "text-destructive"}`} />
            <div>
              <div className="text-xs text-muted-foreground">Deployment</div>
              <div className="text-sm font-bold">{data.deploymentReadiness}</div>
            </div>
          </div>
        </div>
      </div>

      {mode === "Loan" && <LoanStructure data={data} />}
      {mode === "Grant" && <GrantStructure data={data} />}
      {mode === "Blended" && <BlendedStructure data={data} />}
    </div>
  );
}

function LoanStructure({ data }: { data: ProjectStructure }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-foreground">{data.loan.rate}%</div>
          <div className="text-xs text-muted-foreground mt-1">Risk-Adjusted Rate</div>
        </Card>
        <Card className={`p-5 text-center ${data.loan.viable ? "border-success/20" : "border-destructive/20 bg-destructive/5"}`}>
          {data.loan.viable ? <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" /> : <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />}
          <div className={`text-lg font-bold ${data.loan.viable ? "text-success" : "text-destructive"}`}>
            {data.loan.viable ? "VIABLE" : "NOT VIABLE"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Loan Viability</div>
        </Card>
        <Card className="p-5 text-center">
          <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
          <Badge variant={data.loan.covenantLevel === "HIGH" ? "destructive" : data.loan.covenantLevel === "MEDIUM" ? "warning" : "success"} className="text-lg px-3 py-1">
            {data.loan.covenantLevel}
          </Badge>
          <div className="text-xs text-muted-foreground mt-2">Covenant Level</div>
        </Card>
      </div>

      {data.loan.conditionsPrecedent.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
            <FileCheck className="w-4 h-4 mr-2" /> Conditions Precedent
          </h4>
          <div className="space-y-2">
            {data.loan.conditionsPrecedent.map((cp, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-mono font-bold text-primary">{i + 1}</div>
                <span className="text-foreground/90">{cp}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
          <Shield className="w-4 h-4 mr-2" /> Covenant Requirements
        </h4>
        <div className="space-y-2">
          {data.loan.conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground/90">{c}</span>
              <Badge variant="outline" className="text-[9px] ml-auto shrink-0">Required for loan covenant</Badge>
            </div>
          ))}
        </div>
      </Card>

      {data.loan.riskMitigation.length > 0 && (
        <Card className="p-6 border-warning/20 bg-warning/5">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-warning" /> Risk Mitigation Required
          </h4>
          <div className="space-y-2">
            {data.loan.riskMitigation.map((rm, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-background/50 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-foreground/90">{rm}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function GrantStructure({ data }: { data: ProjectStructure }) {
  const totalAllocation = data.grant.disbursementPhases.reduce((s, p) => s + p.allocation, 0);
  const completePhases = data.grant.disbursementPhases.filter(p => p.status === "COMPLETE").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-5 text-center ${data.grant.required ? "border-warning/20 bg-warning/5" : "border-success/20 bg-success/5"}`}>
          <Gift className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className={`text-lg font-bold ${data.grant.required ? "text-warning" : "text-success"}`}>
            {data.grant.required ? "REQUIRED" : "OPTIONAL"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Grant Requirement</div>
        </Card>
        <Card className="p-5 text-center">
          <Target className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-primary">{completePhases}/{data.grant.disbursementPhases.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Phases Complete</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Grant Purpose</div>
          <p className="text-sm text-foreground/90 leading-relaxed">{data.grant.purpose}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center">
          <Layers className="w-4 h-4 mr-2" /> Disbursement Phases
        </h4>
        <div className="space-y-4">
          {data.grant.disbursementPhases.map((phase, i) => {
            const isComplete = phase.status === "COMPLETE";
            return (
              <div key={i} className={`rounded-xl border p-5 ${isComplete ? "border-success/30 bg-success/5" : "border-border/50"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold ${isComplete ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {phase.phase}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{phase.name}</div>
                      <div className="text-xs text-muted-foreground">Phase {phase.phase} of {data.grant.disbursementPhases.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-primary">{phase.allocation}%</div>
                      <div className="text-xs text-muted-foreground">Allocation</div>
                    </div>
                    <Badge variant={isComplete ? "success" : "warning"}>{phase.status}</Badge>
                  </div>
                </div>
                <div className="space-y-2 ml-11">
                  {phase.conditions.map((cond, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      {isComplete ? <CheckCircle className="w-3 h-3 text-success shrink-0" /> : <Clock className="w-3 h-3 text-muted-foreground shrink-0" />}
                      <span className={isComplete ? "text-foreground/60 line-through" : "text-foreground/80"}>{cond}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto shrink-0">Required for grant release</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function BlendedStructure({ data }: { data: ProjectStructure }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`p-5 text-center ${data.blended.grantRequired ? "border-warning/20 bg-warning/5" : "border-success/20 bg-success/5"}`}>
          <Gift className="w-5 h-5 text-primary mx-auto mb-2" />
          <div className={`text-lg font-bold ${data.blended.grantRequired ? "text-warning" : "text-success"}`}>
            {data.blended.grantRequired ? "YES" : "NO"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Grant Required</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-2xl font-mono font-bold text-primary">{data.blended.grantPercent}%</div>
          <div className="text-xs text-muted-foreground mt-1">Grant Component</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-2xl font-mono font-bold text-foreground">{100 - data.blended.grantPercent}%</div>
          <div className="text-xs text-muted-foreground mt-1">Loan Component</div>
        </Card>
        <Card className={`p-5 text-center ${data.blended.loanViability === "VIABLE" ? "border-success/20" : data.blended.loanViability === "CONDITIONAL" ? "border-warning/20 bg-warning/5" : "border-destructive/20 bg-destructive/5"}`}>
          <Badge variant={data.blended.loanViability === "VIABLE" ? "success" : data.blended.loanViability === "CONDITIONAL" ? "warning" : "destructive"} className="text-lg px-3 py-1">
            {data.blended.loanViability}
          </Badge>
          <div className="text-xs text-muted-foreground mt-2">Loan Viability</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Grant Purpose</div>
        <p className="text-sm text-foreground/90 leading-relaxed">{data.blended.grantPurpose}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
            <ArrowRight className="w-4 h-4 mr-2 text-primary" /> Loan Activation Triggers
          </h4>
          {data.blended.loanTriggers.length > 0 ? (
            <div className="space-y-2">
              {data.blended.loanTriggers.map((trigger, i) => (
                <div key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-warning" />
                  </div>
                  <span className="text-foreground/90">{trigger}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-success">All loan activation conditions met. Direct lending viable.</p>
          )}
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary" /> Transition Milestones
          </h4>
          <div className="space-y-2">
            {data.blended.transitionMilestones.map((ms, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-mono font-bold text-primary">{i + 1}</div>
                <span className="text-foreground/90">{ms}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 border-primary/20 bg-primary/5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Blended Finance Logic</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center p-4 bg-background/50 rounded-lg border border-border/50">
            <Gift className="w-5 h-5 text-warning mx-auto mb-1" />
            <div className="text-sm font-bold">Grant Phase</div>
            <div className="text-xs text-muted-foreground mt-1">De-risk environmental exposure</div>
            <div className="text-lg font-mono font-bold text-warning mt-2">{data.blended.grantPercent}%</div>
          </div>
          <ArrowRight className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1 text-center p-4 bg-background/50 rounded-lg border border-border/50">
            <Building2 className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">Loan Phase</div>
            <div className="text-xs text-muted-foreground mt-1">Commercial capital deployment</div>
            <div className="text-lg font-mono font-bold text-primary mt-2">{100 - data.blended.grantPercent}%</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
