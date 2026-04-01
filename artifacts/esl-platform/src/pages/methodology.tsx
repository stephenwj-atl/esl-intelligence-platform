import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { BookOpen, Calculator, Layers, Shield, Activity, Building2, AlertTriangle, Boxes, Gauge, GitBranch, ArrowLeftRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

const BASE = "/api";

const LAYERED_SCORING = [
  { name: "Country Context", weight: "Variable", description: "Governance quality (CPI), INFORM risk, environmental baseline. Weight varies by sector family: 35-50%.", color: "border-blue-500/30 bg-blue-500/5", icon: "1" },
  { name: "Project Exposure", weight: "Variable", description: "Site-specific hazard, sector complexity overlay. Reduced by SEA (0.85x) and ESIA (0.90x). Weight varies: 10-30%.", color: "border-cyan-500/30 bg-cyan-500/5", icon: "2" },
  { name: "Sector Sensitivity", weight: "Variable", description: "Community vulnerability, governance quality, disaster history. Weight varies: 15-25%.", color: "border-purple-500/30 bg-purple-500/5", icon: "3" },
  { name: "Intervention Delivery", weight: "Variable", description: "Delivery modality risk by intervention type. Five profiles with distinct risk drivers.", color: "border-orange-500/30 bg-orange-500/5", icon: "4" },
  { name: "Instrument Structure", weight: "Modifier", description: "Instrument-specific risk factors. Different logic for LOAN, GRANT, BLENDED, GUARANTEE, TA, PROGRAMMATIC, EMERGENCY.", color: "border-red-500/30 bg-red-500/5", icon: "5" },
  { name: "Outcome Delivery", weight: "Modifier", description: "Theory of change credibility, implementation capacity, outcome complexity. Active for ecosystems, agriculture, programmatic.", color: "border-green-500/30 bg-green-500/5", icon: "6" },
];

const INSTRUMENTS = [
  { name: "LOAN", signals: ["PROCEED", "CONDITION", "DECLINE"], description: "Commercial/concessional lending with covenant protections" },
  { name: "GRANT", signals: ["PROCEED", "PROCEED_WITH_CONTROLS", "RESEQUENCE", "NARROW_SCOPE", "DEFER_PENDING_BASELINE", "DO_NOT_FUND"], description: "Concessional capital — risk is the rationale for deployment" },
  { name: "BLENDED", signals: ["PROCEED", "PROCEED_WITH_CONTROLS", "CONDITION", "DO_NOT_FUND"], description: "Grant-first with transition pathway to commercial" },
  { name: "GUARANTEE", signals: ["PROCEED", "CONDITION", "DECLINE"], description: "Risk-sharing with coverage limits and premium adjustments" },
  { name: "TA", signals: ["PROCEED", "DEFER_PENDING_BASELINE", "NARROW_SCOPE"], description: "Knowledge transfer and capacity building" },
  { name: "PROGRAMMATIC", signals: ["PROCEED", "PROCEED_WITH_CONTROLS", "DEFER_PENDING_BASELINE", "DO_NOT_FUND"], description: "Multi-sector/multi-site deployment" },
  { name: "EMERGENCY", signals: ["PROCEED", "PROCEED_WITH_CONTROLS", "NARROW_SCOPE"], description: "Rapid-response — reduced confidence penalties" },
];

const CAPITAL_MODES = [
  { mode: "Loan", condition: "PERS < 45, confidence > 60%", description: "Low risk supports direct lending with standard covenants.", color: "text-success" },
  { mode: "Blended", condition: "PERS 45-70, or confidence gaps", description: "Grant-first approach de-risks before loan activation.", color: "text-warning" },
  { mode: "Grant", condition: "PERS > 70, confidence < 50%", description: "High risk requires grant-only deployment.", color: "text-destructive" },
];

const MONITORING_LEVELS = [
  { level: "STANDARD", condition: "PERS < 40, confidence >= 60%", frequency: "Semi-annual reporting, annual site visits", color: "text-success" },
  { level: "ENHANCED", condition: "PERS 40-65, or confidence 40-60%", frequency: "Quarterly reporting, semi-annual site visits", color: "text-warning" },
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
  const [comparisonProjectId, setComparisonProjectId] = useState<number | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["methodology-profiles"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/methodology/profiles`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: families = [] } = useQuery({
    queryKey: ["sector-families"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/methodology/sector-families`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-comparison"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/projects`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.projects || [];
    },
  });

  const compareProfiles = useMutation({
    mutationFn: async () => {
      if (!comparisonProjectId || selectedProfiles.length < 2) return null;
      const res = await fetch(`${BASE}/methodology/compare/project/${comparisonProjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileKeys: selectedProfiles }),
      });
      if (!res.ok) return null;
      return res.json();
    },
    onSuccess: (data) => setComparisonResult(data),
  });

  const toggleProfile = (key: string) => {
    setSelectedProfiles(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setComparisonResult(null);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12 space-y-8">
        <AnimatedContainer>
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              PERS Methodology v2.0
            </h1>
            <p className="text-muted-foreground mt-2">
              Layered Project Environmental Risk Score — 6-layer scoring architecture with family-specific profiles and instrument-aware decision logic.
            </p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.05}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> Layered Scoring Architecture
            </h2>
            <div className="bg-secondary/30 rounded-xl p-6 mb-6 text-center">
              <p className="font-mono text-sm text-foreground leading-relaxed">
                PERS = (CountryContext x <span className="text-primary">W1</span>) + (ProjectExposure x <span className="text-primary">W2</span>) + (SectorSensitivity x <span className="text-primary">W3</span>) + (InterventionDelivery x <span className="text-primary">W4</span>) + (OutcomeDelivery x <span className="text-cyan-400">M1</span>) + (InstrumentStructure x <span className="text-cyan-400">M2</span>)
              </p>
              <p className="text-xs text-muted-foreground mt-2">Weights (W1-W4) and modifiers (M1-M2) are set by the sector family methodology profile</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                <div className="text-2xl font-mono font-bold text-success">&lt; 40</div>
                <div className="text-xs text-muted-foreground mt-1">PROCEED</div>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
                <div className="text-2xl font-mono font-bold text-warning">40 - 70</div>
                <div className="text-xs text-muted-foreground mt-1">CONDITION</div>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <div className="text-2xl font-mono font-bold text-destructive">&gt; 70</div>
                <div className="text-xs text-muted-foreground mt-1">DECLINE</div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> 6-Layer Scoring Components
            </h2>
            <div className="space-y-4">
              {LAYERED_SCORING.map(layer => (
                <div key={layer.name} className={`rounded-xl border p-5 ${layer.color}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">{layer.icon}</span>
                      <h3 className="font-semibold">{layer.name}</h3>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{layer.weight}</span>
                  </div>
                  <p className="text-sm text-foreground/70 ml-10">{layer.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.15}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" /> Sector Family Profiles ({families.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(profiles as { profileKey: string; name: string; sectorFamily: string; weights: { countryContext: number; projectOverlay: number; sensitivity: number; interventionRisk: number; outcomeRiskModifier: number }; rationale: string }[]).map((p) => (
                <div key={p.profileKey} className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                  <div className="text-sm font-semibold text-primary mb-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{p.sectorFamily}</div>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{(p.weights.countryContext * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">CC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{(p.weights.projectOverlay * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">PO</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{(p.weights.sensitivity * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">SE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{(p.weights.interventionRisk * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">IR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{(p.weights.outcomeRiskModifier * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">OR</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.rationale}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.18}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" /> Profile Comparison Engine
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Compare how different methodology profiles score the same project. Select a project and 2+ profiles to compare.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Project</label>
                <select
                  value={comparisonProjectId ?? ""}
                  onChange={e => { setComparisonProjectId(e.target.value ? parseInt(e.target.value) : null); setComparisonResult(null); }}
                  className="w-full bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select a project...</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Profiles (select 2+)</label>
                <div className="flex flex-wrap gap-1">
                  {(profiles as any[]).map((p: any) => (
                    <button key={p.profileKey} onClick={() => toggleProfile(p.profileKey)}
                      className={`px-2 py-1 text-[10px] rounded border transition-colors ${selectedProfiles.includes(p.profileKey) ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"}`}>
                      {p.name.replace("PERS ", "").replace(" V1", "")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => compareProfiles.mutate()}
              disabled={!comparisonProjectId || selectedProfiles.length < 2 || compareProfiles.isPending}
              className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {compareProfiles.isPending ? "Comparing..." : "Run Comparison"}
            </button>

            {comparisonResult?.comparisons && (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-2 text-muted-foreground">Profile</th>
                        <th className="text-center py-2 px-2 text-muted-foreground">PERS Final</th>
                        <th className="text-center py-2 px-2 text-muted-foreground">Delta</th>
                        <th className="text-center py-2 px-2 text-muted-foreground">Signal</th>
                        <th className="text-center py-2 px-2 text-muted-foreground">Capital</th>
                        <th className="text-center py-2 px-2 text-muted-foreground">Monitoring</th>
                        <th className="text-left py-2 px-2 text-muted-foreground">Top Changes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {comparisonResult.comparisons.map((c: any) => (
                        <tr key={c.profileKey} className={`hover:bg-white/[0.02] ${c.profileKey === comparisonResult.activeProfile ? "bg-primary/5" : ""}`}>
                          <td className="py-2 px-2 font-medium text-foreground">
                            {c.profileName}
                            {c.profileKey === comparisonResult.activeProfile && <span className="ml-1 text-[9px] text-primary">(active)</span>}
                          </td>
                          <td className="text-center py-2 px-2 font-mono font-bold">
                            <span className={c.layeredScores.persFinalScore < 40 ? "text-success" : c.layeredScores.persFinalScore < 70 ? "text-warning" : "text-destructive"}>
                              {c.layeredScores.persFinalScore?.toFixed(1)}
                            </span>
                          </td>
                          <td className="text-center py-2 px-2 font-mono">
                            {c.deltas.persFinalDelta !== 0 && (
                              <span className={c.deltas.persFinalDelta > 0 ? "text-red-400" : "text-green-400"}>
                                {c.deltas.persFinalDelta > 0 ? "+" : ""}{c.deltas.persFinalDelta}
                              </span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.deltas.decisionChanged ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-foreground/60"}`}>
                              {c.decisionSignal}
                            </span>
                          </td>
                          <td className="text-center py-2 px-2 text-foreground/70">{c.capitalMode}</td>
                          <td className="text-center py-2 px-2 text-foreground/70">{c.monitoringIntensity}</td>
                          <td className="py-2 px-2 text-foreground/60">
                            {(c.deltas.topDriverChanges || []).slice(0, 2).join(", ") || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.2}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" /> Instrument Decision Logic
            </h2>
            <div className="space-y-3">
              {INSTRUMENTS.map(inst => (
                <div key={inst.name} className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{inst.name}</span>
                    <span className="text-xs text-muted-foreground">{inst.description}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inst.signals.map(s => (
                      <span key={s} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        s === "PROCEED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        s === "PROCEED_WITH_CONTROLS" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                        s === "CONDITION" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                        s === "DECLINE" || s === "DO_NOT_FUND" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedContainer delay={0.25}>
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

          <AnimatedContainer delay={0.3}>
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

        <AnimatedContainer delay={0.35}>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" /> Sector Families ({families.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(families as { key: string; name: string; description: string; projectTypes: { type: string }[] }[]).map(f => (
                <div key={f.key} className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                  <div className="text-sm font-semibold text-foreground mb-1">{f.name}</div>
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{f.description}</div>
                  <div className="text-xs text-primary font-mono">{f.projectTypes?.length ?? 0} project types</div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.4}>
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
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.45}>
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-lg font-semibold mb-2">Data Pipeline Foundation</h2>
            <p className="text-sm text-muted-foreground mb-3">
              PERS scores are powered by 26+ live data pipelines ingesting environmental, governance, and disaster data across 17 Caribbean countries.
            </p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono font-bold text-primary">26+</div>
                <div className="text-xs text-muted-foreground">Pipelines</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-primary">17</div>
                <div className="text-xs text-muted-foreground">Countries</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-primary">8</div>
                <div className="text-xs text-muted-foreground">Sector Families</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-primary">7</div>
                <div className="text-xs text-muted-foreground">Instruments</div>
              </div>
            </div>
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}
