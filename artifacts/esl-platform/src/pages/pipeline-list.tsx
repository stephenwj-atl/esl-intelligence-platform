import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { FileStack, Plus, ArrowRight, Loader2, Trash2, ChevronRight } from "lucide-react";
import { useRole } from "@/components/role-context";

const BASE = "/api";

interface Pipeline {
  id: number;
  name: string;
  description: string | null;
  orgType: string;
  capitalModeDefault: string;
  status: string;
  projectCount: number;
  frameworks: string[];
  createdAt: string;
}

export default function PipelineList() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const { permissions } = useRole();

  useEffect(() => {
    fetch(`${BASE}/pipelines`)
      .then(r => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then(setPipelines)
      .catch(() => setPipelines([]))
      .finally(() => setLoading(false));
  }, []);

  const deletePipeline = async (id: number) => {
    const res = await fetch(`${BASE}/pipelines/${id}`, { method: "DELETE" });
    if (res.ok) setPipelines(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Layout>
      <AnimatedContainer>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <FileStack className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Assessment Pipelines</h1>
              <p className="text-sm text-muted-foreground">Batch screening for competitive grant calls, loan books, and pipeline intake</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {permissions.canCreate && (
              <Link href="/new">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Single Project
                </Button>
              </Link>
            )}
            {permissions.canManagePipelines && (
              <Link href="/pipelines/new">
                <Button>
                  <Plus className="w-4 h-4 mr-1" /> New Pipeline
                </Button>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : pipelines.length === 0 ? (
          <Card className="border-border/40 p-12 text-center">
            <FileStack className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">No Pipelines Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create an assessment pipeline to batch-screen proposals against your compliance frameworks and risk thresholds.
            </p>
            <Link href="/pipelines/new">
              <Button>
                <Plus className="w-4 h-4 mr-1" /> Create First Pipeline
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {pipelines.map(p => (
              <Link key={p.id} href={`/pipelines/${p.id}`}>
                <Card className="border-border/40 p-5 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-display font-bold text-foreground">{p.name}</span>
                        <Badge variant="outline" className="text-[10px]">{p.orgType}</Badge>
                        <Badge variant="outline" className="text-[10px]">{p.capitalModeDefault}</Badge>
                        <Badge variant={p.status === "screened" ? "success" : "outline"} className="text-[10px]">{p.status}</Badge>
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{p.projectCount} projects</span>
                        <span>{(p.frameworks as string[]).length} frameworks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.canDelete && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deletePipeline(p.id); }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </AnimatedContainer>
    </Layout>
  );
}
