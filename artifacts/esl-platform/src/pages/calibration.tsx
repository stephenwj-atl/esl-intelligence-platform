import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, AnimatedContainer } from "@/components/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Beaker, FileText, Plus, ChevronRight, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";

const BASE = "/api";

type MemoType = "weighting_defense" | "calibration_review" | "portfolio_risk_methodology" | "sector_family_scoring" | "instrument_logic" | "grant_blended_readiness";

const MEMO_TYPES: { key: MemoType; label: string; description: string }[] = [
  { key: "weighting_defense", label: "Weighting Defense", description: "Document and defend current weighting choices for a methodology profile" },
  { key: "calibration_review", label: "Calibration Review", description: "Review model calibration across all profiles and identify issues" },
  { key: "portfolio_risk_methodology", label: "Portfolio Methodology", description: "Document risk methodology applied to the current portfolio" },
  { key: "sector_family_scoring", label: "Sector Family Scoring", description: "Document scoring methodology for a specific sector family" },
  { key: "instrument_logic", label: "Instrument Logic", description: "Document instrument-specific decision logic differences" },
  { key: "grant_blended_readiness", label: "Grant/Blended Readiness", description: "Assess portfolio readiness for grant and blended deployment" },
];

export default function CalibrationPage() {
  const queryClient = useQueryClient();
  const [selectedMemoType, setSelectedMemoType] = useState<MemoType>("weighting_defense");
  const [profileKey, setProfileKey] = useState("PERS_DEFAULT_V1");
  const [expandedMemo, setExpandedMemo] = useState<number | null>(null);

  const { data: memos = [] } = useQuery({
    queryKey: ["calibration-memos"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/calibration/memos`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["methodology-profiles"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/methodology/profiles`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: validationCases = [] } = useQuery({
    queryKey: ["validation-cases"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/validation/cases`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ["overrides"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/overrides`, { credentials: "include" });
      return res.json();
    },
  });

  const generateMemo = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/calibration/memos/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memoType: selectedMemoType, profileKey }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calibration-memos"] }),
  });

  return (
    <Layout>
      <AnimatedContainer delay={0}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Beaker className="h-8 w-8 text-primary" />
              Calibration Workbench
            </h1>
            <p className="text-muted-foreground mt-1">Methodology defense, calibration memos, validation cases, and override governance</p>
          </div>
        </div>
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <AnimatedContainer delay={50}>
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
            <div className="text-xs text-muted-foreground">Active Profiles</div>
          </Card>
        </AnimatedContainer>
        <AnimatedContainer delay={100}>
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="text-2xl font-bold text-foreground">{memos.length}</div>
            <div className="text-xs text-muted-foreground">Memos Generated</div>
          </Card>
        </AnimatedContainer>
        <AnimatedContainer delay={150}>
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="text-2xl font-bold text-foreground">{validationCases.length}</div>
            <div className="text-xs text-muted-foreground">Validation Cases</div>
          </Card>
        </AnimatedContainer>
        <AnimatedContainer delay={200}>
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="text-2xl font-bold text-foreground">{overrides.length}</div>
            <div className="text-xs text-muted-foreground">Override Decisions</div>
          </Card>
        </AnimatedContainer>
      </div>

      <AnimatedContainer delay={250}>
        <Card className="p-6 bg-card/50 border-border/50 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Calibration Memo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Memo Type</label>
              <select
                value={selectedMemoType}
                onChange={(e) => setSelectedMemoType(e.target.value as MemoType)}
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {MEMO_TYPES.map((mt) => (
                  <option key={mt.key} value={mt.key}>{mt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">{MEMO_TYPES.find(m => m.key === selectedMemoType)?.description}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Methodology Profile</label>
              <select
                value={profileKey}
                onChange={(e) => setProfileKey(e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {profiles.map((p: { profileKey: string; name: string }) => (
                  <option key={p.profileKey} value={p.profileKey}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => generateMemo.mutate()}
                disabled={generateMemo.isPending}
                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {generateMemo.isPending ? "Generating..." : "Generate Memo"}
              </button>
            </div>
          </div>
        </Card>
      </AnimatedContainer>

      <AnimatedContainer delay={300}>
        <Card className="p-6 bg-card/50 border-border/50 mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Generated Memos</h2>
          {memos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memos generated yet. Use the form above to generate your first calibration memo.</p>
          ) : (
            <div className="space-y-3">
              {memos.map((memo: { id: number; title: string; memoType: string; status: string; generatedAt: string; content: { purpose?: string; confidenceStatement?: string; sections?: { heading: string; content: string }[]; recommendations?: string[]; validationNeeds?: string[] } }) => (
                <div key={memo.id} className="border border-border/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedMemo(expandedMemo === memo.id ? null : memo.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{memo.title}</div>
                        <div className="text-xs text-muted-foreground">{memo.memoType} | {new Date(memo.generatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${memo.status === "draft" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>
                        {memo.status}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedMemo === memo.id ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedMemo === memo.id && memo.content && (
                    <div className="border-t border-border/30 p-4 space-y-4 bg-secondary/10">
                      {memo.content.purpose && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Purpose</div>
                          <p className="text-sm text-foreground">{memo.content.purpose}</p>
                        </div>
                      )}
                      {memo.content.sections?.map((section: { heading: string; content: string }, i: number) => (
                        <div key={i}>
                          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{section.heading}</div>
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-background/50 p-3 rounded border border-border/30">{section.content}</pre>
                        </div>
                      ))}
                      {memo.content.confidenceStatement && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-yellow-200">{memo.content.confidenceStatement}</p>
                        </div>
                      )}
                      {memo.content.recommendations && memo.content.recommendations.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommendations</div>
                          <ul className="space-y-1">
                            {memo.content.recommendations.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {memo.content.validationNeeds && memo.content.validationNeeds.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Validation Needs</div>
                          <ul className="space-y-1">
                            {memo.content.validationNeeds.map((v: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AnimatedContainer delay={350}>
          <Card className="p-6 bg-card/50 border-border/50">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Validation Cases
            </h2>
            {validationCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No validation cases recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {validationCases.map((vc: { id: number; caseType: string; predictedRisk: number; observedRisk: number | null; sectorFamily: string; createdAt: string }) => (
                  <div key={vc.id} className="p-3 border border-border/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{vc.caseType}</span>
                      <span className="text-xs text-muted-foreground">{vc.sectorFamily}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">Predicted: <span className="text-foreground font-mono">{vc.predictedRisk?.toFixed(1) ?? "N/A"}</span></span>
                      <span className="text-muted-foreground">Observed: <span className={`font-mono ${vc.observedRisk != null ? "text-foreground" : "text-yellow-400"}`}>{vc.observedRisk?.toFixed(1) ?? "Pending"}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={400}>
          <Card className="p-6 bg-card/50 border-border/50">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Override Decisions
            </h2>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No override decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {overrides.map((o: { id: number; overrideType: string; originalValue: string; overriddenValue: string; reason: string; reviewer: string; createdAt: string }) => (
                  <div key={o.id} className="p-3 border border-border/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{o.overrideType}</span>
                      <span className="text-xs text-muted-foreground">by {o.reviewer}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-red-400 font-mono">{o.originalValue}</span>
                      <span className="mx-2">{"\u2192"}</span>
                      <span className="text-green-400 font-mono">{o.overriddenValue}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{o.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedContainer>
      </div>
    </Layout>
  );
}
