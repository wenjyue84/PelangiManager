import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    google: any;
  }
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "717199613266-2olcm8aqakh45pceuc6k8c9l295956g9.apps.googleusercontent.com",
          callback: handleGoogleSignIn,
        });

        // Delay rendering to ensure DOM element exists
        setTimeout(() => {
          const element = document.getElementById("google-signin-button");
          if (element) {
            window.google.accounts.id.renderButton(element, { 
              theme: "outline", 
              size: "large", 
              text: "signin_with",
              shape: "rectangular"
            });
          }
        }, 100);
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "🎉 Login Successful!",
        description: "Welcome back! You have been logged in successfully.",
        duration: 5000,
        className: "border-green-500 bg-green-50 text-green-800 shadow-lg text-base font-semibold"
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async (response: any) => {
    setIsLoading(true);
    
    const success = await loginWithGoogle(response.credential);
    
    if (success) {
      toast({
        title: "🎉 Google Login Successful!",
        description: "Welcome! You have been logged in with Google successfully.",
        duration: 5000,
        className: "border-green-500 bg-green-50 text-green-800 shadow-lg text-base font-semibold"
      });
    } else {
      toast({
        title: "Google Login Failed",
        description: "Unable to sign in with Google",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-700">Pelangi Capsule Hostel</CardTitle>
          <CardDescription>Management System Login</CardDescription>
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-600">
            <strong>Demo Login:</strong> admin / admin123
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          
          <div className="my-4 flex items-center">
            <hr className="flex-1 border-gray-300" />
            <span className="px-3 text-sm text-gray-500">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>
          
          <div id="google-signin-button" className="w-full"></div>
          
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Demo Login: admin@pelangi.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}