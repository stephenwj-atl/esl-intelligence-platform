import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Building2, Boxes, ChevronDown, ChevronRight, DollarSign, Shield, Zap, AlertTriangle, Target } from "lucide-react";

const BASE = "/api";

const INSTRUMENT_COLORS: Record<string, string> = {
  LOAN: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  GRANT: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  BLENDED: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  GUARANTEE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  TECHNICAL_ASSISTANCE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PROGRAMMATIC: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  EMERGENCY: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function FunderLogicPage() {
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [tab, setTab] = useState<"instruments" | "families" | "services">("instruments");

  const { data: instrumentsData } = useQuery({
    queryKey: ["instruments"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/methodology/instruments`, { credentials: "include" });
      if (!res.ok) return null;
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

  const { data: eslCatalog } = useQuery({
    queryKey: ["esl-catalog"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/esl-services/catalog`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const instruments = instrumentsData?.instruments || [];

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <AnimatedContainer>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Funder Logic & Capital Intelligence</h1>
              <p className="text-sm text-muted-foreground mt-1">Instrument decision logic, sector family alignment, and ESL service recommendations</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
              <button onClick={() => setTab("instruments")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "instruments" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <DollarSign className="h-4 w-4 inline mr-1.5" />Instruments
              </button>
              <button onClick={() => setTab("families")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "families" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <Boxes className="h-4 w-4 inline mr-1.5" />Families
              </button>
              <button onClick={() => setTab("services")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "services" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                <Building2 className="h-4 w-4 inline mr-1.5" />ESL Services
              </button>
            </div>
          </div>
        </AnimatedContainer>

        {tab === "instruments" && (
          <AnimatedContainer delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
              {instruments.map((inst: any) => {
                const color = INSTRUMENT_COLORS[inst.key] || "text-muted-foreground";
                return (
                  <Card key={inst.key} className={`p-3 text-center cursor-pointer hover:bg-white/[0.03] transition-colors border ${expandedInstrument === inst.key ? "border-primary/30" : ""}`}
                    onClick={() => setExpandedInstrument(expandedInstrument === inst.key ? null : inst.key)}>
                    <div className={`text-sm font-bold ${color.split(" ")[0]}`}>{inst.name || inst.key}</div>
                    <div className="text-xs text-muted-foreground mt-1">{inst.decisionSignals?.length || 0} signals</div>
                  </Card>
                );
              })}
            </div>

            {expandedInstrument && (
              <InstrumentDetailCard
                instrument={instruments.find((i: any) => i.key === expandedInstrument)}
              />
            )}

            {!expandedInstrument && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Decision Signal Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Instrument</th>
                        <th className="text-center py-2 px-3 text-emerald-400 font-medium">PROCEED</th>
                        <th className="text-center py-2 px-3 text-cyan-400 font-medium">CONTROLS</th>
                        <th className="text-center py-2 px-3 text-amber-400 font-medium">CONDITION</th>
                        <th className="text-center py-2 px-3 text-orange-400 font-medium">RESEQUENCE</th>
                        <th className="text-center py-2 px-3 text-violet-400 font-medium">NARROW</th>
                        <th className="text-center py-2 px-3 text-blue-400 font-medium">DEFER</th>
                        <th className="text-center py-2 px-3 text-red-400 font-medium">DECLINE/DNF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {instruments.map((inst: any) => {
                        const sigs = inst.decisionSignals || [];
                        return (
                          <tr key={inst.key} className="hover:bg-white/[0.02]">
                            <td className={`py-2 px-3 font-medium ${(INSTRUMENT_COLORS[inst.key] || "").split(" ")[0]}`}>{inst.name || inst.key}</td>
                            <td className="text-center py-2">{sigs.includes("PROCEED") ? dot("emerald") : dash()}</td>
                            <td className="text-center py-2">{sigs.includes("PROCEED_WITH_CONTROLS") ? dot("cyan") : dash()}</td>
                            <td className="text-center py-2">{sigs.includes("CONDITION") ? dot("amber") : dash()}</td>
                            <td className="text-center py-2">{sigs.includes("RESEQUENCE") ? dot("orange") : dash()}</td>
                            <td className="text-center py-2">{sigs.includes("NARROW_SCOPE") ? dot("violet") : dash()}</td>
                            <td className="text-center py-2">{sigs.includes("DEFER_PENDING_BASELINE") ? dot("blue") : dash()}</td>
                            <td className="text-center py-2">{(sigs.includes("DECLINE") || sigs.includes("DO_NOT_FUND")) ? dot("red") : dash()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </AnimatedContainer>
        )}

        {tab === "families" && (
          <AnimatedContainer delay={0.1}>
            <Card className="p-0">
              <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-foreground">Sector Families & Capital Suitability</h2>
              </div>
              <div className="divide-y divide-white/5">
                {(Array.isArray(families) ? families : []).map((fam: any) => (
                  <FamilyRow
                    key={fam.key}
                    family={fam}
                    expanded={expandedFamily === fam.key}
                    onToggle={() => setExpandedFamily(expandedFamily === fam.key ? null : fam.key)}
                  />
                ))}
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {tab === "services" && eslCatalog && (
          <AnimatedContainer delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(eslCatalog) ? eslCatalog : eslCatalog.services || []).map((svc: any) => (
                <Card key={svc.key} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{svc.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{svc.description}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {svc.estimatedDurationWeeks && <span>Duration: {svc.estimatedDurationWeeks.min}-{svc.estimatedDurationWeeks.max} weeks</span>}
                        {svc.estimatedFeeRangeUSD && <span>Fee: ${(svc.estimatedFeeRangeUSD.min / 1000).toFixed(0)}K-${(svc.estimatedFeeRangeUSD.max / 1000).toFixed(0)}K</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </AnimatedContainer>
        )}
      </div>
    </Layout>
  );
}

function InstrumentDetailCard({ instrument }: { instrument: any }) {
  if (!instrument) return null;
  const color = INSTRUMENT_COLORS[instrument.key] || "";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${color}`}>{instrument.name || instrument.key}</span>
        <span className="text-sm text-muted-foreground">{instrument.description || "Instrument decision logic"}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Decision Signals</h4>
          <div className="space-y-1">
            {(instrument.decisionSignals || []).map((sig: string) => (
              <div key={sig} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5">
                <div className={`w-2 h-2 rounded-full ${signalDotColor(sig)}`} />
                <span className="text-xs font-mono text-foreground">{sig}</span>
              </div>
            ))}
          </div>
        </div>

        {instrument.thresholds && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Thresholds</h4>
            <div className="space-y-1">
              {Object.entries(instrument.thresholds).map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-center justify-between px-3 py-1.5 rounded bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-muted-foreground">{key.replace(/_/g, " ")}</span>
                  <span className="text-xs font-mono text-cyan-400">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function FamilyRow({ family, expanded, onToggle }: { family: any; expanded: boolean; onToggle: () => void }) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const projectTypes = family.projectTypes || [];

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
        <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{family.name}</div>
          <div className="text-xs text-muted-foreground">{family.description || `${projectTypes.length} project types`}</div>
        </div>
        <span className="text-xs text-muted-foreground">{projectTypes.length} types</span>
      </button>
      {expanded && (
        <div className="px-6 pb-4 space-y-3 bg-white/[0.01]">
          {family.capitalSuitability && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Capital Suitability</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(family.capitalSuitability).map(([inst, level]: [string, any]) => (
                  <span key={inst} className={`px-2 py-0.5 rounded text-xs border ${INSTRUMENT_COLORS[inst] || ""}`}>
                    {inst}: {level}
                  </span>
                ))}
              </div>
            </div>
          )}
          {projectTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Project Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {projectTypes.map((pt: any) => (
                  <div key={pt.key || pt} className="px-2 py-1 text-xs text-foreground bg-white/[0.03] rounded border border-white/5">
                    {pt.name || pt}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function dot(color: string) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full bg-${color}-500`} />;
}

function dash() {
  return <span className="text-white/10">&mdash;</span>;
}

function signalDotColor(sig: string) {
  if (sig === "PROCEED") return "bg-emerald-500";
  if (sig === "PROCEED_WITH_CONTROLS") return "bg-cyan-500";
  if (sig === "CONDITION") return "bg-amber-500";
  if (sig === "RESEQUENCE") return "bg-orange-500";
  if (sig === "NARROW_SCOPE") return "bg-violet-500";
  if (sig === "DEFER_PENDING_BASELINE") return "bg-blue-500";
  if (sig === "DECLINE" || sig === "DO_NOT_FUND") return "bg-red-500";
  return "bg-muted-foreground";
}
