import { useState, useEffect } from "react";
import { Card, Badge, AnimatedContainer } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign, TrendingUp, TrendingDown, Shield, AlertTriangle,
  Percent, Building2, Umbrella, FileCheck, ArrowRight, Loader2,
  Zap, ChevronRight
} from "lucide-react";
import { financialApi, type ProjectFinancialImpact, type FinancialScenario } from "@/lib/financial-api";

function fmtMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function FinancialImpactPanel({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ProjectFinancialImpact | null>(null);
  const [scenario, setScenario] = useState<FinancialScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [showScenario, setShowScenario] = useState(false);

  useEffect(() => {
    setLoading(true);
    financialApi.getProjectImpact(projectId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const loadScenario = () => {
    if (scenario) { setShowScenario(!showScenario); return; }
    setScenarioLoading(true);
    financialApi.getScenario(projectId)
      .then(s => { setScenario(s); setShowScenario(true); })
      .catch(() => {})
      .finally(() => setScenarioLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Computing financial impact...</span>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-muted-foreground">Unable to compute financial impact</div>;

  const { loanPricing, insurance, covenant, capitalConstraint, totalImpact } = data;

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Financial Impact Summary</h3>
                <p className="text-sm text-muted-foreground">Environmental risk → capital consequences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Financing Cost</span>
                </div>
                <div className="text-2xl font-mono font-black text-warning">+{loanPricing.totalAdjustment}%</div>
                <div className="text-xs text-muted-foreground mt-1">Rate adjustment</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Umbrella className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Insurance Increase</span>
                </div>
                <div className="text-2xl font-mono font-black text-destructive">+{fmtMoney(insurance.increase)}</div>
                <div className="text-xs text-muted-foreground mt-1">Annual premium uplift</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Covenant Level</span>
                </div>
                <div className="text-2xl font-mono font-black">
                  <Badge variant={covenant.level === "HIGH" ? "destructive" : covenant.level === "MEDIUM" ? "warning" : "success"} className="text-lg px-3 py-1">
                    {covenant.level}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Requirements tier</div>
              </div>
            </div>

            <div className="bg-background/80 rounded-xl border border-primary/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-1">Total Financial Effect</div>
                  <div className="text-sm text-muted-foreground">{totalImpact.loanTermYears}-year lifetime impact</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-black text-destructive">+{fmtMoney(totalImpact.totalLifetimeImpact)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Financing: {fmtMoney(totalImpact.additionalFinancingCost)} · Insurance: {fmtMoney(totalImpact.insuranceUplift)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedContainer delay={0.05}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">Loan Pricing Adjustment</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-foreground/80">Base Rate</span>
                <span className="font-mono font-bold text-foreground">{loanPricing.baseRate}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-foreground/80">Risk Premium</span>
                <span className="font-mono font-bold text-warning">+{loanPricing.riskPremium}%</span>
              </div>
              {loanPricing.confidencePenalty > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-foreground/80">Low Confidence Penalty</span>
                  <span className="font-mono font-bold text-destructive">+{loanPricing.confidencePenalty}%</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-3 -mx-1">
                <span className="text-sm font-bold text-foreground">Final Rate</span>
                <span className="text-xl font-mono font-black text-primary">{loanPricing.finalRate}%</span>
              </div>
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Umbrella className="w-4 h-4 text-primary" />
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">Insurance Premium Impact</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-foreground/80">Base Premium (1% of value)</span>
                <span className="font-mono font-bold text-foreground">{fmtMoney(insurance.basePremium)}</span>
              </div>
              {insurance.factors.map((f, i) => (
                <div key={i} className="flex justify-between items-center py-1 text-xs">
                  <span className="text-muted-foreground flex items-center"><AlertTriangle className="w-3 h-3 mr-2 text-warning" />{f}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-t border-border/30">
                <span className="text-sm text-foreground/80">Adjusted Premium</span>
                <span className="font-mono font-bold text-foreground">{fmtMoney(insurance.adjustedPremium)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-destructive/5 rounded-lg px-3 -mx-1">
                <span className="text-sm font-bold text-foreground">Annual Increase</span>
                <span className="text-xl font-mono font-black text-destructive">+{fmtMoney(insurance.increase)}</span>
              </div>
            </div>
          </Card>
        </AnimatedContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedContainer delay={0.15}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">Covenant Requirements</h4>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={covenant.level === "HIGH" ? "destructive" : covenant.level === "MEDIUM" ? "warning" : "success"} className="text-sm px-3 py-1">
                {covenant.level} Severity
              </Badge>
            </div>
            <div className="space-y-2">
              {covenant.requirements.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{r}</span>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.2}>
          <Card className={`p-5 h-full ${capitalConstraint.breach ? "border-destructive/30 bg-destructive/5" : ""}`}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className={`w-4 h-4 ${capitalConstraint.breach ? "text-destructive" : "text-primary"}`} />
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">Capital Constraint Engine</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground/80">High-Risk Allocation</span>
                <span className={`font-mono font-bold text-lg ${capitalConstraint.breach ? "text-destructive" : "text-foreground"}`}>
                  {capitalConstraint.highRiskAllocation}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground/80">Policy Limit</span>
                <span className="font-mono font-bold text-foreground">{capitalConstraint.policyLimit}%</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
                <div className="absolute h-full border-r-2 border-warning" style={{ left: `${capitalConstraint.policyLimit}%` }} />
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${capitalConstraint.breach ? "bg-destructive" : "bg-success"}`}
                  style={{ width: `${Math.min(capitalConstraint.highRiskAllocation, 100)}%` }}
                />
              </div>
              {capitalConstraint.breach && (
                <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20 mt-2">
                  <div className="text-sm font-bold text-destructive flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reallocation Required
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Portfolio exceeds {capitalConstraint.policyLimit}% high-risk policy limit by {capitalConstraint.highRiskAllocation - capitalConstraint.policyLimit}pp
                  </div>
                </div>
              )}
            </div>
          </Card>
        </AnimatedContainer>
      </div>

      <AnimatedContainer delay={0.25}>
        <Card className="p-5">
          <button
            onClick={loadScenario}
            disabled={scenarioLoading}
            className="w-full flex items-center justify-between py-3 px-4 bg-primary/5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="text-sm font-bold text-foreground">Financial Scenario: With Mitigation</div>
                <div className="text-xs text-muted-foreground">See how monitoring + lab validation reduces financial impact</div>
              </div>
            </div>
            {scenarioLoading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <ChevronRight className={`w-5 h-5 text-primary transition-transform ${showScenario ? "rotate-90" : ""}`} />}
          </button>

          {showScenario && scenario && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Financing Rate</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground line-through">{scenario.before.rate}%</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-lg font-bold text-success">{scenario.after.rate}%</span>
                  </div>
                  <div className="text-xs text-success font-mono mt-1">-{scenario.savings.rateSavings}% saved</div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Insurance Premium</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground line-through">{fmtMoney(scenario.before.premium)}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-lg font-bold text-success">{fmtMoney(scenario.after.premium)}</span>
                  </div>
                  <div className="text-xs text-success font-mono mt-1">-{fmtMoney(scenario.savings.premiumSavings)} saved</div>
                </div>
                <div className="bg-success/5 rounded-xl p-4 border border-success/20">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Total Savings</div>
                  <div className="text-2xl font-mono font-black text-success">{fmtMoney(scenario.savings.lifetimeSavings)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Lifetime reduction</div>
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Applied Mitigations</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {scenario.mitigations.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </AnimatedContainer>
    </div>
  );
}
