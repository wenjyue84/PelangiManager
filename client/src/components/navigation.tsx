import { useContext } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, UserPlus, UserX, History, AlertTriangle, Settings } from "lucide-react";
import { AuthContext } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: Home, showOccupancy: true },
  { path: "/check-in", label: "Check In", icon: UserPlus, requireAuth: true },
  { path: "/check-out", label: "Check Out", icon: UserX, requireAuth: true },
  { path: "/history", label: "History", icon: History },
  { path: "/maintenance", label: "Maintenance", icon: AlertTriangle, requireAuth: true },
  { path: "/settings", label: "Settings", icon: Settings, requireAuth: true },
];

export default function Navigation() {
  const [location] = useLocation();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const user = authContext?.user;

  const { data: occupancy } = useQuery<{total: number; available: number}>({
    queryKey: ["/api/occupancy"],
  });

  return (
    <nav className="flex space-x-1 mb-4 bg-white p-2 rounded-lg shadow-sm overflow-x-auto">
      {navigationItems.map((item) => {
        const isActive = location === item.path;
        const canAccess = !item.requireAuth || isAuthenticated;
        
        // Always show all navigation items but handle auth differently
        
        return (
          <Link key={item.path} href={canAccess ? item.path : "/login"}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              disabled={!canAccess}
              className={`flex items-center gap-1 text-xs px-2 py-1 whitespace-nowrap ${
                isActive 
                  ? "bg-orange-600 text-white hover:bg-orange-700" 
                  : canAccess 
                    ? "text-gray-700 hover:text-orange-600" 
                    : "text-gray-400"
              }`}
              title={!canAccess ? "Login required" : ""}
            >
              <item.icon className="h-3 w-3" />
              <span className="hidden sm:inline">
                {item.label}
                {item.showOccupancy && occupancy && (
                  <span className="ml-1 text-xs opacity-75">
                    ({occupancy.available}/{occupancy.total})
                  </span>
                )}
              </span>
            </Button>
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-2">
        {isAuthenticated && user ? (
          <>
            <span className="text-xs text-gray-600 hidden sm:inline">
              Welcome, {user.firstName || user.email}
            </span>
            <Button 
              onClick={authContext?.logout} 
              variant="outline" 
              size="sm"
              className="text-xs px-2 py-1"
            >
              Logout
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-2 py-1"
            >
              Login
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}