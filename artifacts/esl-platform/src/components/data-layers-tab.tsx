import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { Database, CheckCircle, AlertTriangle, HelpCircle, XCircle, ChevronDown, ChevronRight, ExternalLink, Layers, Shield, Building, Users, Gavel } from "lucide-react";

interface DataLayer {
  id: number;
  layerId: string;
  layerName: string;
  category: string;
  country: string;
  sourceName: string | null;
  sourceUrl: string | null;
  format: string | null;
  resolution: string | null;
  coverageArea: string | null;
  accessMethod: string | null;
  quality: string;
  notes: string | null;
  riskDomain: string | null;
  confidenceWeight: number;
  effectiveQuality: string;
  projectStatus: string;
  projectNotes: string | null;
  verifiedAt: string | null;
}

interface CategorySummary {
  category: string;
  total: number;
  good: number;
  partial: number;
  proxy: number;
  missing: number;
}

interface ProjectDataLayersResponse {
  projectId: number;
  country: string;
  totalLayers: number;
  good: number;
  partial: number;
  proxy: number;
  missing: number;
  dataReadiness: number;
  byCategory: CategorySummary[];
  layers: DataLayer[];
}

const QUALITY_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  Good: { color: "text-emerald-400", bg: "bg-emerald-500/15", icon: CheckCircle, label: "Good" },
  Partial: { color: "text-amber-400", bg: "bg-amber-500/15", icon: AlertTriangle, label: "Partial" },
  Proxy: { color: "text-blue-400", bg: "bg-blue-500/15", icon: HelpCircle, label: "Proxy" },
  Missing: { color: "text-red-400", bg: "bg-red-500/15", icon: XCircle, label: "Missing" },
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  "Environmental Hazards": Shield,
  "Infrastructure & Utilities": Building,
  "Social & Community": Users,
  "Regulatory & Planning": Gavel,
};

function QualityBadge({ quality }: { quality: string }) {
  const config = QUALITY_CONFIG[quality] || QUALITY_CONFIG.Missing;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ReadinessGauge({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-red-500";
  const textColor = value >= 70 ? "text-emerald-400" : value >= 45 ? "text-amber-400" : "text-red-400";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Data Readiness</span>
        <span className={`text-2xl font-mono font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {value >= 70 ? "Strong baseline — supports Stage 2 progression" :
         value >= 45 ? "Moderate coverage — key gaps may delay staging" :
         "Insufficient data — baseline formation blocked"}
      </p>
    </div>
  );
}

function CategoryRow({ summary }: { summary: CategorySummary }) {
  const Icon = CATEGORY_ICONS[summary.category] || Layers;
  const readiness = summary.total > 0 ? Math.round(((summary.good + summary.partial * 0.5 + summary.proxy * 0.25) / summary.total) * 100) : 0;
  const barColor = readiness >= 70 ? "bg-emerald-500" : readiness >= 45 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-foreground truncate">{summary.category}</span>
          <span className="text-xs text-muted-foreground ml-2">{summary.good}/{summary.total} good</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${readiness}%` }} />
        </div>
      </div>
    </div>
  );
}

function LayerRow({ layer }: { layer: DataLayer }) {
  const [expanded, setExpanded] = useState(false);
  const isOverridden = layer.effectiveQuality !== layer.quality;

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-2 hover:bg-white/[0.02] transition-colors text-left"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
        <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">{layer.layerId}</span>
        <span className="text-sm text-foreground flex-1 truncate">{layer.layerName}</span>
        {isOverridden && (
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0">VERIFIED</span>
        )}
        <QualityBadge quality={layer.effectiveQuality} />
      </button>
      {expanded && (
        <div className="pl-10 pr-4 pb-3 space-y-2">
          {layer.sourceName && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Source</span>
              <span className="text-xs text-foreground">{layer.sourceName}</span>
            </div>
          )}
          {layer.format && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Format</span>
              <span className="text-xs text-foreground">{layer.format}</span>
            </div>
          )}
          {layer.coverageArea && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Coverage</span>
              <span className="text-xs text-foreground">{layer.coverageArea}</span>
            </div>
          )}
          {layer.accessMethod && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Access</span>
              <span className="text-xs text-foreground">{layer.accessMethod}</span>
            </div>
          )}
          {layer.notes && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Notes</span>
              <span className="text-xs text-muted-foreground italic">{layer.notes}</span>
            </div>
          )}
          {isOverridden && layer.projectNotes && (
            <div className="flex items-start gap-2 bg-cyan-500/5 rounded p-2 mt-1">
              <span className="text-xs text-cyan-400 w-20 flex-shrink-0">Project</span>
              <span className="text-xs text-cyan-300">{layer.projectNotes}</span>
            </div>
          )}
          {layer.sourceUrl && (
            <a href={layer.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function DataLayersTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ProjectDataLayersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/projects/${projectId}/data-layers`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground"><Database className="h-5 w-5 animate-pulse mr-2" /> Loading data inventory...</div>;
  }

  if (!data || data.totalLayers === 0) {
    return (
      <Card className="p-6 text-center">
        <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No data layers available for this country</p>
      </Card>
    );
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const categories = [...new Set(data.layers.map(l => l.category))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <ReadinessGauge value={data.dataReadiness} />
        </Card>

        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Layer Quality Distribution</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-foreground">{data.good} Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-foreground">{data.partial} Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm text-foreground">{data.proxy} Proxy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-foreground">{data.missing} Missing</span>
            </div>
          </div>
          <div className="mt-3 flex h-3 rounded-full overflow-hidden bg-white/5">
            {data.good > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(data.good / data.totalLayers) * 100}%` }} />}
            {data.partial > 0 && <div className="bg-amber-500 h-full" style={{ width: `${(data.partial / data.totalLayers) * 100}%` }} />}
            {data.proxy > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(data.proxy / data.totalLayers) * 100}%` }} />}
            {data.missing > 0 && <div className="bg-red-500 h-full" style={{ width: `${(data.missing / data.totalLayers) * 100}%` }} />}
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Category Readiness</span>
          <div className="space-y-1">
            {data.byCategory.map(cat => (
              <CategoryRow key={cat.category} summary={cat} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{data.country} Data Inventory</span>
            <span className="text-xs text-muted-foreground">({data.totalLayers} layers)</span>
          </div>
          <span className="text-xs text-muted-foreground italic">Stage 2: Baseline Data Formation</span>
        </div>

        {categories.map(category => {
          const catLayers = data.layers.filter(l => l.category === category);
          const isExpanded = expandedCategories.has(category);
          const CatIcon = CATEGORY_ICONS[category] || Layers;
          const catGood = catLayers.filter(l => l.effectiveQuality === "Good").length;

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-white/5"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <CatIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground flex-1 text-left">{category}</span>
                <span className="text-xs text-muted-foreground">{catGood}/{catLayers.length} good</span>
              </button>
              {isExpanded && (
                <div className="px-2">
                  {catLayers.map(layer => (
                    <LayerRow key={layer.id} layer={layer} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
