import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge, AnimatedContainer } from "@/components/ui";
import {
  FileStack, Plus, ChevronRight, Shield, Building2, Umbrella,
  Globe, Loader2, Trash2, Upload, ArrowRight, Check
} from "lucide-react";

const BASE = "/api";

const ORG_TYPES = [
  { id: "DFI", label: "Development Finance Institution", desc: "IDB, CDB, IFC, World Bank", defaultFrameworks: ["ifc-ps", "equator", "paris"] },
  { id: "Bank", label: "Commercial / Corporate Bank", desc: "JMMB, NCB, FirstCaribbean, Republic", defaultFrameworks: ["central-bank-env", "basel-climate"] },
  { id: "Climate Fund", label: "Climate Finance Fund", desc: "GCF, GEF, CCRIF, AF", defaultFrameworks: ["gcf", "paris", "unfccc-safeguards"] },
  { id: "Insurance", label: "Insurance / Reinsurance", desc: "Sagicor, Guardian, Munich Re", defaultFrameworks: ["basel-climate"] },
];

const MODE_OPTIONS = [
  { id: "Loan", label: "Loan", desc: "Screen for commercial lending viability" },
  { id: "Grant", label: "Grant", desc: "Screen for grant eligibility and impact" },
  { id: "Blended", label: "Blended", desc: "Compute risk-derived grant/loan split per project" },
];

interface Framework {
  id: string;
  name: string;
  category: string;
}

export default function PipelineNew() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orgType, setOrgType] = useState("DFI");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["ifc-ps", "equator", "paris"]);
  const [capitalMode, setCapitalMode] = useState("Blended");
  const [maxRisk, setMaxRisk] = useState(70);
  const [minConfidence, setMinConfidence] = useState(50);
  const [totalEnvelope, setTotalEnvelope] = useState(50);
  const [maxSingleProject, setMaxSingleProject] = useState(10);

  useEffect(() => {
    fetch(`${BASE}/pipelines/frameworks`)
      .then(r => r.json())
      .then(setFrameworks)
      .catch(() => {});
  }, []);

  const selectOrgType = (ot: string) => {
    setOrgType(ot);
    const org = ORG_TYPES.find(o => o.id === ot);
    if (org) setSelectedFrameworks(org.defaultFrameworks);
  };

  const toggleFramework = (fwId: string) => {
    setSelectedFrameworks(prev =>
      prev.includes(fwId) ? prev.filter(f => f !== fwId) : [...prev, fwId]
    );
  };

  const createPipeline = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          orgType,
          frameworks: selectedFrameworks,
          thresholds: { maxRisk, minConfidence },
          capitalModeDefault: capitalMode,
          capitalConstraints: { totalEnvelope, maxSingleProject },
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const pipeline = await res.json();
      if (!pipeline?.id) throw new Error("Invalid response");
      setLocation(`/pipelines/${pipeline.id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <AnimatedContainer>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <FileStack className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Create Assessment Pipeline</h1>
            <p className="text-sm text-muted-foreground">Configure screening criteria for batch proposal assessment</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${step >= s ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Identity" : s === 2 ? "Frameworks" : "Thresholds"}
              </span>
              {s < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Pipeline Identity</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Pipeline Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Caribbean Desalination Climate Resilience Window" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Screening criteria and purpose" className="mt-1" />
                </div>
              </div>
            </Card>

            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Organization Type</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ORG_TYPES.map(ot => (
                  <button key={ot.id} onClick={() => selectOrgType(ot.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${orgType === ot.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"}`}>
                    <div className="text-sm font-semibold text-foreground">{ot.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{ot.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Default Capital Mode</div>
              <div className="grid grid-cols-3 gap-3">
                {MODE_OPTIONS.map(m => (
                  <button key={m.id} onClick={() => setCapitalMode(m.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${capitalMode === m.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"}`}>
                    <div className="text-sm font-semibold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name.trim()}>
                Next: Frameworks <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Compliance Frameworks</div>
              <p className="text-sm text-muted-foreground mb-4">Select which frameworks proposals will be screened against</p>
              <div className="space-y-2">
                {frameworks.map(fw => (
                  <button key={fw.id} onClick={() => toggleFramework(fw.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${selectedFrameworks.includes(fw.id) ? "border-primary bg-primary/5" : "border-border/30 hover:border-primary/20"}`}>
                    <div>
                      <div className="text-sm font-medium text-foreground">{fw.name}</div>
                      <div className="text-xs text-muted-foreground">{fw.category}</div>
                    </div>
                    {selectedFrameworks.includes(fw.id) && (
                      <Badge variant="success" className="text-[10px]">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>
                Next: Thresholds <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Risk Thresholds</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum Risk Score (0-100)</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input type="range" min={30} max={100} value={maxRisk} onChange={e => setMaxRisk(parseInt(e.target.value))}
                      className="flex-1 accent-primary" />
                    <span className="text-lg font-mono font-bold text-foreground w-12 text-right">{maxRisk}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Projects above this score will be flagged ineligible</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum Confidence (%)</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input type="range" min={0} max={100} value={minConfidence} onChange={e => setMinConfidence(parseInt(e.target.value))}
                      className="flex-1 accent-primary" />
                    <span className="text-lg font-mono font-bold text-foreground w-12 text-right">{minConfidence}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Projects below this confidence will be flagged</div>
                </div>
              </div>
            </Card>

            <Card className="border-border/40 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-4">Capital Constraints</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Total Envelope ($M)</Label>
                  <Input type="number" value={totalEnvelope} onChange={e => setTotalEnvelope(parseFloat(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Single Project ($M)</Label>
                  <Input type="number" value={maxSingleProject} onChange={e => setMaxSingleProject(parseFloat(e.target.value) || 0)} className="mt-1" />
                </div>
              </div>
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-3">Pipeline Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold text-foreground">{name}</span></div>
                <div><span className="text-muted-foreground">Org:</span> <span className="font-semibold text-foreground">{orgType}</span></div>
                <div><span className="text-muted-foreground">Mode:</span> <span className="font-semibold text-foreground">{capitalMode}</span></div>
                <div><span className="text-muted-foreground">Frameworks:</span> <span className="font-semibold text-foreground">{selectedFrameworks.length}</span></div>
                <div><span className="text-muted-foreground">Max Risk:</span> <span className="font-semibold text-foreground">{maxRisk}</span></div>
                <div><span className="text-muted-foreground">Min Confidence:</span> <span className="font-semibold text-foreground">{minConfidence}%</span></div>
                <div><span className="text-muted-foreground">Envelope:</span> <span className="font-semibold text-foreground">${totalEnvelope}M</span></div>
                <div><span className="text-muted-foreground">Max Project:</span> <span className="font-semibold text-foreground">${maxSingleProject}M</span></div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={createPipeline} disabled={creating || !name.trim()}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Pipeline
              </Button>
            </div>
          </div>
        )}
      </AnimatedContainer>
    </Layout>
  );
}
