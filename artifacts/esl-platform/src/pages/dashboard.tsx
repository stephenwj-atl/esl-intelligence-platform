import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListProjects, 
  useGetPortfolioSummary, 
  useGetPortfolioOptimization,
  useGetCrossProjectIntelligence,
  useGetDataConfidenceIndex,
  useGetPortfolioDecision,
} from "@workspace/api-client-react";
import { 
  Plus, Activity, AlertTriangle, ShieldCheck, 
  DollarSign, Loader2, ArrowRight, TrendingDown,
  Target, Info, ChevronRight, Zap, Brain, Database,
  Shield, TrendingUp, Crosshair, Globe, Layers, BarChart3,
  FileCheck, ClipboardList, AlertOctagon, User
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatPercent, formatCurrency, getRiskColor, getRiskBgColor } from "@/lib/utils";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie, BarChart, Bar
} from "recharts";
import { governanceApi, type GovernanceSummary } from "@/lib/governance-api";
import { regionalApi, type PortfolioBenchmark } from "@/lib/regional-api";

const ROLES = ["Analyst", "Investment Officer", "Admin"] as const;
type Role = (typeof ROLES)[number];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummary();
  const { data: optimization, isLoading: optimizeLoading } = useGetPortfolioOptimization();
  const { data: intelligence } = useGetCrossProjectIntelligence();
  const { data: confidenceIndex } = useGetDataConfidenceIndex();
  const { data: portfolioDecision } = useGetPortfolioDecision();
  const [governance, setGovernance] = useState<GovernanceSummary | null>(null);
  const [portfolioBench, setPortfolioBench] = useState<PortfolioBenchmark | null>(null);
  const [role, setRole] = useState<Role>("Analyst");

  const [showOptimization, setShowOptimization] = useState(false);

  useEffect(() => {
    governanceApi.getGovernanceSummary().then(setGovernance).catch(() => {});
    regionalApi.getPortfolioBenchmark().then(setPortfolioBench).catch(() => {});
  }, []);

  const isLoading = projectsLoading || summaryLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
          <h2 className="text-xl font-display font-semibold text-foreground">Aggregating Portfolio Intelligence...</h2>
        </div>
      </Layout>
    );
  }

  if (!projects || projects.length === 0 || !summary) {
    return (
      <Layout>
        <AnimatedContainer>
          <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-border/50 bg-card/20 min-h-[60vh]">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Activity className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No active assessments</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start by creating a new environmental risk assessment to generate actionable investment intelligence.
            </p>
            <Link href="/new">
              <Button variant="outline">Create First Assessment</Button>
            </Link>
          </Card>
        </AnimatedContainer>
      </Layout>
    );
  }

  const scatterData = projects.map(p => ({
    name: p.name,
    id: p.id,
    risk: p.riskScores.overallRisk,
    confidence: p.riskScores.dataConfidence,
    investment: p.investmentAmount,
    decision: p.decision.outcome
  }));

  const pieData = [
    { name: 'Low Risk', value: summary.capitalByRiskLevel.low, color: '#10b981' },
    { name: 'Medium Risk', value: summary.capitalByRiskLevel.medium, color: '#f59e0b' },
    { name: 'High Risk', value: summary.capitalByRiskLevel.high, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
          <div className="font-bold mb-1">{data.name || data.bucket}</div>
          {data.risk !== undefined && <div>Risk Score: <span className="font-mono">{data.risk.toFixed(1)}</span></div>}
          {data.confidence !== undefined && <div>Confidence: <span className="font-mono">{formatPercent(data.confidence)}</span></div>}
          {data.investment !== undefined && <div>Capital: <span className="font-mono">{formatCurrency(data.investment)}</span></div>}
          {data.count !== undefined && <div>Count: <span className="font-mono">{data.count}</span></div>}
          {data.value !== undefined && !data.bucket && <div>Capital: <span className="font-mono">{formatCurrency(data.value)}</span></div>}
        </div>
      );
    }
    return null;
  };

  const decisionColors: Record<string, { bg: string; border: string; text: string; badge: "success" | "warning" | "destructive" | "outline" }> = {
    PROCEED_WITH_PORTFOLIO: { bg: "bg-success/5", border: "border-success/30", text: "text-success", badge: "success" },
    PROCEED_WITH_CONDITIONS: { bg: "bg-warning/5", border: "border-warning/30", text: "text-warning", badge: "warning" },
    REBALANCE_PORTFOLIO: { bg: "bg-warning/5", border: "border-warning/30", text: "text-warning", badge: "warning" },
    REDUCE_EXPOSURE: { bg: "bg-destructive/5", border: "border-destructive/30", text: "text-destructive", badge: "destructive" },
  };

  const pdConf = portfolioDecision ? decisionColors[portfolioDecision.outcome] || decisionColors.REDUCE_EXPOSURE : null;

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Portfolio Command Center</h1>
            <p className="text-muted-foreground mt-1">Real-time risk and capital allocation intelligence.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/50">
              <User className="w-4 h-4 text-muted-foreground" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-transparent text-sm font-mono text-foreground border-none outline-none cursor-pointer"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button 
              variant="outline" 
              className="group border-primary/30 hover:bg-primary/10 hover:text-primary"
              onClick={() => setShowOptimization(!showOptimization)}
            >
              <Zap className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              Optimize Portfolio
            </Button>
            <Link href="/new">
              <Button className="group">
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                New Asset
              </Button>
            </Link>
          </div>
        </div>

        {/* Portfolio Decision Banner */}
        {portfolioDecision && pdConf && (
          <AnimatedContainer delay={0.05}>
            <div className={`rounded-xl border ${pdConf.border} ${pdConf.bg} p-5 flex flex-col md:flex-row items-center gap-4`}>
              <div className={`p-3 rounded-full bg-background border ${pdConf.border} shrink-0`}>
                <Shield className={`w-6 h-6 ${pdConf.text}`} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold">Portfolio Decision</span>
                  <Badge variant={pdConf.badge}>
                    {portfolioDecision.outcome.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80 mt-1">{portfolioDecision.insight}</p>
                {portfolioDecision.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {portfolioDecision.conditions.map((c, i) => (
                      <span key={i} className="text-xs bg-background/60 border border-white/5 px-2 py-1 rounded text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Weighted Risk</div>
                  <div className={`font-mono font-bold text-lg ${getRiskColor(portfolioDecision.weightedRisk)}`}>{portfolioDecision.weightedRisk.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">High-Risk Capital</div>
                  <div className="font-mono font-bold text-lg text-destructive">{portfolioDecision.highRiskCapitalPercent}%</div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* Summary Strip */}
        <AnimatedContainer delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-center">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Capital</div>
              <div className="text-3xl font-display font-black text-foreground">{formatCurrency(summary.totalCapital)}</div>
              <div className="text-xs text-muted-foreground mt-2">{summary.projectCount} active projects</div>
            </Card>
            <Card className="p-5 flex flex-col justify-center border-t-4 border-t-primary/50">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg Risk Score</div>
              <div className={`text-3xl font-display font-black ${getRiskColor(summary.avgRisk)}`}>
                {summary.avgRisk.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">/100</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Weighted across portfolio</div>
            </Card>
            <Card className="p-5 flex flex-col justify-center border-t-4 border-t-destructive/50">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exposure at Risk</div>
              <div className="text-3xl font-display font-black text-destructive">{formatCurrency(summary.exposureAtRisk)}</div>
              <div className="text-xs text-muted-foreground mt-2">Capital in High Risk tier</div>
            </Card>
            <Card className="p-5 flex flex-col justify-center">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Confidence Score</div>
              <div className="text-3xl font-display font-black text-foreground">{formatPercent(summary.avgConfidence)}</div>
              <div className="text-xs text-muted-foreground mt-2">Data quality aggregate</div>
            </Card>
          </div>
        </AnimatedContainer>

        {/* Optimization Panel */}
        {showOptimization && optimization && (
          <AnimatedContainer delay={0.1}>
            <Card className="p-6 border-primary/40 bg-primary/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-primary flex items-center">
                  <Zap className="w-5 h-5 mr-2" /> Algorithmic Portfolio Optimization
                </h2>
                <div className="flex items-center space-x-4 bg-background/50 rounded-lg p-2 border border-white/5">
                  <div className="text-center px-4">
                    <div className="text-xs text-muted-foreground">Current Risk</div>
                    <div className="font-mono font-bold">{optimization.currentPortfolioRisk.toFixed(1)}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center px-4">
                    <div className="text-xs text-muted-foreground">Optimized Risk</div>
                    <div className="font-mono font-bold text-success">{optimization.optimizedPortfolioRisk.toFixed(1)}</div>
                  </div>
                  <div className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded">
                    -{optimization.riskReductionPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {optimization.recommendations.map((rec, i) => (
                  <div key={i} className="bg-background/80 border border-border p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm">{rec.projectName}</div>
                      <Badge variant={rec.action === 'reduce_exposure' ? 'destructive' : rec.action === 'increase_allocation' ? 'success' : 'warning'}>
                        {rec.action.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{rec.detail}</p>
                    <div className="text-xs font-mono font-semibold mt-3 text-success">
                      Risk Impact: -{rec.riskImpact.toFixed(1)} pts
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {/* Core Visual Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatedContainer delay={0.2} className="lg:col-span-2">
            <Card className="p-6 h-[450px] flex flex-col">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <Target className="w-4 h-4 mr-2" /> Risk vs Confidence Matrix
              </h3>
              <div className="flex-1 min-h-0 relative">
                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono bg-background/50 p-1 rounded z-10">High Risk / High Confidence</div>
                <div className="absolute top-2 right-2 text-[10px] text-muted-foreground font-mono bg-background/50 p-1 rounded z-10">Low Risk / High Confidence</div>
                <div className="absolute bottom-6 left-2 text-[10px] text-destructive font-mono font-bold bg-destructive/10 border border-destructive/20 p-1 rounded z-10">DANGER ZONE (Low Conf)</div>
                <div className="absolute bottom-6 right-2 text-[10px] text-muted-foreground font-mono bg-background/50 p-1 rounded z-10">Low Risk / Low Conf</div>
                
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" dataKey="risk" name="Risk" domain={[0, 100]} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} reversed />
                    <YAxis type="number" dataKey="confidence" name="Confidence" domain={[0, 100]} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <ZAxis type="number" dataKey="investment" range={[100, 1500]} name="Investment" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine x={50} stroke="#3f3f46" strokeDasharray="3 3" />
                    <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="3 3" />
                    <Scatter name="Projects" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.risk < 40 ? '#10b981' : entry.risk <= 70 ? '#f59e0b' : '#f43f5e'} 
                          opacity={0.8}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                <strong>Insight:</strong> Bubble size represents capital allocation. Assets in the bottom-left require immediate data validation.
              </div>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.3}>
            <Card className="p-6 h-[450px] flex flex-col">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" /> Capital Allocation
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }} />
                      <span className="text-foreground/80">{d.name}</span>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Data Confidence Index + Risk Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Confidence Index */}
          {confidenceIndex && (
            <AnimatedContainer delay={0.35}>
              <Card className="p-6 h-full">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                  <Database className="w-4 h-4 mr-2" /> Data Confidence Index
                </h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-5xl font-display font-black ${confidenceIndex.overallScore >= 75 ? 'text-success' : confidenceIndex.overallScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                      {confidenceIndex.overallScore.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Portfolio Score</div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <ConfidenceBar label="Lab Validation" value={confidenceIndex.labValidationPercent} />
                    <ConfidenceBar label="Monitoring Data" value={confidenceIndex.monitoringPercent} />
                    <ConfidenceBar label="IFC Aligned" value={confidenceIndex.ifcAlignedPercent} />
                  </div>
                </div>
                <div className="bg-background/50 border border-white/5 rounded-lg p-3 text-xs text-muted-foreground">
                  <Info className="w-3 h-3 inline mr-1 text-primary" />
                  {confidenceIndex.insight}
                </div>
                {confidenceIndex.projectsWithLowConfidence > 0 && (
                  <div className="mt-3 text-xs text-destructive font-semibold">
                    {confidenceIndex.projectsWithLowConfidence} project(s) below confidence threshold
                  </div>
                )}
              </Card>
            </AnimatedContainer>
          )}

          <AnimatedContainer delay={0.4}>
            <Card className="p-6 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" /> Risk Distribution
              </h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.riskDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="bucket" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#27272a', opacity: 0.4}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {summary.riskDistribution.map((entry, index) => {
                        const isHigh = index >= 3;
                        const isMed = index === 2;
                        return <Cell key={`cell-${index}`} fill={isHigh ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Cross-Project Intelligence */}
        {intelligence && intelligence.patterns.length > 0 && (
          <AnimatedContainer delay={0.45}>
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-primary" /> Cross-Project Intelligence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {intelligence.patterns.map((pattern, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${pattern.riskImpact === 'high' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {pattern.category === 'Geographic Concentration' && <Globe className="w-4 h-4 text-muted-foreground" />}
                        {pattern.category === 'Sector Risk Pattern' && <Layers className="w-4 h-4 text-muted-foreground" />}
                        {pattern.category === 'Data Quality Gap' && <Database className="w-4 h-4 text-muted-foreground" />}
                        {pattern.category === 'Validation Deficit' && <Crosshair className="w-4 h-4 text-muted-foreground" />}
                        {pattern.category === 'Climate Vulnerability' && <AlertTriangle className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{pattern.category}</span>
                      </div>
                      <Badge variant={pattern.riskImpact === 'high' ? 'destructive' : 'warning'} className="text-[10px]">
                        {pattern.riskImpact.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{pattern.finding}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {pattern.affectedProjects.slice(0, 3).map((name, j) => (
                        <span key={j} className="text-[10px] bg-background/60 px-1.5 py-0.5 rounded text-muted-foreground">{name}</span>
                      ))}
                      {pattern.affectedProjects.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{pattern.affectedProjects.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {intelligence.insights.length > 0 && (
                <div className="border-t border-border/50 pt-4 space-y-2">
                  {intelligence.insights.map((insight, i) => (
                    <div key={i} className="flex items-start text-xs text-foreground/70">
                      <Crosshair className="w-3 h-3 text-primary mr-2 mt-0.5 shrink-0" />
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </AnimatedContainer>
        )}

        {/* Alerts Row */}
        <AnimatedContainer delay={0.5}>
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-warning" /> Top Risk Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.alerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 col-span-3">No high-risk alerts detected.</div>
              ) : (
                summary.alerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 relative overflow-hidden group cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setLocation(`/project/${alert.projectId}`)}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-foreground">{alert.projectName}</div>
                      <div className="text-xs font-mono font-semibold bg-background px-2 py-0.5 rounded text-destructive border border-destructive/20">
                        Risk: {alert.riskScore.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 mb-3">{alert.issue}</p>
                    <div className="flex items-center justify-between text-xs border-t border-destructive/10 pt-2">
                      <span className="font-semibold text-destructive flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> {alert.action}</span>
                      <span className="text-muted-foreground font-mono">{formatCurrency(alert.investmentAmount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </AnimatedContainer>

        {/* Governance Dashboard */}
        {governance && (
          <AnimatedContainer delay={0.55}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Shield className="w-4 h-4 mr-2" /> Portfolio Governance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 text-center">
                  <div className="text-3xl font-mono font-bold text-primary">{governance.esapCompletion}%</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">ESAP Completion</div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${governance.esapCompletion}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{governance.esapComplete} of {governance.esapTotal} items</div>
                </Card>
                <Card className="p-5 text-center">
                  <div className="text-3xl font-mono font-bold text-primary">{governance.covenantCompliance}%</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Covenant Compliance</div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-3">
                    <div className={`h-full rounded-full ${governance.covenantCompliance >= 70 ? "bg-success" : governance.covenantCompliance >= 40 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${governance.covenantCompliance}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{governance.covenantsMet} of {governance.covenantsTotal} met</div>
                </Card>
                <Card className={`p-5 text-center ${governance.breachCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}`}>
                  <div className={`text-3xl font-mono font-bold ${governance.breachCount > 0 ? "text-destructive" : "text-success"}`}>{governance.breachCount}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Active Breaches</div>
                  {governance.breachCount > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs text-destructive mt-3">
                      <AlertOctagon className="w-3 h-3" /> Requires escalation
                    </div>
                  )}
                  {governance.covenantsBreach > 0 && <div className="text-xs text-muted-foreground mt-1">{governance.covenantsBreach} covenant, {governance.esapOverdue} ESAP overdue</div>}
                </Card>
                <Card className="p-5 text-center">
                  <div className="text-3xl font-mono font-bold text-foreground">{governance.monitoringEvents}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Monitoring Events</div>
                  <div className="text-xs text-muted-foreground mt-3">Across portfolio</div>
                </Card>
              </div>

              {governance.breaches.length > 0 && (
                <Card className="p-4 border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive uppercase tracking-wider">Breach & Escalation Alerts</span>
                  </div>
                  <div className="space-y-2">
                    {governance.breaches.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm bg-background/50 rounded-lg px-3 py-2">
                        <Badge variant="destructive" className="text-[10px] shrink-0">{b.severity}</Badge>
                        <div className="flex-1">
                          <span className="font-medium">{b.type}</span>
                          <span className="text-muted-foreground"> — {b.issue.slice(0, 80)}{b.issue.length > 80 ? "..." : ""}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-6 shrink-0" onClick={() => setLocation(`/project/${b.projectId}`)}>
                          View <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {portfolioBench && (
                <Card className="p-4 bg-primary/3 border-primary/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Portfolio vs Regional Benchmark</div>
                        <div className="flex items-baseline gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">Portfolio Avg: <span className="font-mono font-bold text-foreground">{portfolioBench.portfolioAvg}</span></span>
                          <span className="text-sm text-muted-foreground">Regional Avg: <span className="font-mono font-bold text-foreground">{portfolioBench.regionalAvg}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={portfolioBench.diff > 0 ? "warning" : "success"}>
                        {portfolioBench.diffLabel}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">{portfolioBench.countriesBenchmarked} countries benchmarked</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </AnimatedContainer>
        )}

        {/* Project Table */}
        <AnimatedContainer delay={0.6}>
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/80">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Asset Inventory</h3>
              <div className="flex items-center gap-3">
                <Link href="/portfolios">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Layers className="w-3 h-3 mr-1" /> Portfolio Manager
                  </Button>
                </Link>
                <Badge variant="outline" className="font-mono">{projects.length} Assets</Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Asset Name</th>
                    <th className="px-6 py-4 font-medium">Country</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium text-right">Risk Score</th>
                    <th className="px-6 py-4 font-medium text-right">Confidence</th>
                    <th className="px-6 py-4 font-medium text-right">Capital ($)</th>
                    <th className="px-6 py-4 font-medium text-center">Decision</th>
                    <th className="px-6 py-4 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((project) => {
                    const isProceed = project.decision.outcome === 'PROCEED';
                    const isCondition = project.decision.outcome === 'CONDITION';
                    
                    return (
                      <tr 
                        key={project.id} 
                        className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                        onClick={() => setLocation(`/project/${project.id}`)}
                      >
                        <td className="px-6 py-4 font-bold text-foreground">
                          <div className="flex items-center">
                            <div className={`w-1.5 h-6 rounded-full mr-3 ${isProceed ? 'bg-success' : isCondition ? 'bg-warning' : 'bg-destructive'}`} />
                            {project.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{project.country}</td>
                        <td className="px-6 py-4"><Badge variant="outline">{project.projectType}</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono font-bold ${getRiskColor(project.riskScores.overallRisk)}`}>
                            {project.riskScores.overallRisk.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                          {formatPercent(project.riskScores.dataConfidence)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-foreground">
                          {formatCurrency(project.investmentAmount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={isProceed ? 'success' : isCondition ? 'warning' : 'destructive'}>
                            {project.decision.outcome}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${value >= 70 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-destructive'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
