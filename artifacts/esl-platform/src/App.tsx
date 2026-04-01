import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CapitalModeProvider } from "@/components/capital-mode-context";
import { RoleProvider } from "@/components/role-context";
import { AuthProvider, useAuth } from "@/components/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

import Dashboard from "@/pages/dashboard";
import NewProject from "@/pages/new-project";
import ProjectDetail from "@/pages/project-detail";
import PortfolioManager from "@/pages/portfolio-manager";
import AuthorityDashboard from "@/pages/authority-dashboard";
import PipelineList from "@/pages/pipeline-list";
import PipelineNew from "@/pages/pipeline-new";
import PipelineDetail from "@/pages/pipeline-detail";
import CompliancePage from "@/pages/compliance";
import MethodologyPage from "@/pages/methodology";
import CalibrationPage from "@/pages/calibration";
import OutcomesPage from "@/pages/outcomes";
import DisbursementPage from "@/pages/disbursement";
import OverridesPage from "@/pages/overrides";
import FunderLogicPage from "@/pages/funder-logic";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { isAuthenticated, isLoading, requiresTwoFactor, requiresTotpSetup } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || requiresTwoFactor || requiresTotpSetup) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/new" component={NewProject} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/portfolios" component={PortfolioManager} />
      <Route path="/authority" component={AuthorityDashboard} />
      <Route path="/pipelines" component={PipelineList} />
      <Route path="/pipelines/new" component={PipelineNew} />
      <Route path="/pipelines/:id" component={PipelineDetail} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/methodology" component={MethodologyPage} />
      <Route path="/calibration" component={CalibrationPage} />
      <Route path="/outcomes" component={OutcomesPage} />
      <Route path="/disbursement" component={DisbursementPage} />
      <Route path="/overrides" component={OverridesPage} />
      <Route path="/funder-logic" component={FunderLogicPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <CapitalModeProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <ProtectedRoutes />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </CapitalModeProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
