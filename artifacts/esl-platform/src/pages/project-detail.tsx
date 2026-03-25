import { useRoute, useLocation } from "wouter";
import { useGetProject, useDeleteProject, useRunScenario, useGetProjectRiskHistory } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatPercent, formatCurrency, getRiskColor, getRiskBgColor } from "@/lib/utils";
import { 
  ArrowLeft, Trash2, ShieldCheck, AlertTriangle, XCircle, 
  Droplet, Factory, Users, Gavel, Loader2, Target,
  TrendingUp, TrendingDown, CalendarX, DollarSign, ActivitySquare, Wand2, ArrowRight,
  Clock, Shield, FileCheck, ClipboardList, Activity, History, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from "recharts";
import { ProjectBenchmarkPanel } from "@/components/benchmarking";
import { FinancialImpactPanel } from "@/components/financial-impact";
import { useState } from "react";
import {
  FrameworkAlignmentTab, CovenantsTab, EsapTab, MonitoringTab,
  AuditTrailTab, ReportTab, BreachAlert
} from "@/components/governance-tabs";

const TABS = [
  { id: "overview", label: "Risk Overview", icon: ActivitySquare },
  { id: "framework", label: "Framework", icon: Shield },
  { id: "covenants", label: "Covenants", icon: FileCheck },
  { id: "esap", label: "ESAP", icon: ClipboardList },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "financial", label: "Financial Impact", icon: DollarSign },
  { id: "benchmark", label: "Benchmark", icon: Target },
  { id: "report", label: "Report", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: project, isLoading, isError } = useGetProject(id);
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: runScenario, isPending: isRunningScenario, data: scenarioResult } = useRunScenario();
  const { data: riskHistory } = useGetProjectRiskHistory(id);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [toggles, setToggles] = useState({
    hasMonitoringData: false,
    hasLabData: false,
    isIFCAligned: false,
    reducedInputs: false
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
          <h2 className="text-xl font-display font-semibold text-foreground">Compiling Intelligence Report...</h2>
          <p className="text-muted-foreground mt-2">Running algorithmic risk models</p>
        </div>
      </Layout>
    );
  }

  if (isError || !project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="h-12 w-12 text-destructive mb-6" />
          <h2 className="text-xl font-display font-semibold text-foreground">Report Not Found</h2>
          <Button onClick={() => setLocation("/")} variant="outline" className="mt-6">Return to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  const handleScenarioRun = () => {
    const scenarioInputs = {
      hasMonitoringData: project.inputs.hasMonitoringData || toggles.hasMonitoringData,
      hasLabData: project.inputs.hasLabData || toggles.hasLabData,
      isIFCAligned: project.inputs.isIFCAligned || toggles.isIFCAligned,
      ...(toggles.reducedInputs ? {
        floodRisk: Math.max(0, project.inputs.floodRisk - 3),
        contaminationRisk: Math.max(0, project.inputs.contaminationRisk - 3)
      } : {})
    };

    runScenario({ id, data: scenarioInputs });
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeData = scenarioResult ? scenarioResult.after : project;
  const { riskScores, financialRisk, decision } = activeData;
  const isScenarioMode = !!scenarioResult;
  
  const chartData = [
    { name: 'Environmental', value: riskScores.environmentalRisk },
    { name: 'Infrastructure', value: riskScores.infrastructureRisk },
    { name: 'Human Exp.', value: riskScores.humanExposureRisk },
    { name: 'Regulatory', value: riskScores.regulatoryRisk },
  ];

  const decisionConfig = {
    PROCEED: { icon: ShieldCheck, color: "text-success", bg: "bg-success/10", border: "border-success/30", title: "PROCEED" },
    CONDITION: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", title: "CONDITION" },
    DECLINE: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", title: "DECLINE" },
  };

  const dConf = decisionConfig[decision.outcome as keyof typeof decisionConfig] || decisionConfig.DECLINE;
  const DecisionIcon = dConf.icon;

  const handleDelete = () => {
    if(confirm("Are you sure you want to delete this assessment?")) {
      deleteProject({ id }, {
        onSuccess: () => setLocation("/")
      });
    }
  };

  const renderComparison = (label: string, beforeVal: number, afterVal: number, isLowerBetter = true) => {
    if (!isScenarioMode) return null;
    const diff = afterVal - beforeVal;
    if (diff === 0) return null;
    
    const isImprovement = isLowerBetter ? diff < 0 : diff > 0;
    const colorClass = isImprovement ? 'text-success' : 'text-destructive';
    
    return (
      <div className="flex items-center text-sm font-mono mt-1 bg-background/50 px-2 py-1 rounded inline-flex">
        <span className="text-muted-foreground line-through mr-2">{beforeVal.toFixed(1)}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground mr-2" />
        <span className={colorClass}>{afterVal.toFixed(1)} ({diff > 0 ? '+' : ''}{diff.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-12 space-y-6">
        <AnimatedContainer className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-secondary hover:bg-white/10" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <Badge>{project.projectType}</Badge>
                <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">{project.country}</span>
                <span className="text-sm font-mono font-bold px-2 py-0.5 bg-primary/20 text-primary rounded">{formatCurrency(project.investmentAmount)}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{project.name}</h1>
            </div>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </AnimatedContainer>

        <AnimatedContainer delay={0.05}>
          <div className={`rounded-2xl border ${dConf.border} ${dConf.bg} p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden backdrop-blur-md`}>
            {isScenarioMode && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center">
                <Wand2 className="w-3 h-3 mr-2" /> Scenario Mode Active
              </div>
            )}
            <div className={`p-4 rounded-full bg-background border ${dConf.border} shadow-lg shrink-0`}>
              <DecisionIcon className={`w-10 h-10 ${dConf.color}`} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">Investment Decision Signal</h2>
              <div className="flex items-end justify-center md:justify-start mb-3">
                <h3 className={`text-3xl font-display font-black tracking-tight ${dConf.color}`}>{dConf.title}</h3>
              </div>
              <p className="text-foreground/90 text-sm max-w-3xl leading-relaxed border-l-2 pl-4 border-foreground/20">
                {decision.insight}
              </p>
            </div>
            <div className="text-center shrink-0">
              <div className={`text-4xl font-mono font-black ${getRiskColor(riskScores.overallRisk)}`}>{riskScores.overallRisk.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
              <div className="text-xs font-mono text-primary mt-1">{formatPercent(riskScores.dataConfidence)} conf.</div>
            </div>
          </div>
        </AnimatedContainer>

        <BreachAlert projectId={id} projectName={project.name} />

        <AnimatedContainer delay={0.1}>
          <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.15}>
          {activeTab === "overview" && (
            <div className="space-y-8">
              <Card className="p-6 border-primary/30 bg-gradient-to-r from-background to-primary/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center text-primary">
                      <Wand2 className="w-5 h-5 mr-2" /> What-If Scenario Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Test the impact of mitigations and data validation on risk profile.</p>
                  </div>
                  <Button onClick={handleScenarioRun} disabled={isRunningScenario} className="w-full md:w-auto shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    {isRunningScenario ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Simulating...</> : 'Run Simulation'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ToggleCard active={toggles.hasMonitoringData || project.inputs.hasMonitoringData} disabled={project.inputs.hasMonitoringData} onClick={() => handleToggle('hasMonitoringData')} label="Add Monitoring" desc="+12mo baseline data" />
                  <ToggleCard active={toggles.hasLabData || project.inputs.hasLabData} disabled={project.inputs.hasLabData} onClick={() => handleToggle('hasLabData')} label="Lab Validation" desc="Certified sampling" />
                  <ToggleCard active={toggles.isIFCAligned || project.inputs.isIFCAligned} disabled={project.inputs.isIFCAligned} onClick={() => handleToggle('isIFCAligned')} label="IFC Alignment" desc="World Bank standards" />
                  <ToggleCard active={toggles.reducedInputs} disabled={false} onClick={() => handleToggle('reducedInputs')} label="Mitigate Hazards" desc="Flood/Contamination eng." />
                </div>
              </Card>

              {riskHistory && riskHistory.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" /> Risk Monitoring Timeline
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">Simulated 12-month risk trajectory showing impact of monitoring and validation improvements.</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={riskHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `M${v}`} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} labelFormatter={(v) => `Month ${v}`} />
                        <Legend />
                        <Line type="monotone" dataKey="overallRisk" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} name="Risk Score" />
                        <Line type="monotone" dataKey="dataConfidence" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Data Confidence" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <ActivitySquare className="w-5 h-5 mr-2 text-primary" /> Risk Topology Breakdown
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} animationDuration={1000}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value > 70 ? '#f43f5e' : entry.value > 40 ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RiskSubCard title="Environmental" score={riskScores.environmentalRisk} prevScore={isScenarioMode ? project.riskScores.environmentalRisk : undefined} icon={Droplet} />
                    <RiskSubCard title="Infrastructure" score={riskScores.infrastructureRisk} prevScore={isScenarioMode ? project.riskScores.infrastructureRisk : undefined} icon={Factory} />
                    <RiskSubCard title="Human Exposure" score={riskScores.humanExposureRisk} prevScore={isScenarioMode ? project.riskScores.humanExposureRisk : undefined} icon={Users} />
                    <RiskSubCard title="Regulatory" score={riskScores.regulatoryRisk} prevScore={isScenarioMode ? project.riskScores.regulatoryRisk : undefined} icon={Gavel} />
                  </div>
                </div>

                <div className="space-y-8">
                  <Card className="p-6 border-primary/20 bg-primary/5">
                    <h3 className="text-lg font-semibold mb-6 flex items-center text-primary">
                      <TrendingUp className="w-5 h-5 mr-2" /> Financial Translation
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-foreground/80 flex items-center"><CalendarX className="w-4 h-4 mr-2 text-muted-foreground" /> Delay Risk</span>
                          <div className="font-mono font-bold text-destructive">{formatPercent(financialRisk.delayRiskPercent)}</div>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-destructive transition-all duration-1000" style={{ width: `${financialRisk.delayRiskPercent}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-foreground/80 flex items-center"><DollarSign className="w-4 h-4 mr-2 text-muted-foreground" /> Cost Overrun</span>
                          <div className="font-mono font-bold text-warning">{formatPercent(financialRisk.costOverrunPercent)}</div>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-warning transition-all duration-1000" style={{ width: `${financialRisk.costOverrunPercent}%` }} />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">Covenant Breach Prob.</span>
                          <Badge variant="outline" className="font-mono">{formatPercent(financialRisk.covenantBreachPercent)}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">Reputational Risk</span>
                          <Badge variant={financialRisk.reputationalRisk === 'High' ? 'destructive' : financialRisk.reputationalRisk === 'Medium' ? 'warning' : 'success'}>
                            {financialRisk.reputationalRisk}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "framework" && <FrameworkAlignmentTab projectId={id} />}
          {activeTab === "covenants" && <CovenantsTab projectId={id} />}
          {activeTab === "esap" && <EsapTab projectId={id} />}
          {activeTab === "monitoring" && <MonitoringTab projectId={id} />}
          {activeTab === "audit" && <AuditTrailTab projectId={id} />}
          {activeTab === "financial" && <FinancialImpactPanel projectId={id} />}
          {activeTab === "benchmark" && <ProjectBenchmarkPanel projectId={id} />}
          {activeTab === "report" && <ReportTab projectId={id} />}
        </AnimatedContainer>
      </div>
    </Layout>
  );
}

function RiskSubCard({ title, score, prevScore, icon: Icon }: { title: string, score: number, prevScore?: number, icon: any }) {
  const diff = prevScore !== undefined ? score - prevScore : 0;
  const isBetter = diff < 0;
  
  return (
    <div className={`p-4 rounded-xl border ${getRiskBgColor(score)} flex flex-col justify-center transition-all duration-500`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-background/50 border border-white/5 mr-3">
            <Icon className={`w-5 h-5 ${getRiskColor(score)} transition-colors duration-500`} />
          </div>
          <span className="font-semibold text-foreground/90">{title}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className={`text-2xl font-display font-bold ${getRiskColor(score)} transition-colors duration-500`}>
          {score.toFixed(1)}
        </div>
        {prevScore !== undefined && diff !== 0 && (
          <div className={`text-xs font-mono font-bold flex items-center bg-background/50 px-2 py-1 rounded ${isBetter ? 'text-success' : 'text-destructive'}`}>
            {isBetter ? <TrendingDown className="w-3 h-3 mr-1"/> : <TrendingUp className="w-3 h-3 mr-1"/>}
            {Math.abs(diff).toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleCard({ active, disabled, onClick, label, desc }: { active: boolean, disabled: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`p-3 rounded-lg border text-left transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-secondary/20' : 'cursor-pointer hover:bg-primary/5'} ${active && !disabled ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-border/50 bg-background/50'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-bold text-foreground">{label}</div>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
          {active && <ShieldCheck className="w-3 h-3" />}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
