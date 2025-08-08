import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Clock, Save, RotateCcw, Wrench, Users, MessageSquare, Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/lib/auth";
import { updateSettingsSchema, type UpdateSettings, type CapsuleProblem, type User, type InsertUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Schema for self check-in message settings
const selfCheckinMessageSchema = z.object({
  successMessage: z.string().min(10, "Message must be at least 10 characters").max(500, "Message must not exceed 500 characters"),
});

type SelfCheckinMessageData = z.infer<typeof selfCheckinMessageSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const [activeTab, setActiveTab] = useState("general");

  // General settings queries
  const { data: settings, isLoading } = useQuery<{ guestTokenExpirationHours: number; selfCheckinSuccessMessage?: string }>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  // Capsule problems queries
  const { data: problems = [], isLoading: problemsLoading } = useQuery<CapsuleProblem[]>({
    queryKey: ["/api/problems"],
    enabled: isAuthenticated && activeTab === "maintenance",
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
    },
  });

  // Update form when settings are loaded
  if (settings && form.getValues().guestTokenExpirationHours !== settings.guestTokenExpirationHours) {
    form.reset({ guestTokenExpirationHours: settings.guestTokenExpirationHours });
  }

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
    updateSettingsMutation.mutate(data);
  };

  const resetToDefault = () => {
    form.setValue("guestTokenExpirationHours", 24);
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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
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

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceTab
            problems={problems}
            isLoading={problemsLoading}
            queryClient={queryClient}
            toast={toast}
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

        <TabsContent value="messages" className="space-y-6">
          <MessagesTab
            settings={settings}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}