import { useContext } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, UserPlus, UserX, History, AlertTriangle, Settings } from "lucide-react";
import { AuthContext } from "../lib/auth";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/check-in", label: "Check In", icon: UserPlus, requireAuth: true },
  { path: "/check-out", label: "Check Out", icon: UserX, requireAuth: true },
  { path: "/history", label: "History", icon: History },
  { path: "/maintenance", label: "Maintenance", icon: AlertTriangle, requireAuth: false },
];

export default function Navigation() {
  const [location] = useLocation();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;

  return (
    <nav className="flex space-x-1 mb-4 bg-white p-2 rounded-lg shadow-sm overflow-x-auto">
      {navigationItems.map((item) => {
        const isActive = location === item.path;
        const canAccess = !item.requireAuth || isAuthenticated;
        
        if (!canAccess) return null;
        
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={`flex items-center gap-1 text-xs px-2 py-1 whitespace-nowrap ${
                isActive 
                  ? "bg-orange-600 text-white hover:bg-orange-700" 
                  : "text-gray-700 hover:text-orange-600"
              }`}
            >
              <item.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}