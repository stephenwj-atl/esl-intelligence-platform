import { useRoute, useLocation } from "wouter";
import { useGetProject, useDeleteProject, useRunScenario, useGetProjectRiskHistory } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatPercent, formatCurrency, getRiskColor, getRiskBgColor } from "@/lib/utils";
import { 
  ArrowLeft, Trash2, ShieldCheck, AlertTriangle, XCircle, 
  Droplet, Factory, Users, Gavel, Loader2, Target,
  TrendingUp, TrendingDown, CalendarX, DollarSign, ActivitySquare, Wand2, ArrowRight,
  Clock, Shield, FileCheck, ClipboardList, Activity, History, FileText,
  Layers, CheckCircle, Beaker, Eye, FlaskConical, Gauge, Briefcase
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from "recharts";
import { ProjectBenchmarkPanel } from "@/components/benchmarking";
import { FinancialImpactPanel } from "@/components/financial-impact";
import { ImpactTab } from "@/components/impact-tab";
import { StructureTab } from "@/components/structure-tab";
import { CapitalDecisionSummary } from "@/components/capital-decision-summary";
import { useCapitalMode } from "@/components/capital-mode-context";
import { useState } from "react";
import {
  FrameworkAlignmentTab, CovenantsTab, EsapTab, MonitoringTab,
  AuditTrailTab, ReportTab, BreachAlert
} from "@/components/governance-tabs";
import { ESLServicesTab } from "@/components/esl-services-tab";
import { useRole } from "@/components/role-context";

const TABS = [
  { id: "decision", label: "Decision", icon: ShieldCheck },
  { id: "structure", label: "Structure", icon: Layers },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "esl", label: "ESL Services", icon: Briefcase },
  { id: "impact", label: "Impact", icon: Target },
  { id: "drivers", label: "Drivers", icon: Gauge },
  { id: "evidence", label: "Evidence", icon: FlaskConical },
  { id: "scenario", label: "Scenario", icon: Wand2 },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "report", label: "Report", icon: FileText },
  { id: "audit", label: "Audit", icon: History },
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
  const [activeTab, setActiveTab] = useState<TabId>("decision");
  const { mode: capitalMode } = useCapitalMode();
  const { permissions } = useRole();

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

  const getDriverLevel = (value: number, threshold: number) => {
    if (value >= threshold * 0.7) return { label: "High", color: "text-destructive", bg: "bg-destructive/10" };
    if (value >= threshold * 0.4) return { label: "Medium", color: "text-warning", bg: "bg-warning/10" };
    return { label: "Low", color: "text-success", bg: "bg-success/10" };
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
          {permissions.canDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
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
            {TABS.filter(tab => {
              if (tab.id === "audit" && !permissions.canViewAudit) return false;
              return true;
            }).map(tab => {
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
          {activeTab === "decision" && (
            <div className="space-y-6">
              <CapitalDecisionSummary projectId={id} />
            </div>
          )}

          {activeTab === "structure" && <StructureTab projectId={id} />}

          {activeTab === "financial" && <FinancialImpactPanel projectId={id} />}

          {activeTab === "esl" && <ESLServicesTab projectId={id} />}

          {activeTab === "impact" && <ImpactTab projectId={id} />}

          {activeTab === "drivers" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">What is driving this outcome?</h3>
                <p className="text-sm text-muted-foreground mb-6">These are the specific factors determining the risk score, capital mode, and decision signal.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {(() => {
                    const drivers = [
                      { label: "Flood Exposure", value: project.inputs.floodRisk, max: 10, icon: Droplet },
                      { label: "Coastal Exposure", value: project.inputs.coastalExposure, max: 10, icon: TrendingUp },
                      { label: "Water Stress", value: project.inputs.waterStress, max: 10, icon: Droplet },
                      { label: "Contamination Risk", value: project.inputs.contaminationRisk, max: 10, icon: Factory },
                      { label: "Regulatory Complexity", value: project.inputs.regulatoryComplexity, max: 10, icon: Gavel },
                      { label: "Data Confidence", value: riskScores.dataConfidence, max: 100, icon: Eye, inverted: true },
                    ];
                    return drivers.map((d, i) => {
                      const pct = (d.value / d.max) * 100;
                      const level = d.inverted
                        ? (d.value < 50 ? { label: "Low", color: "text-destructive", bg: "bg-destructive/10" } : d.value < 70 ? { label: "Medium", color: "text-warning", bg: "bg-warning/10" } : { label: "High", color: "text-success", bg: "bg-success/10" })
                        : getDriverLevel(d.value, d.max);
                      const Icon = d.icon;
                      return (
                        <div key={i} className={`rounded-xl border p-4 ${level.bg} border-white/5`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${level.color}`} />
                              <span className="text-sm font-semibold text-foreground">{d.label}</span>
                            </div>
                            <Badge variant="outline" className={`${level.color} font-mono`}>{level.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${level.color === "text-destructive" ? "bg-destructive" : level.color === "text-warning" ? "bg-warning" : "bg-success"}`} style={{ width: `${d.inverted ? 100 - pct : pct}%` }} />
                            </div>
                            <span className={`font-mono font-bold text-sm ${level.color}`}>{d.value}{d.max === 100 ? "%" : `/${d.max}`}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <ActivitySquare className="w-5 h-5 mr-2 text-primary" /> Risk Subscores
                </h3>
                <div className="h-52 w-full mb-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <RiskSubCard title="Environmental" score={riskScores.environmentalRisk} prevScore={isScenarioMode ? project.riskScores.environmentalRisk : undefined} icon={Droplet} />
                  <RiskSubCard title="Infrastructure" score={riskScores.infrastructureRisk} prevScore={isScenarioMode ? project.riskScores.infrastructureRisk : undefined} icon={Factory} />
                  <RiskSubCard title="Human Exposure" score={riskScores.humanExposureRisk} prevScore={isScenarioMode ? project.riskScores.humanExposureRisk : undefined} icon={Users} />
                  <RiskSubCard title="Regulatory" score={riskScores.regulatoryRisk} prevScore={isScenarioMode ? project.riskScores.regulatoryRisk : undefined} icon={Gavel} />
                </div>
              </Card>

              <Card className="p-6 border-primary/20 bg-primary/5">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                  <TrendingUp className="w-5 h-5 mr-2" /> Financial Translation
                </h3>
                <p className="text-sm text-muted-foreground mb-4">How these drivers translate into financial consequences.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Covenant Breach Probability</span>
                    <Badge variant="outline" className="font-mono">{formatPercent(financialRisk.covenantBreachPercent)}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Reputational Risk</span>
                    <Badge variant={financialRisk.reputationalRisk === 'High' ? 'destructive' : financialRisk.reputationalRisk === 'Medium' ? 'warning' : 'success'}>
                      {financialRisk.reputationalRisk}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Data Sources & Validation Status</h3>
                <p className="text-sm text-muted-foreground mb-4">Evidence base informing the risk assessment and decision signal.</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className={`rounded-xl border p-4 text-center ${project.inputs.hasLabData ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <Beaker className={`w-6 h-6 mx-auto mb-2 ${project.inputs.hasLabData ? "text-success" : "text-destructive"}`} />
                    <div className="text-sm font-semibold">{project.inputs.hasLabData ? "Validated" : "Not Available"}</div>
                    <div className="text-xs text-muted-foreground mt-1">Lab Data</div>
                    <div className="text-xs text-muted-foreground mt-2">{project.inputs.hasLabData ? "+20% confidence" : "Missing: -20% confidence"}</div>
                  </div>
                  <div className={`rounded-xl border p-4 text-center ${project.inputs.hasMonitoringData ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <Activity className={`w-6 h-6 mx-auto mb-2 ${project.inputs.hasMonitoringData ? "text-success" : "text-destructive"}`} />
                    <div className="text-sm font-semibold">{project.inputs.hasMonitoringData ? "Active" : "Not Deployed"}</div>
                    <div className="text-xs text-muted-foreground mt-1">Monitoring Data</div>
                    <div className="text-xs text-muted-foreground mt-2">{project.inputs.hasMonitoringData ? "+20% confidence" : "Missing: -20% confidence"}</div>
                  </div>
                  <div className={`rounded-xl border p-4 text-center ${project.inputs.isIFCAligned ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                    <Shield className={`w-6 h-6 mx-auto mb-2 ${project.inputs.isIFCAligned ? "text-success" : "text-warning"}`} />
                    <div className="text-sm font-semibold">{project.inputs.isIFCAligned ? "Aligned" : "Not Aligned"}</div>
                    <div className="text-xs text-muted-foreground mt-1">IFC Standards</div>
                    <div className="text-xs text-muted-foreground mt-2">{project.inputs.isIFCAligned ? "+20% confidence" : "Missing: -20% confidence"}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <h4 className="text-sm font-bold text-primary mb-3">Effect on Decision</h4>
                  <div className="space-y-2">
                    {!project.inputs.hasLabData && (
                      <div className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <span>Risk increased due to missing lab validation — risk engine applies uncertainty penalty</span>
                      </div>
                    )}
                    {!project.inputs.hasMonitoringData && (
                      <div className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <span>Deployment readiness blocked — monitoring data required for READY status</span>
                      </div>
                    )}
                    {!project.inputs.isIFCAligned && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <span>Confidence reduced — IFC alignment would unlock higher confidence and potentially lower rate</span>
                      </div>
                    )}
                    {project.inputs.hasLabData && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Risk reduced — lab validation provides verified environmental baseline</span>
                      </div>
                    )}
                    {project.inputs.hasMonitoringData && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Deployment readiness improved — monitoring data supports ongoing risk tracking</span>
                      </div>
                    )}
                    {project.inputs.isIFCAligned && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Confidence maximized — IFC alignment confirms international standard compliance</span>
                      </div>
                    )}
                    {riskScores.dataConfidence < 50 && (
                      <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t border-primary/20">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <span className="font-semibold text-destructive">Confidence below 50% — triggers +0.5% rate penalty and pushes toward grant-first structuring</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <FrameworkAlignmentTab projectId={id} />
              <CovenantsTab projectId={id} />
              <EsapTab projectId={id} />
            </div>
          )}

          {activeTab === "scenario" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-primary/30 bg-gradient-to-b from-background to-primary/5">
                  <h3 className="text-lg font-semibold flex items-center text-primary mb-2">
                    <Wand2 className="w-5 h-5 mr-2" /> Scenario Controls
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Toggle mitigations to see their impact on risk, rate, and cost.</p>
                  <div className="space-y-3 mb-6">
                    <ToggleCard active={toggles.hasMonitoringData || project.inputs.hasMonitoringData} disabled={project.inputs.hasMonitoringData} onClick={() => handleToggle('hasMonitoringData')} label="Add Monitoring" desc="+12mo baseline data" />
                    <ToggleCard active={toggles.hasLabData || project.inputs.hasLabData} disabled={project.inputs.hasLabData} onClick={() => handleToggle('hasLabData')} label="Lab Validation" desc="Certified sampling" />
                    <ToggleCard active={toggles.isIFCAligned || project.inputs.isIFCAligned} disabled={project.inputs.isIFCAligned} onClick={() => handleToggle('isIFCAligned')} label="IFC Alignment" desc="World Bank standards" />
                    <ToggleCard active={toggles.reducedInputs} disabled={false} onClick={() => handleToggle('reducedInputs')} label="Mitigate Hazards" desc="Flood/Contamination eng." />
                  </div>
                  <Button onClick={handleScenarioRun} disabled={isRunningScenario} className="w-full shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    {isRunningScenario ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Simulating...</> : 'Run Simulation'}
                  </Button>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Scenario Output</h3>
                  {!isScenarioMode ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Wand2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Toggle controls and run simulation to see before/after comparison.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-muted p-4 text-center bg-secondary/20">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Before</div>
                          <div className={`text-3xl font-mono font-bold ${getRiskColor(project.riskScores.overallRisk)}`}>{project.riskScores.overallRisk.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground mt-1">Risk Score</div>
                          <div className="text-xs font-mono text-muted-foreground mt-2">{formatPercent(project.riskScores.dataConfidence)} confidence</div>
                        </div>
                        <div className="rounded-xl border border-primary/30 p-4 text-center bg-primary/5">
                          <div className="text-xs text-primary uppercase tracking-wider mb-2 font-bold">After</div>
                          <div className={`text-3xl font-mono font-bold ${getRiskColor(scenarioResult!.after.riskScores.overallRisk)}`}>{scenarioResult!.after.riskScores.overallRisk.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground mt-1">Risk Score</div>
                          <div className="text-xs font-mono text-primary mt-2">{formatPercent(scenarioResult!.after.riskScores.dataConfidence)} confidence</div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                        <div className="text-xs text-success uppercase tracking-wider font-bold mb-2">Impact</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Risk Change</span>
                            <span className={`font-mono font-bold ${scenarioResult!.after.riskScores.overallRisk < project.riskScores.overallRisk ? "text-success" : "text-destructive"}`}>
                              {(scenarioResult!.after.riskScores.overallRisk - project.riskScores.overallRisk) > 0 ? "+" : ""}{(scenarioResult!.after.riskScores.overallRisk - project.riskScores.overallRisk).toFixed(1)} pts
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Decision</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={project.decision.outcome === "PROCEED" ? "success" : project.decision.outcome === "CONDITION" ? "warning" : "destructive"} className="text-[10px]">{project.decision.outcome}</Badge>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <Badge variant={scenarioResult!.after.decision.outcome === "PROCEED" ? "success" : scenarioResult!.after.decision.outcome === "CONDITION" ? "warning" : "destructive"} className="text-[10px]">{scenarioResult!.after.decision.outcome}</Badge>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-mono font-bold text-primary">
                              {formatPercent(project.riskScores.dataConfidence)} → {formatPercent(scenarioResult!.after.riskScores.dataConfidence)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Subscore Changes</div>
                        {[
                          { label: "Environmental", before: project.riskScores.environmentalRisk, after: scenarioResult!.after.riskScores.environmentalRisk },
                          { label: "Infrastructure", before: project.riskScores.infrastructureRisk, after: scenarioResult!.after.riskScores.infrastructureRisk },
                          { label: "Human Exposure", before: project.riskScores.humanExposureRisk, after: scenarioResult!.after.riskScores.humanExposureRisk },
                          { label: "Regulatory", before: project.riskScores.regulatoryRisk, after: scenarioResult!.after.riskScores.regulatoryRisk },
                        ].map((s, i) => {
                          const diff = s.after - s.before;
                          if (diff === 0) return null;
                          return (
                            <div key={i} className="flex justify-between items-center text-sm bg-secondary/20 rounded-lg px-3 py-2">
                              <span className="text-foreground/80">{s.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-mono">{s.before.toFixed(1)}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className={`font-mono font-bold ${diff < 0 ? "text-success" : "text-destructive"}`}>{s.after.toFixed(1)}</span>
                                <span className={`text-xs font-mono ${diff < 0 ? "text-success" : "text-destructive"}`}>({diff > 0 ? "+" : ""}{diff.toFixed(1)})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {riskHistory && riskHistory.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" /> Risk Monitoring Timeline
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">12-month risk trajectory showing impact of monitoring and validation improvements.</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={riskHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: any) => `M${v}`} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} labelFormatter={(v: any) => `Month ${v}`} />
                        <Legend />
                        <Line type="monotone" dataKey="overallRisk" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} name="Risk Score" />
                        <Line type="monotone" dataKey="dataConfidence" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Data Confidence" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "monitoring" && <MonitoringTab projectId={id} />}
          {activeTab === "audit" && <AuditTrailTab projectId={id} />}
          {activeTab === "report" && <ReportTab projectId={id} />}
        </AnimatedContainer>
      </div>
    </Layout>
  );
}

function RiskSubCard({ title, score, prevScore, icon: Icon }: { title: string, score: number, prevScore?: number, icon: any }) {
  const diff = prevScore !== undefined ? score - prevScore : 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Icon className="w-4 h-4 text-muted-foreground" /> {title}
        </div>
        <div className={`text-xl font-mono font-bold ${getRiskColor(score)}`}>{score.toFixed(1)}</div>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 rounded-full ${score > 70 ? 'bg-destructive' : score > 40 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${score}%` }} />
      </div>
      {diff !== 0 && (
        <div className={`text-xs font-mono mt-2 ${diff < 0 ? 'text-success' : 'text-destructive'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)} from baseline
        </div>
      )}
    </Card>
  );
}

function ToggleCard({ active, disabled, onClick, label, desc }: { active: boolean; disabled: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        active 
          ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
          : 'border-border/50 bg-card/50 hover:border-primary/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          active ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        }`}>
          {active && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </button>
  );
}
