import { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { LoginForm } from "./login-form";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = false }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}