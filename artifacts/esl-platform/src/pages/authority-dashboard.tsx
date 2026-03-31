import { useState, useEffect, Fragment } from "react";
import { Layout } from "@/components/layout";
import { Card, Badge, AnimatedContainer } from "@/components/ui";
import {
  Globe, TrendingUp, TrendingDown, Database, Shield, BarChart3,
  Activity, Zap, ChevronDown, ChevronUp, AlertTriangle, Layers, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import {
  regionalApi,
  type AuthoritySummary,
  type Insight,
  type RegionalConfidence,
} from "@/lib/regional-api";

export default function AuthorityDashboard() {
  const [summary, setSummary] = useState<AuthoritySummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [confidence, setConfidence] = useState<RegionalConfidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [countryTrend, setCountryTrend] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      regionalApi.getAuthoritySummary(),
      regionalApi.getInsights(),
      regionalApi.getConfidence(),
    ]).then(([s, i, c]) => {
      setSummary(s);
      setInsights(i);
      setConfidence(c);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadCountryTrend = async (country: string) => {
    if (expandedCountry === country) { setExpandedCountry(null); return; }
    setExpandedCountry(country);
    try {
      const data = await regionalApi.getCountryTrend(country);
      setCountryTrend(data);
    } catch { setCountryTrend(null); }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!summary) return <Layout><div className="text-center py-12 text-muted-foreground">Failed to load authority data</div></Layout>;

  const sortedCountries = [...summary.countries].sort((a, b) => b.riskScore - a.riskScore);
  const countryChartData = sortedCountries.map(c => ({
    name: c.country.length > 12 ? c.country.substring(0, 10) + "…" : c.country,
    fullName: c.country,
    risk: c.riskScore,
    confidence: c.confidence,
  }));

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Caribbean Environmental Authority</h1>
          <p className="text-muted-foreground mt-1">Regional intelligence, benchmarking, and risk indexing across {summary.totalCountries} Caribbean markets.</p>
        </div>

        {summary.dataProvenance && summary.dataProvenance.status !== "LIVE" && (
          <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
            summary.dataProvenance.status === "PARTIAL"
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}>
            <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              summary.dataProvenance.status === "PARTIAL" ? "text-blue-500" : "text-yellow-500"
            }`} />
            <div className="text-sm">
              <span className={`font-semibold ${
                summary.dataProvenance.status === "PARTIAL" ? "text-blue-500" : "text-yellow-500"
              }`}>{summary.dataProvenance.label}</span>
              <span className="text-muted-foreground ml-1">
                {summary.dataProvenance.detail}
              </span>
              {summary.sourceCoverage && summary.sourceCoverage.connectedSources.length > 0 && (
                <span className="text-muted-foreground block mt-1">
                  {summary.sourceCoverage.connectedSources.length} source(s) connected | Avg confidence: {summary.sourceCoverage.avgConfidence}%
                </span>
              )}
            </div>
          </div>
        )}

        <AnimatedContainer>
          <Card className="p-6 bg-gradient-to-r from-primary/5 via-card to-primary/5 border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Caribbean Environmental Risk Index</div>
                  <div className="text-5xl font-mono font-black text-foreground">{summary.ceri}</div>
                  <div className="text-sm text-muted-foreground mt-1">Weighted composite across {summary.totalCountries} markets</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl font-mono font-bold text-primary">{summary.avgConfidence}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-foreground">{summary.totalCountries}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Countries</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-foreground">{summary.totalProjects}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Projects</div>
                </div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <Card className="p-6 border-primary/10">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
              <Database className="w-4 h-4 mr-2" /> Data Moat — Defensibility Signal
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Projects Analyzed", value: summary.dataMoat.projectsAnalyzed.toLocaleString(), icon: Layers },
                { label: "Ingestion Runs", value: summary.dataMoat.ingestionRuns.toLocaleString(), icon: Zap },
                { label: "Monitoring Points", value: summary.dataMoat.monitoringPoints.toLocaleString(), icon: Activity },
                { label: "Countries Covered", value: summary.dataMoat.countriesCovered.toString(), icon: Globe },
                { label: "Data Points", value: summary.dataMoat.dataPoints.toLocaleString(), icon: Database },
              ].map(item => (
                <div key={item.label} className="text-center p-4 bg-secondary/30 rounded-xl border border-border/30">
                  <item.icon className="w-5 h-5 mx-auto mb-2 text-primary/70" />
                  <div className="text-2xl font-mono font-bold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnimatedContainer delay={0.15} className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" /> Country Risk Index
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#ccc", fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number, name: string) => [value.toFixed(1), name === "risk" ? "Risk Score" : "Confidence"]}
                      labelFormatter={(label) => {
                        const item = countryChartData.find(c => c.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="risk" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Risk" />
                    <Bar dataKey="confidence" fill="rgba(255,255,255,0.15)" radius={[0, 4, 4, 0]} name="Confidence" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.2}>
            <Card className="p-6 h-full">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" /> Data Coverage
              </h3>
              {confidence && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-success flex items-center"><span className="w-2 h-2 bg-success rounded-full mr-2" />High Confidence</span>
                      <span className="font-mono font-bold text-foreground">{confidence.high.pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${confidence.high.pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warning flex items-center"><span className="w-2 h-2 bg-warning rounded-full mr-2" />Medium Confidence</span>
                      <span className="font-mono font-bold text-foreground">{confidence.medium.pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${confidence.medium.pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-destructive flex items-center"><span className="w-2 h-2 bg-destructive rounded-full mr-2" />Low Confidence</span>
                      <span className="font-mono font-bold text-foreground">{confidence.low.pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full" style={{ width: `${confidence.low.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 border border-border/30">
                    <span className="text-primary font-semibold">Data scarcity = opportunity.</span> Low-confidence markets represent untapped intelligence positioning.
                  </div>
                </div>
              )}
            </Card>
          </AnimatedContainer>
        </div>

        <AnimatedContainer delay={0.25}>
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-card/80">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Globe className="w-4 h-4 mr-2" /> Caribbean Market Index
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold">Country</th>
                    <th className="px-5 py-3 text-right font-semibold">Risk Index</th>
                    <th className="px-5 py-3 text-right font-semibold">Infrastructure</th>
                    <th className="px-5 py-3 text-right font-semibold">Water Stress</th>
                    <th className="px-5 py-3 text-right font-semibold">Confidence</th>
                    <th className="px-5 py-3 text-center font-semibold">Status</th>
                    <th className="px-5 py-3 text-center font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedCountries.map(c => {
                    const isHigh = c.riskScore >= 65;
                    const isMed = c.riskScore >= 45;
                    return (
                      <Fragment key={c.country}>
                        <tr
                          className="hover:bg-secondary/40 transition-colors cursor-pointer"
                          onClick={() => loadCountryTrend(c.country)}
                        >
                          <td className="px-5 py-3 font-bold text-foreground">
                            <div className="flex items-center">
                              <div className={`w-1.5 h-5 rounded-full mr-3 ${isHigh ? "bg-destructive" : isMed ? "bg-warning" : "bg-success"}`} />
                              {c.country}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-mono font-bold ${isHigh ? "text-destructive" : isMed ? "text-warning" : "text-success"}`}>
                              {c.riskScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-muted-foreground">{c.infrastructureScore.toFixed(1)}</td>
                          <td className="px-5 py-3 text-right font-mono text-muted-foreground">{c.waterStressScore.toFixed(1)}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-mono ${c.confidence >= 70 ? "text-success" : c.confidence >= 45 ? "text-warning" : "text-destructive"}`}>
                              {c.confidence.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant={isHigh ? "destructive" : isMed ? "warning" : "success"}>
                              {isHigh ? "High Risk" : isMed ? "Moderate" : "Low Risk"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {expandedCountry === c.country ? <ChevronUp className="w-4 h-4 mx-auto text-primary" /> : <ChevronDown className="w-4 h-4 mx-auto text-muted-foreground" />}
                          </td>
                        </tr>
                        {expandedCountry === c.country && countryTrend && countryTrend.country === c.country && (
                          <tr>
                            <td colSpan={7} className="px-5 py-4 bg-secondary/20">
                              <div className="max-w-2xl mx-auto">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{c.country} Risk Trend (2021–2025)</div>
                                <div className="h-[180px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={countryTrend.trend}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                      <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                                      <YAxis domain={[0, 100]} tick={{ fill: "#888", fontSize: 11 }} />
                                      <RechartsTooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                                      <Line type="monotone" dataKey="riskScore" stroke="#14b8a6" strokeWidth={2} name="Risk Score" dot={{ r: 4 }} />
                                      <Line type="monotone" dataKey="confidence" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} name="Confidence" strokeDasharray="5 5" />
                                      <Legend />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimatedContainer>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatedContainer delay={0.3}>
            <Card className="p-6 h-full">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" /> Sector Risk Benchmarks
              </h3>
              <div className="space-y-3">
                {summary.sectorOverview.map(s => (
                  <div key={s.sector} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-foreground">{s.sector}</div>
                    <div className="flex-1">
                      <div className="w-full h-4 bg-secondary rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full ${s.avgRisk >= 60 ? "bg-destructive" : s.avgRisk >= 45 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${s.avgRisk}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right font-mono font-bold text-sm">
                      <span className={s.avgRisk >= 60 ? "text-destructive" : s.avgRisk >= 45 ? "text-warning" : "text-success"}>
                        {s.avgRisk.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-12 text-right text-xs text-muted-foreground">{s.sampleSize}n</div>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.35}>
            <Card className="p-6 h-full">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <Zap className="w-4 h-4 mr-2" /> Intelligence Insights
              </h3>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={insight.severity === "High" ? "destructive" : insight.severity === "Medium" ? "warning" : "outline"}
                        className="text-[10px] shrink-0 mt-0.5"
                      >
                        {insight.severity}
                      </Badge>
                      <div>
                        <div className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-0.5">{insight.category}</div>
                        <div className="text-sm text-foreground/90">{insight.insight}</div>
                        <div className="text-xs text-muted-foreground mt-1">{insight.dataPoints} data points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>
        </div>

        <AnimatedContainer delay={0.4}>
          <Card className="p-5 border-primary/10 bg-primary/3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">High-Risk Markets Requiring Elevated Diligence</div>
                <div className="flex flex-wrap gap-2">
                  {summary.highRiskCountries.map(c => (
                    <Badge key={c.country} variant="destructive" className="text-xs">
                      {c.country}: {c.riskScore.toFixed(1)}
                    </Badge>
                  ))}
                  {summary.highRiskCountries.length === 0 && (
                    <span className="text-sm text-muted-foreground">No countries currently above elevated risk threshold</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}
