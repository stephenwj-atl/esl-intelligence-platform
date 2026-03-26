import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CapitalModeProvider } from "@/components/capital-mode-context";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import NewProject from "@/pages/new-project";
import ProjectDetail from "@/pages/project-detail";
import PortfolioManager from "@/pages/portfolio-manager";
import AuthorityDashboard from "@/pages/authority-dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/new" component={NewProject} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/portfolios" component={PortfolioManager} />
      <Route path="/authority" component={AuthorityDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CapitalModeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CapitalModeProvider>
    </QueryClientProvider>
  );
}

export default App;
