import { createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role: 'admin' | 'staff';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (googleToken: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Token storage functions
export const getStoredToken = () => localStorage.getItem('auth_token');
export const setStoredToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeStoredToken = () => localStorage.removeItem('auth_token');

// API helper with authentication
export const authenticatedFetch = (url: string, options: RequestInit = {}) => {
  const token = getStoredToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
};