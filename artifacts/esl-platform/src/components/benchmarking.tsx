import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { TrendingUp, TrendingDown, Target, BarChart3, Globe, Layers, Shield, FileCheck } from "lucide-react";
import { regionalApi, type ProjectBenchmark } from "@/lib/regional-api";

const ASSESSMENT_LABELS: Record<string, { label: string; category: "strategic" | "permitting" | "data" }> = {
  "NEPA SEA Count": { label: "SEA Assessments", category: "strategic" },
  "SEA Document Count": { label: "SEA Documents", category: "strategic" },
  "ESIA Document Count": { label: "ESIA Documents", category: "strategic" },
  "SEA Framework Exists": { label: "SEA Framework", category: "strategic" },
  "NEPA EIA Count": { label: "EIA Permits", category: "permitting" },
  "EIA Document Count": { label: "EIA Permits", category: "permitting" },
  "NEPA EIS Count": { label: "EIS Reports", category: "permitting" },
  "EIS Document Count": { label: "EIS Reports", category: "permitting" },
  "NEPA AIA Count": { label: "AIA Reports", category: "permitting" },
  "NEPA SIA Count": { label: "SIA Reports", category: "permitting" },
  "EIA Legally Required": { label: "EIA Required by Law", category: "permitting" },
  "NEPA Regulatory Density Score": { label: "Regulatory Density", category: "data" },
  "Regulatory Density Score": { label: "Regulatory Density", category: "data" },
  "Total Regulatory Documents": { label: "Total Reg. Documents", category: "data" },
  "Primary Assessment Count": { label: "Primary Assessments", category: "strategic" },
  "Compliance Plan Count": { label: "Compliance Plans", category: "permitting" },
};

function getDisplayLabel(datasetType: string): string {
  return ASSESSMENT_LABELS[datasetType]?.label ?? datasetType;
}

function getCategory(datasetType: string): "strategic" | "permitting" | "data" {
  return ASSESSMENT_LABELS[datasetType]?.category ?? "data";
}

export function ProjectBenchmarkPanel({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ProjectBenchmark | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    regionalApi.getProjectBenchmark(projectId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="text-center py-6 text-muted-foreground">Loading benchmarks...</div>;
  if (!data) return null;

  const regionAbove = data.regional.diff !== null && data.regional.diff > 0;
  const sectorAbove = data.sector.diff !== null && data.sector.diff > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Target className="w-5 h-5 mr-2 text-primary" /> Regional & Sector Benchmarking
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Percentile Ranking</div>
          <div className="text-3xl font-mono font-bold text-foreground">Top {100 - data.percentile}%</div>
          <div className="text-sm text-muted-foreground mt-1">{data.percentileLabel}</div>
        </Card>

        <Card className={`p-5 ${regionAbove ? "border-destructive/30" : "border-success/30"}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
            <Globe className="w-3 h-3 mr-1" /> vs Regional Baseline
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-sm text-muted-foreground">Project: </span>
              <span className="text-xl font-mono font-bold text-foreground">{data.project.risk.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Region: </span>
              <span className="text-xl font-mono font-bold text-muted-foreground">{data.regional.avgRisk?.toFixed(1) ?? "N/A"}</span>
            </div>
          </div>
          {data.regional.diffLabel && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${regionAbove ? "text-destructive" : "text-success"}`}>
              {regionAbove ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {data.regional.diffLabel}
            </div>
          )}
        </Card>

        <Card className={`p-5 ${sectorAbove ? "border-destructive/30" : "border-success/30"}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
            <Layers className="w-3 h-3 mr-1" /> vs {data.sector.name} Sector
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-sm text-muted-foreground">Project: </span>
              <span className="text-xl font-mono font-bold text-foreground">{data.project.risk.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Sector: </span>
              <span className="text-xl font-mono font-bold text-muted-foreground">{data.sector.avgRisk?.toFixed(1) ?? "N/A"}</span>
            </div>
          </div>
          {data.sector.diffLabel && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${sectorAbove ? "text-destructive" : "text-success"}`}>
              {sectorAbove ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {data.sector.diffLabel}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">{data.sector.sampleSize} projects in benchmark</div>
        </Card>
      </div>

      {Object.keys(data.regional.datasetAverages).length > 0 && (() => {
        const entries = Object.entries(data.regional.datasetAverages);
        const strategic = entries.filter(([k]) => getCategory(k) === "strategic");
        const permitting = entries.filter(([k]) => getCategory(k) === "permitting");
        const other = entries.filter(([k]) => getCategory(k) === "data");

        const renderGrid = (items: [string, number][]) => (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {items.map(([key, val]) => (
              <div key={key} className="text-center p-3 bg-secondary/30 rounded-lg">
                <div className={`text-lg font-mono font-bold ${val >= 60 ? "text-destructive" : val >= 40 ? "text-warning" : "text-success"}`}>
                  {val.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{getDisplayLabel(key)}</div>
              </div>
            ))}
          </div>
        );

        return (
          <Card className="p-5 space-y-4">
            {strategic.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                  <Shield className="w-3 h-3 mr-1 text-primary" /> Strategic Assessment Intelligence
                </div>
                {renderGrid(strategic)}
              </div>
            )}
            {permitting.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                  <FileCheck className="w-3 h-3 mr-1" /> Permitting & Compliance
                </div>
                {renderGrid(permitting)}
              </div>
            )}
            {other.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                  <BarChart3 className="w-3 h-3 mr-1" /> {data.project.country} Regional Data
                </div>
                {renderGrid(other)}
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
