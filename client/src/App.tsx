import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import NewBudget from "@/pages/new-budget";
import BudgetDetails from "@/pages/budget-details";
import Budgets from "@/pages/budgets";
import Projects from "@/pages/projects";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AppLayout from "@/components/layouts/AppLayout";
import { BudgetProvider } from "@/contexts/BudgetContext";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatWizard from "@/components/chat/ChatWizard";
import DatasetValidator from "@/components/DatasetValidator";
import { useAuth } from "@/hooks/useAuth";
import { LandingPage } from "@/pages/LandingPage";
import { Navigation } from "@/components/auth/Navigation";
import AdminPage from "@/pages/AdminPage";
import { useState } from "react";

function AuthenticatedApp() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <DatasetValidator />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/new-budget" component={NewBudget} />
          <Route path="/budget/:id" component={BudgetDetails} />
          <Route path="/projects" component={Projects} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin/users" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <ChatInterface />
      <ChatWizard isOpen={isChatOpen} onToggle={handleChatToggle} />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BudgetProvider>
        <Router />
        <Toaster />
      </BudgetProvider>
    </QueryClientProvider>
  );
}

export default App;
