import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Users, Key, Database, AlertTriangle } from "lucide-react";
import UserManagement from "../components/user-management";
import Maintenance from "./maintenance";

const settingsSections = [
  {
    id: "users",
    title: "User Management",
    description: "Manage user accounts and permissions",
    icon: Users,
  },
  {
    id: "maintenance",
    title: "Maintenance",
    description: "Manage capsule problems and maintenance issues",
    icon: AlertTriangle,
  },
  {
    id: "security",
    title: "Security Settings",
    description: "Manage authentication and security",
    icon: Key,
  },
  {
    id: "database",
    title: "Database Settings",
    description: "Configure database and storage",
    icon: Database,
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string>("users");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "users":
        return <UserManagement />;
      case "maintenance":
        return <Maintenance />;
      case "security":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Security settings coming soon...</p>
            </CardContent>
          </Card>
        );
      case "database":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Database configuration coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hostel-text flex items-center">
            <SettingsIcon className="mr-2 h-6 w-6" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your hostel system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {settingsSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  className={`w-full justify-start text-left h-auto p-3 ${
                    activeSection === section.id 
                      ? "bg-orange-600 text-white hover:bg-orange-700" 
                      : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{section.title}</div>
                    <div className="text-xs opacity-70">{section.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}