import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPortfolios, 
  useListProjects,
  useCreatePortfolio,
  useAddProjectToPortfolio,
  useRemoveProjectFromPortfolio,
  useDeletePortfolio,
  getListPortfoliosQueryKey,
} from "@workspace/api-client-react";
import { 
  Loader2, Plus, Trash2, FolderPlus, ChevronRight,
  Layers, ArrowLeft, DollarSign, AlertTriangle,
  ShieldCheck, Clock
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatCurrency, getRiskColor } from "@/lib/utils";
import { useRole } from "@/components/role-context";

const STAGES = ["Early", "Pre-IC", "Approved", "Post-Close"] as const;

export default function PortfolioManager() {
  const [, setLocation] = useLocation();
  const { permissions } = useRole();
  const queryClient = useQueryClient();
  const { data: portfolios, isLoading: portfoliosLoading } = useListPortfolios();
  const { data: projects } = useListProjects();
  const { mutate: createPortfolio, isPending: isCreating } = useCreatePortfolio();
  const { mutate: addProject } = useAddProjectToPortfolio();
  const { mutate: removeProject } = useRemoveProjectFromPortfolio();
  const { mutate: deletePortfolio } = useDeletePortfolio();
  
  const invalidatePortfolios = () => {
    queryClient.invalidateQueries({ queryKey: getListPortfoliosQueryKey() });
  };
  
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("10");
  const [stage, setStage] = useState<string>("Early");

  if (portfoliosLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
          <h2 className="text-xl font-display font-semibold text-foreground">Loading Portfolios...</h2>
        </div>
      </Layout>
    );
  }

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    createPortfolio({ data: { name: newPortfolioName.trim() } }, {
      onSuccess: () => {
        setNewPortfolioName("");
        setShowCreateForm(false);
        invalidatePortfolios();
      }
    });
  };

  const handleAddProject = (portfolioId: number) => {
    if (!selectedProjectId || !investmentAmount) return;
    addProject({
      id: portfolioId,
      data: {
        projectId: selectedProjectId,
        investmentAmount: parseFloat(investmentAmount),
        stage: stage as any,
      }
    }, {
      onSuccess: () => {
        setAddingToPortfolio(null);
        setSelectedProjectId(null);
        setInvestmentAmount("10");
        setStage("Early");
        invalidatePortfolios();
      }
    });
  };

  const handleRemoveProject = (portfolioId: number, projectId: number) => {
    removeProject({ id: portfolioId, projectId }, {
      onSuccess: () => invalidatePortfolios(),
    });
  };

  const handleDeletePortfolio = (id: number) => {
    if (confirm("Delete this portfolio? Projects will not be affected.")) {
      deletePortfolio({ id }, {
        onSuccess: () => invalidatePortfolios(),
      });
    }
  };

  const getStageColor = (s: string) => {
    switch (s) {
      case "Early": return "outline";
      case "Pre-IC": return "warning";
      case "Approved": return "success";
      case "Post-Close": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-secondary hover:bg-white/10" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Portfolio Manager</h1>
              <p className="text-muted-foreground mt-1">Create and manage investment portfolios with project assignments.</p>
            </div>
          </div>
          {permissions.canDelete && (
            <Button 
              className="group" 
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
          )}
        </div>

        {showCreateForm && (
          <AnimatedContainer>
            <Card className="p-6 border-primary/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                <FolderPlus className="w-5 h-5 mr-2" /> Create New Portfolio
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="e.g. Caribbean Renewable Energy Fund"
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePortfolio()}
                />
                <Button onClick={handleCreatePortfolio} disabled={isCreating || !newPortfolioName.trim()}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {(!portfolios || portfolios.length === 0) ? (
          <AnimatedContainer>
            <Card className="p-12 text-center border-dashed border-2 border-border/50 bg-card/20">
              <Layers className="h-12 w-12 text-primary/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No portfolios yet</h3>
              <p className="text-muted-foreground mb-6">Create a portfolio to organize projects and track investment performance.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <FolderPlus className="w-4 h-4 mr-2" /> Create First Portfolio
              </Button>
            </Card>
          </AnimatedContainer>
        ) : (
          portfolios.map((portfolio) => (
            <AnimatedContainer key={portfolio.id}>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-card/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-display font-bold text-foreground">{portfolio.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center"><Layers className="w-3 h-3 mr-1" /> {portfolio.metrics.projectCount} projects</span>
                        <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1" /> {formatCurrency(portfolio.metrics.totalInvestment)}</span>
                        <span className={`flex items-center font-mono ${getRiskColor(portfolio.metrics.weightedRisk)}`}>
                          <AlertTriangle className="w-3 h-3 mr-1" /> Risk: {portfolio.metrics.weightedRisk.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAddingToPortfolio(addingToPortfolio === portfolio.id ? null : portfolio.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Project
                      </Button>
                      {permissions.canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {addingToPortfolio === portfolio.id && projects && (
                    <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select
                          value={selectedProjectId || ""}
                          onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
                          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select Project</option>
                          {projects
                            .filter(p => !portfolio.projects.some(pp => pp.projectId === p.id))
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Risk: {p.riskScores.overallRisk.toFixed(1)})</option>
                            ))}
                        </select>
                        <input
                          type="number"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          placeholder="Amount ($M)"
                          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          min="0"
                          step="1"
                        />
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value)}
                          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Button onClick={() => handleAddProject(portfolio.id)} disabled={!selectedProjectId}>
                          Add to Portfolio
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {portfolio.projects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                        <tr>
                          <th className="px-6 py-3 font-medium">Project</th>
                          <th className="px-6 py-3 font-medium">Type</th>
                          <th className="px-6 py-3 font-medium text-center">Stage</th>
                          <th className="px-6 py-3 font-medium text-right">Investment</th>
                          <th className="px-6 py-3 font-medium text-right">Risk Score</th>
                          <th className="px-6 py-3 font-medium text-right">Confidence</th>
                          <th className="px-6 py-3 font-medium text-center">Decision</th>
                          <th className="px-6 py-3 font-medium text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {portfolio.projects.map((pp) => {
                          const isProceed = pp.decision === 'PROCEED';
                          const isCondition = pp.decision === 'CONDITION';
                          return (
                            <tr key={pp.id} className="hover:bg-secondary/40 transition-colors group">
                              <td className="px-6 py-3 font-bold text-foreground">
                                <div className="flex items-center cursor-pointer" onClick={() => setLocation(`/project/${pp.projectId}`)}>
                                  <div className={`w-1.5 h-5 rounded-full mr-3 ${isProceed ? 'bg-success' : isCondition ? 'bg-warning' : 'bg-destructive'}`} />
                                  {pp.projectName}
                                  <ChevronRight className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </td>
                              <td className="px-6 py-3"><Badge variant="outline">{pp.projectType}</Badge></td>
                              <td className="px-6 py-3 text-center">
                                <Badge variant={getStageColor(pp.stage) as any}>
                                  <Clock className="w-3 h-3 mr-1" />{pp.stage}
                                </Badge>
                              </td>
                              <td className="px-6 py-3 text-right font-mono">{formatCurrency(pp.investmentAmount)}</td>
                              <td className="px-6 py-3 text-right">
                                <span className={`font-mono font-bold ${getRiskColor(pp.riskScore)}`}>{pp.riskScore.toFixed(1)}</span>
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-muted-foreground">{pp.dataConfidence.toFixed(1)}%</td>
                              <td className="px-6 py-3 text-center">
                                <Badge variant={isProceed ? 'success' : isCondition ? 'warning' : 'destructive'}>{pp.decision}</Badge>
                              </td>
                              <td className="px-6 py-3 text-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                  onClick={() => handleRemoveProject(portfolio.id, pp.projectId)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No projects assigned yet. Click "Add Project" to get started.
                  </div>
                )}
              </Card>
            </AnimatedContainer>
          ))
        )}
      </div>
    </Layout>
  );
}
