import { Link, useLocation } from "wouter";
import { Home, UserPlus, UserMinus, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    path: "/check-in",
    label: "Check In",
    icon: UserPlus,
  },
  {
    path: "/check-out",
    label: "Check Out",
    icon: UserMinus,
  },
  {
    path: "/history",
    label: "History",
    icon: History,
  },
];

export default function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="mb-8">
      <div className="border-b border-gray-200">
        <ul className="flex -mb-px" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
            
            return (
              <li key={item.path} className="mr-2">
                <Link href={item.path}>
                  <button 
                    className={cn(
                      "inline-block py-3 px-6 text-sm font-medium text-center border-b-2 rounded-t-lg transition-colors",
                      isActive 
                        ? "text-hostel-primary border-hostel-primary" 
                        : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <Icon className="inline-block mr-2 h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}