import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { financialApi, type ProjectImpactAssessment } from "@/lib/financial-api";
import { useCapitalMode } from "./capital-mode-context";
import {
  AlertTriangle, TrendingUp, Activity, DollarSign,
  Shield, Target, BarChart3
} from "lucide-react";

const levelColor: Record<string, { text: string; bg: string; border: string; badge: "success" | "warning" | "destructive" }> = {
  HIGH: { text: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/30", badge: "destructive" },
  ELEVATED: { text: "text-warning", bg: "bg-warning/5", border: "border-warning/30", badge: "warning" },
  MODERATE: { text: "text-warning", bg: "bg-warning/5", border: "border-warning/30", badge: "warning" },
  MEDIUM: { text: "text-warning", bg: "bg-warning/5", border: "border-warning/30", badge: "warning" },
  LOW: { text: "text-success", bg: "bg-success/5", border: "border-success/30", badge: "success" },
  STANDARD: { text: "text-success", bg: "bg-success/5", border: "border-success/30", badge: "success" },
};

function getLevel(level: string) {
  return levelColor[level] || levelColor.MEDIUM;
}

export function ImpactTab({ projectId }: { projectId: number }) {
  const { mode } = useCapitalMode();
  const [data, setData] = useState<ProjectImpactAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialApi.getProjectImpactAssessment(projectId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading impact assessment...</div>;
  if (!data) return <div className="text-center py-8 text-muted-foreground">Impact data unavailable.</div>;

  const dr = getLevel(data.deliveryRisk.level);
  const mi = getLevel(data.monitoringIntensity.level);
  const dbr = getLevel(data.disbursementRisk.level);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" /> Impact Assessment
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "Grant" ? "Grant impact delivery risk, efficiency, and disbursement analysis" :
             mode === "Blended" ? "Blended finance impact analysis — grant component delivery risk" :
             "Impact delivery risk assessment for loan-funded outcomes"}
          </p>
        </div>
        <Badge variant="outline" className="font-mono uppercase">{mode} Mode</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`p-6 ${dr.bg} ${dr.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Impact Delivery Risk
            </h4>
            <Badge variant={dr.badge}>{data.deliveryRisk.level}</Badge>
          </div>
          {data.deliveryRisk.drivers.length > 0 ? (
            <div className="space-y-2">
              {data.deliveryRisk.drivers.map((driver, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-background/50 rounded-lg px-3 py-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dr.text === "text-destructive" ? "bg-destructive" : dr.text === "text-warning" ? "bg-warning" : "bg-success"}`} />
                  <span className="text-foreground/80">{driver}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant delivery risk drivers identified.</p>
          )}
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            {mode === "Grant" ? "Measures probability that grant-funded outcomes fail to materialize" :
             "Measures probability that funded environmental outcomes are not achieved"}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" /> Impact Efficiency Score
            </h4>
            <div className={`text-3xl font-mono font-bold ${data.impactEfficiency.score >= 70 ? "text-success" : data.impactEfficiency.score >= 50 ? "text-warning" : "text-destructive"}`}>
              {data.impactEfficiency.score}%
            </div>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${data.impactEfficiency.score >= 70 ? "bg-success" : data.impactEfficiency.score >= 50 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${data.impactEfficiency.score}%` }}
            />
          </div>
          {data.impactEfficiency.factors.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adjustment Factors</div>
              {data.impactEfficiency.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                  <span className="text-foreground/80">{f.factor}</span>
                  <span className="font-mono font-bold text-destructive">{f.adjustment}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            Percentage of deployed capital expected to achieve intended environmental impact, adjusted for risk and uncertainty
          </div>
        </Card>

        <Card className={`p-6 ${mi.bg} ${mi.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Monitoring Intensity
            </h4>
            <Badge variant={mi.badge}>{data.monitoringIntensity.level}</Badge>
          </div>
          <div className="space-y-2">
            {data.monitoringIntensity.requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Shield className="w-3 h-3 text-primary shrink-0" />
                <span className="text-foreground/80">{req}</span>
                {mode === "Grant" && (
                  <Badge variant="outline" className="text-[9px] ml-auto shrink-0">Required for release</Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            {mode === "Grant" ? "Monitoring requirements tied to grant disbursement conditions" :
             mode === "Blended" ? "Monitoring requirements span both grant milestones and loan covenants" :
             "Monitoring requirements tied to loan covenant compliance"}
          </div>
        </Card>

        <Card className={`p-6 ${dbr.bg} ${dbr.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-2" /> Disbursement Risk
            </h4>
            <Badge variant={dbr.badge}>{data.disbursementRisk.level}</Badge>
          </div>
          {data.disbursementRisk.factors.length > 0 ? (
            <div className="space-y-2">
              {data.disbursementRisk.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-background/50 rounded-lg px-3 py-2">
                  <AlertTriangle className={`w-3 h-3 mt-0.5 shrink-0 ${dbr.text}`} />
                  <span className="text-foreground/80">{factor}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Disbursement risk within acceptable parameters.</p>
          )}
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            {mode === "Grant" ? "Risk that grant tranches are delayed or withheld due to unmet conditions" :
             "Risk that capital deployment is delayed due to environmental compliance gaps"}
          </div>
        </Card>
      </div>
    </div>
  );
}
