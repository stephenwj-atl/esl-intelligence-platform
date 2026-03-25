import { Link } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Plus, ArrowRight, Activity, AlertTriangle, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, AnimatedContainer } from "@/components/ui";
import { formatPercent } from "@/lib/utils";

export default function Dashboard() {
  const { data: projects, isLoading, isError } = useListProjects();

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Intelligence Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time environmental risk assessments and investment signals.</p>
        </div>
        <Link href="/new">
          <Button className="group">
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
            New Assessment
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading intelligence data...</p>
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Failed to load data</h3>
          <p className="text-muted-foreground mt-2">There was an error communicating with the intelligence engine.</p>
        </Card>
      ) : !projects || projects.length === 0 ? (
        <AnimatedContainer>
          <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-border/50 bg-card/20">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Activity className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No active assessments</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start by creating a new environmental risk assessment to generate actionable investment intelligence.
            </p>
            <Link href="/new">
              <Button variant="outline">Create First Assessment</Button>
            </Link>
          </Card>
        </AnimatedContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => {
            const { decision, riskScores, id, name, projectType, country } = project;
            const isProceed = decision.outcome === 'PROCEED';
            const isCondition = decision.outcome === 'CONDITION';
            
            return (
              <AnimatedContainer key={id} delay={i * 0.1}>
                <Card className="flex flex-col h-full hover:border-primary/30 transition-all duration-300 group">
                  <div className="p-5 border-b border-white/5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant={isProceed ? 'success' : isCondition ? 'warning' : 'destructive'}>
                        {decision.outcome}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-secondary rounded-md">
                        {projectType}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-6">
                      <MapPin className="h-3 w-3 mr-1" /> {country}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-muted-foreground mb-1">Risk Score</div>
                        <div className="text-2xl font-display font-semibold flex items-baseline">
                          {riskScores.overallRisk.toFixed(1)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">/10</span>
                        </div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                        <div className="text-2xl font-display font-semibold text-foreground/80">
                          {formatPercent(riskScores.dataConfidence)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-secondary/20 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      {isProceed ? (
                        <><ShieldCheck className="h-4 w-4 text-success mr-2" /> Cleared for investment</>
                      ) : isCondition ? (
                        <><AlertTriangle className="h-4 w-4 text-warning mr-2" /> Requires mitigation</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4 text-destructive mr-2" /> High risk exposure</>
                      )}
                    </div>
                    <Link href={`/project/${id}`}>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full bg-background border border-white/5 hover:bg-primary hover:text-primary-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </AnimatedContainer>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
