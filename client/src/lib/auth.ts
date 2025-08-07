import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Re-export User type for other components
export type { User };

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }

  // Fallback hook for when not using AuthProvider
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login: async (username: string, password: string) => {
      // Implement login logic
    },
    logout: () => {
      // Implement logout logic
    },
  };
}

// Token storage functions for auth components
export function getStoredToken(): string | null {
  return localStorage.getItem("authToken");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function removeStoredToken(): void {
  localStorage.removeItem("authToken");
}