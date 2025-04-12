import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import NewBudget from "@/pages/new-budget";
import BudgetDetails from "@/pages/budget-details";
import Projects from "@/pages/projects";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AppLayout from "@/components/layouts/AppLayout";
import { BudgetProvider } from "@/contexts/BudgetContext";
import ChatInterface from "@/components/chat/ChatInterface";
import DatasetValidator from "@/components/DatasetValidator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/new-budget" component={NewBudget} />
      <Route path="/budget/:id" component={BudgetDetails} />
      <Route path="/projects" component={Projects} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BudgetProvider>
        <AppLayout>
          <DatasetValidator />
          <Router />
        </AppLayout>
        <ChatInterface />
        <Toaster />
      </BudgetProvider>
    </QueryClientProvider>
  );
}

export default App;
