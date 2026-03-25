import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { TrendingUp, TrendingDown, Target, BarChart3, Globe, Layers } from "lucide-react";
import { regionalApi, type ProjectBenchmark } from "@/lib/regional-api";

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

      {Object.keys(data.regional.datasetAverages).length > 0 && (
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" /> {data.project.country} Regional Dataset Averages
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(data.regional.datasetAverages).map(([key, val]) => (
              <div key={key} className="text-center p-3 bg-secondary/30 rounded-lg">
                <div className={`text-lg font-mono font-bold ${val >= 60 ? "text-destructive" : val >= 40 ? "text-warning" : "text-success"}`}>
                  {val.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{key}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
