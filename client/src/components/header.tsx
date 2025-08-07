import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function Header() {
  // Initialize as null - authentication will be added later
  const user = null;
  const logout = () => {};
  const isAuthenticated = false;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-700">Pelangi Capsule Hostel</h1>
          <p className="text-sm text-gray-600">Management System - Johor Bahru</p>
        </div>
        
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{user.username}</span>
              <span className="text-gray-500 capitalize">({user.role})</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}