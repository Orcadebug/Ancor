import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DeploymentWizard from "@/pages/deployment-wizard";
import DocumentLibrary from "@/pages/document-library";
import WorkflowBuilder from "@/pages/workflow-builder";
import SystemMonitor from "@/pages/system-monitor";
import UserManagement from "@/pages/user-management";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AuthCallback from "@/pages/auth-callback";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/auth/callback" component={AuthCallback} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/deployment-wizard">
        <ProtectedRoute>
          <DeploymentWizard />
        </ProtectedRoute>
      </Route>
      <Route path="/document-library">
        <ProtectedRoute>
          <DocumentLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/workflow-builder">
        <ProtectedRoute>
          <WorkflowBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/system-monitor">
        <ProtectedRoute>
          <SystemMonitor />
        </ProtectedRoute>
      </Route>
      <Route path="/user-management">
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth when app starts
    console.log('App: Initializing auth on app start...');
    initialize().catch(error => {
      console.error('App: Auth initialization failed:', error);
    });
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
