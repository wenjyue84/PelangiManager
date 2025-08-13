import { useState, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Clock, Save, RotateCcw, Wrench, Users, MessageSquare, Plus, Trash2, Edit, Building, Cog, UserCheck, BookOpen, TestTube, Eye, MapPin, Camera, Globe, Video, Smartphone, Monitor, Wifi, Printer, Send, FileText, CheckCircle } from "lucide-react";
import MaintenanceTab from "../components/settings/MaintenanceTab";
import UsersTab from "../components/settings/UsersTab";
import CapsulesTab from "../components/settings/CapsulesTab";
import MessagesTab from "../components/settings/MessagesTab";
import GeneralSettingsTab from "../components/settings/GeneralSettingsTab";
import TestsTab from "../components/settings/TestsTab";
import GuestGuideTab from "../components/settings/GuestGuideTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelect } from "@/components/ui/time-select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAccommodationLabels } from "@/hooks/useAccommodationLabels";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/lib/auth";
import { updateSettingsSchema, type UpdateSettings, type CapsuleProblem, type User, type InsertUser, insertUserSchema, type PaginatedResponse, type Capsule, insertCapsuleSchema, updateCapsuleSchema } from "@shared/schema";
import { z } from "zod";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const [activeTab, setActiveTab] = useState("general");
  const labels = useAccommodationLabels();

  // General settings queries
  const { data: settings, isLoading } = useQuery<{ guestTokenExpirationHours: number; accommodationType?: string; selfCheckinSuccessMessage?: string }>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  // Capsule problems queries
  const { data: problemsResponse, isLoading: problemsLoading } = useQuery<PaginatedResponse<CapsuleProblem>>({
    queryKey: ["/api/problems"],
    enabled: isAuthenticated && activeTab === "maintenance",
  });
  
  const problems = problemsResponse?.data || [];

  // Capsules query for dropdown and capsules management
  const { data: capsules = [] } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules"],
    enabled: isAuthenticated && (activeTab === "maintenance" || activeTab === "capsules"),
  });

  // Users queries
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && activeTab === "users",
  });

  const form = useForm<UpdateSettings>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      guestTokenExpirationHours: settings?.guestTokenExpirationHours || 24,
      accommodationType: (settings as any)?.accommodationType || "capsule",
    },
  });

  // Update form when settings are loaded - use useEffect instead of if statement
  useEffect(() => {
    if (settings && (
      form.getValues().guestTokenExpirationHours !== settings.guestTokenExpirationHours ||
      (form.getValues() as any).accommodationType !== (settings as any).accommodationType
    )) {
      form.reset({
        guestTokenExpirationHours: settings.guestTokenExpirationHours,
        accommodationType: (settings as any).accommodationType || "capsule",
      } as any);
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateSettings) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateSettings) => {
    // Remove empty optional URL fields to avoid triggering URL validation
    const cleaned: any = { ...data };
    [
      'guideHostelPhotosUrl',
      'guideGoogleMapsUrl',
      'guideCheckinVideoUrl',
    ].forEach((k) => {
      const v = (cleaned as any)[k];
      if (typeof v === 'string' && v.trim() === '') {
        delete (cleaned as any)[k];
      }
    });
    updateSettingsMutation.mutate(cleaned);
  };

  const resetToDefault = () => {
    form.setValue("guestTokenExpirationHours", 24);
    (form as any).setValue?.("accommodationType", "capsule");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the settings.</p>
          <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100">
              <Cog className="h-3 w-3 text-blue-600" />
            </div>
            General
          </TabsTrigger>
          <TabsTrigger value="capsules" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-100">
              <Building className="h-3 w-3 text-purple-600" />
            </div>
            {labels.plural}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-100">
              <Wrench className="h-3 w-3 text-orange-600" />
            </div>
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100">
              <UserCheck className="h-3 w-3 text-green-600" />
            </div>
            Users
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100">
              <BookOpen className="h-3 w-3 text-indigo-600" />
            </div>
            Guest Guide
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-pink-100">
              <TestTube className="h-3 w-3 text-pink-600" />
            </div>
            Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettingsTab
            settings={settings}
            isLoading={isLoading}
            form={form}
            onSubmit={onSubmit}
            resetToDefault={resetToDefault}
            updateSettingsMutation={updateSettingsMutation}
          />
        </TabsContent>

        <TabsContent value="capsules" className="space-y-6">
          <CapsulesTab
            capsules={capsules}
            queryClient={queryClient}
            toast={toast}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceTab
            problems={problems}
            capsules={capsules}
            isLoading={problemsLoading}
            queryClient={queryClient}
            toast={toast}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTab
            users={users}
            isLoading={usersLoading}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <GuestGuideTab 
            settings={settings} 
            form={form} 
            updateSettingsMutation={updateSettingsMutation}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>


        <TabsContent value="tests" className="space-y-6">
          <TestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}