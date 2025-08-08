import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "./components/auth-provider";
import { ProtectedRoute } from "./components/protected-route";
import { LoginForm } from "./components/login-form";
import { useAuth } from "./lib/auth";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import CheckIn from "./pages/check-in";
import CheckOut from "./pages/check-out";
import History from "./pages/history";
import Settings from "./pages/settings";
import GuestCheckin from "./pages/guest-checkin";
import GuestEdit from "./pages/guest-edit";
import Header from "./components/header";
import Navigation from "./components/navigation";
import { VisibilityIndicator } from "./components/visibility-indicator";

function Router() {
  return (
    <div className="min-h-screen bg-hostel-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Navigation />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/check-in">
            <ProtectedRoute requireAuth={true}>
              <CheckIn />
            </ProtectedRoute>
          </Route>
          <Route path="/check-out">
            <ProtectedRoute requireAuth={true}>
              <CheckOut />
            </ProtectedRoute>
          </Route>
          <Route path="/history" component={History} />
          <Route path="/guest-checkin" component={GuestCheckin} />
          <Route path="/guest-edit" component={GuestEdit} />
          <Route path="/settings">
            <ProtectedRoute requireAuth={true}>
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route path="/login" component={LoginForm} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
          <VisibilityIndicator />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
