import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { BookOpen, Calculator, Layers, Shield, Activity, Building2, AlertTriangle } from "lucide-react";

const PERS_COMPONENTS = [
  {
    name: "CERI — Country Environmental Risk Index",
    weight: "50%",
    description: "Composite of environmental (30%), infrastructure (25%), human exposure (20%), and regulatory risk (25%). Derived from 26 live data pipelines including INFORM Risk Index, ND-GAIN, World Bank, and EM-DAT disaster history.",
    color: "border-blue-500/30 bg-blue-500/5",
  },
  {
    name: "Project Overlay",
    weight: "25%",
    description: "Sector-specific complexity overlay adjusted by project type. Reduced by 0.85× when SEA framework exists, and 0.90× when ESIA is completed. Reflects the CEO directive: SEA and ESIA are primary investment guidance tools; EIA is permitting compliance only.",
    color: "border-cyan-500/30 bg-cyan-500/5",
  },
  {
    name: "Sensitivity",
    weight: "15%",
    description: "Human exposure (40%), regulatory complexity (25%), governance quality via CPI (20%), and disaster loss history via EM-DAT (15%). Captures the social and institutional context of the investment.",
    color: "border-purple-500/30 bg-purple-500/5",
  },
  {
    name: "Intervention Risk",
    weight: "10%",
    description: "Delivery risk specific to the intervention modality. Five profiles: Physical Infrastructure, Social/Programmatic, Environmental, Governance, and Disaster. Each has distinct risk drivers and typical failure modes.",
    color: "border-orange-500/30 bg-orange-500/5",
  },
];

const CAPITAL_MODES = [
  { mode: "Loan", condition: "PERS < 45, confidence > 60%", description: "Low risk supports direct lending with standard covenants. Risk premium applied to base rate of 8%.", color: "text-success" },
  { mode: "Blended", condition: "PERS 45–70, or confidence gaps", description: "Grant-first approach de-risks environment before loan activation. Grant percentage calculated from risk, confidence, and validation gaps.", color: "text-warning" },
  { mode: "Grant", condition: "PERS > 70, confidence < 50%", description: "High risk and low confidence require grant-only deployment. Focus on impact delivery probability and utilisation rate.", color: "text-destructive" },
];

const MONITORING_LEVELS = [
  { level: "STANDARD", condition: "PERS < 40, confidence ≥ 60%", frequency: "Semi-annual reporting, annual site visits", color: "text-success" },
  { level: "ENHANCED", condition: "PERS 40–65, or confidence 40–60%", frequency: "Quarterly reporting, semi-annual site visits", color: "text-warning" },
  { level: "INTENSIVE", condition: "PERS > 65, or confidence < 40%", frequency: "Monthly reporting, quarterly site visits", color: "text-destructive" },
];

const FRAMEWORKS = [
  { name: "IDB ESPF", org: "Inter-American Development Bank" },
  { name: "CDB ESRP", org: "Caribbean Development Bank" },
  { name: "World Bank ESF", org: "World Bank" },
  { name: "GCF", org: "Green Climate Fund" },
  { name: "EIB", org: "European Investment Bank" },
  { name: "Equator Principles", org: "EP Association" },
];

export default function MethodologyPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12 space-y-8">
        <AnimatedContainer>
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              PERS Methodology
            </h1>
            <p className="text-muted-foreground mt-2">
              Project Environmental Risk Score — the quantitative framework powering ESL's capital deployment decisions.
            </p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> The Formula
            </h2>
            <div className="bg-secondary/30 rounded-xl p-6 mb-6 text-center">
              <p className="font-mono text-lg text-foreground">
                PERS = (CERI × <span className="text-primary">0.50</span>) + (ProjectOverlay × <span className="text-primary">0.25</span>) + (Sensitivity × <span className="text-primary">0.15</span>) + (InterventionRisk × <span className="text-primary">0.10</span>)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                <div className="text-2xl font-mono font-bold text-success">&lt; 40</div>
                <div className="text-xs text-muted-foreground mt-1">PROCEED</div>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
                <div className="text-2xl font-mono font-bold text-warning">40 – 70</div>
                <div className="text-xs text-muted-foreground mt-1">CONDITION</div>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <div className="text-2xl font-mono font-bold text-destructive">&gt; 70</div>
                <div className="text-xs text-muted-foreground mt-1">DECLINE</div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.15}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Components
            </h2>
            <div className="space-y-4">
              {PERS_COMPONENTS.map(comp => (
                <div key={comp.name} className={`rounded-xl border p-5 ${comp.color}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{comp.name}</h3>
                    <span className="text-sm font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{comp.weight}</span>
                  </div>
                  <p className="text-sm text-foreground/70">{comp.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedContainer delay={0.2}>
            <Card className="p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Capital Modes
              </h2>
              <div className="space-y-4">
                {CAPITAL_MODES.map(m => (
                  <div key={m.mode} className="bg-secondary/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${m.color}`}>{m.mode}</span>
                      <span className="text-xs font-mono text-muted-foreground">{m.condition}</span>
                    </div>
                    <p className="text-sm text-foreground/70">{m.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.25}>
            <Card className="p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Monitoring Intensity
              </h2>
              <div className="space-y-4">
                {MONITORING_LEVELS.map(m => (
                  <div key={m.level} className="bg-secondary/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${m.color}`}>{m.level}</span>
                      <span className="text-xs font-mono text-muted-foreground">{m.condition}</span>
                    </div>
                    <p className="text-sm text-foreground/70">{m.frequency}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedContainer>
        </div>

        <AnimatedContainer delay={0.3}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" /> Intervention Risk Profiles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {["Physical Infrastructure", "Social/Programmatic", "Environmental", "Governance", "Disaster"].map(type => (
                <div key={type} className="bg-secondary/20 rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold mb-1">{type}</div>
                  <div className="text-xs text-muted-foreground">Base risk varies by modality; adjusted by environmental, infrastructure, and confidence factors.</div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.35}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Lender Framework Alignment
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FRAMEWORKS.map(f => (
                <div key={f.name} className="bg-secondary/20 rounded-xl p-4">
                  <div className="text-sm font-semibold text-primary">{f.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.org}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/70 mt-4 italic">
              Each framework provides specific EIA/ESIA requirements, risk categorization, and monitoring standards. PERS assessments are cross-referenced against the selected framework.
            </p>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.4}>
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-lg font-semibold mb-2">Data Pipeline Foundation</h2>
            <p className="text-sm text-muted-foreground mb-3">
              PERS scores are powered by 26 live data pipelines ingesting environmental, governance, and disaster data across 17 Caribbean countries.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono font-bold text-primary">26</div>
                <div className="text-xs text-muted-foreground">Data Pipelines</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-primary">17</div>
                <div className="text-xs text-muted-foreground">Countries</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-primary">2,000+</div>
                <div className="text-xs text-muted-foreground">Data Points</div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}
