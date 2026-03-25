import { useRoute, useLocation } from "wouter";
import { useGetProject, useDeleteProject } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatPercent, getRiskColor, getRiskBgColor } from "@/lib/utils";
import { 
  ArrowLeft, Trash2, ShieldCheck, AlertTriangle, XCircle, 
  Droplet, Factory, Users, Gavel, Loader2, Target,
  TrendingUp, CalendarX, DollarSign, ActivitySquare
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: project, isLoading, isError } = useGetProject(id);
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

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

  const { riskScores, financialRisk, decision } = project;
  
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

  const dConf = decisionConfig[decision.outcome];
  const DecisionIcon = dConf.icon;

  const handleDelete = () => {
    if(confirm("Are you sure you want to delete this assessment?")) {
      deleteProject({ id }, {
        onSuccess: () => setLocation("/")
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-12 space-y-8">
        {/* Header */}
        <AnimatedContainer className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-secondary hover:bg-white/10" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <Badge>{project.projectType}</Badge>
                <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">{project.country}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{project.name}</h1>
            </div>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </AnimatedContainer>

        {/* DECISION BANNER */}
        <AnimatedContainer delay={0.1}>
          <div className={`rounded-2xl border ${dConf.border} ${dConf.bg} p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden backdrop-blur-md`}>
            <div className={`p-4 rounded-full bg-background border ${dConf.border} shadow-lg shrink-0`}>
              <DecisionIcon className={`w-12 h-12 ${dConf.color}`} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Investment Decision Signal</h2>
              </div>
              <h3 className={`text-4xl font-display font-black tracking-tight ${dConf.color} mb-4`}>
                {dConf.title}
              </h3>
              <p className="text-foreground/90 text-lg max-w-3xl leading-relaxed border-l-2 pl-4 border-foreground/20">
                {decision.insight}
              </p>
              
              {decision.conditions && decision.conditions.length > 0 && (
                <div className="mt-6 bg-background/50 rounded-xl p-5 border border-white/5 text-left">
                  <h4 className="text-sm font-semibold mb-3 flex items-center"><Target className="w-4 h-4 mr-2 text-warning"/> Required Mitigations</h4>
                  <ul className="space-y-2">
                    {decision.conditions.map((cond, idx) => (
                      <li key={idx} className="flex items-start text-sm text-foreground/80">
                        <span className="text-warning mr-2 mt-0.5">•</span> {cond}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </AnimatedContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Risk Scores */}
          <AnimatedContainer delay={0.2} className="lg:col-span-2 space-y-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <ActivitySquare className="w-5 h-5 mr-2 text-primary" /> Risk Topology Breakdown
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                    <Tooltip 
                      cursor={{fill: '#27272a', opacity: 0.4}}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 7 ? '#f43f5e' : entry.value > 4 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RiskSubCard title="Environmental" score={riskScores.environmentalRisk} icon={Droplet} />
              <RiskSubCard title="Infrastructure" score={riskScores.infrastructureRisk} icon={Factory} />
              <RiskSubCard title="Human Exposure" score={riskScores.humanExposureRisk} icon={Users} />
              <RiskSubCard title="Regulatory" score={riskScores.regulatoryRisk} icon={Gavel} />
            </div>
          </AnimatedContainer>

          {/* Side Panel: Overall & Financials */}
          <AnimatedContainer delay={0.3} className="space-y-8">
            
            <Card className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Overall Risk Score</div>
              <div className={`text-7xl font-display font-black tracking-tighter ${getRiskColor(riskScores.overallRisk)}`}>
                {riskScores.overallRisk.toFixed(1)}
              </div>
              <div className="mt-4 inline-flex items-center justify-center px-3 py-1 bg-secondary rounded-full text-xs font-mono">
                Data Confidence: <span className="text-primary ml-2">{formatPercent(riskScores.dataConfidence)}</span>
              </div>
            </Card>

            <Card className="p-6 border-primary/20 bg-primary/5">
              <h3 className="text-lg font-semibold mb-6 flex items-center text-primary">
                <TrendingUp className="w-5 h-5 mr-2" /> Financial Translation
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-foreground/80 flex items-center"><CalendarX className="w-4 h-4 mr-2 text-muted-foreground" /> Delay Risk</span>
                    <span className="font-mono font-bold text-destructive">{formatPercent(financialRisk.delayRiskPercent)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: `${financialRisk.delayRiskPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-foreground/80 flex items-center"><DollarSign className="w-4 h-4 mr-2 text-muted-foreground" /> Cost Overrun</span>
                    <span className="font-mono font-bold text-warning">{formatPercent(financialRisk.costOverrunPercent)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${financialRisk.costOverrunPercent}%` }} />
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

          </AnimatedContainer>
        </div>
      </div>
    </Layout>
  );
}

function RiskSubCard({ title, score, icon: Icon }: { title: string, score: number, icon: any }) {
  return (
    <div className={`p-4 rounded-xl border ${getRiskBgColor(score)} flex items-center justify-between`}>
      <div className="flex items-center">
        <div className="p-2 rounded-lg bg-background/50 border border-white/5 mr-3">
          <Icon className={`w-5 h-5 ${getRiskColor(score)}`} />
        </div>
        <span className="font-semibold text-foreground/90">{title}</span>
      </div>
      <div className={`text-xl font-display font-bold ${getRiskColor(score)}`}>
        {score.toFixed(1)}
      </div>
    </div>
  );
}
