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

// General Settings Tab Component
function GeneralSettingsTab({ settings, isLoading, form, onSubmit, resetToDefault, updateSettingsMutation }: any) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Guest Check-In Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="guestTokenExpirationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Expiration Time</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            placeholder="24"
                            className="max-w-xs"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <span className="text-sm text-gray-500">hours</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        How long guest check-in tokens remain valid after creation.
                        <br />
                        <span className="text-xs text-gray-500">
                          Range: 1-168 hours (1 hour to 7 days)
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetToDefault}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Default (24h)
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Token Validity</p>
                <p className="text-xs text-gray-500">Time before tokens expire</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-blue-600">
                  {settings?.guestTokenExpirationHours || 24}h
                </p>
                <p className="text-xs text-gray-500">
                  {settings?.guestTokenExpirationHours === 24 ? "Default" : "Custom"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Edit Window</p>
                <p className="text-xs text-gray-500">After guest completes check-in</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">1h</p>
                <p className="text-xs text-gray-500">Fixed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Maintenance Tab Component
function MaintenanceTab({ problems, isLoading, queryClient, toast }: any) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CapsuleProblem | null>(null);

  const createProblemForm = useForm({
    defaultValues: {
      capsuleNumber: "",
      description: "",
      reportedBy: "Staff",
    },
  });

  const resolveProblemForm = useForm({
    defaultValues: {
      resolvedBy: "Staff",
      notes: "",
    },
  });

  const createProblemMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/problems", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      setCreateDialogOpen(false);
      createProblemForm.reset();
      toast({
        title: "Problem Reported",
        description: "The capsule problem has been reported successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report problem",
        variant: "destructive",
      });
    },
  });

  const resolveProblemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/problems/${id}/resolve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      setEditDialogOpen(false);
      setSelectedProblem(null);
      resolveProblemForm.reset();
      toast({
        title: "Problem Resolved",
        description: "The problem has been marked as resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve problem",
        variant: "destructive",
      });
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/problems/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      toast({
        title: "Problem Deleted",
        description: "The problem has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete problem",
        variant: "destructive",
      });
    },
  });

  const handleEditProblem = (problem: CapsuleProblem) => {
    setSelectedProblem(problem);
    setEditDialogOpen(true);
  };

  const activeProblem = problems.filter((p: CapsuleProblem) => !p.isResolved);
  const resolvedProblems = problems.filter((p: CapsuleProblem) => p.isResolved);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              Capsule Maintenance
            </CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Report Problem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Capsule Problem</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={createProblemForm.handleSubmit((data) => createProblemMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="capsuleNumber">Capsule Number</Label>
                    <Select
                      value={createProblemForm.watch("capsuleNumber")}
                      onValueChange={(value) => createProblemForm.setValue("capsuleNumber", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select capsule" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A-01", "A-02", "A-03", "A-04", "A-05", "A-06", "A-07", "A-08",
                          "B-01", "B-02", "B-03", "B-04", "B-05", "B-06", "B-07", "B-08",
                          "C-01", "C-02", "C-03", "C-04", "C-05", "C-06", "C-07", "C-08"].map((capsule) => (
                          <SelectItem key={capsule} value={capsule}>
                            {capsule}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Problem Description</Label>
                    <Textarea
                      {...createProblemForm.register("description", { required: true })}
                      placeholder="Describe the problem (e.g., no light, keycard not working, door cannot open...)"
                      className="min-h-20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportedBy">Reported By</Label>
                    <Input {...createProblemForm.register("reportedBy", { required: true })} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProblemMutation.isPending}>
                      {createProblemMutation.isPending ? "Reporting..." : "Report Problem"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Active Problems */}
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4">Active Problems ({activeProblem.length})</h3>
              {activeProblem.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No active problems reported. All capsules are in good condition!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeProblem.map((problem: CapsuleProblem) => (
                    <Card key={problem.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{problem.capsuleNumber}</h4>
                            <Badge variant="destructive">Active Problem</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProblem(problem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteProblemMutation.mutate(problem.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{problem.description}</p>
                        <div className="text-xs text-gray-500">
                          <p>Reported by: {problem.reportedBy}</p>
                          <p>Date: {new Date(problem.reportedAt).toLocaleDateString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved Problems */}
            {resolvedProblems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-4">Recently Resolved ({resolvedProblems.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {resolvedProblems.slice(0, 4).map((problem: CapsuleProblem) => (
                    <Card key={problem.id} className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{problem.capsuleNumber}</h4>
                            <Badge variant="default" className="bg-green-600">Resolved</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{problem.description}</p>
                        <div className="text-xs text-gray-500">
                          <p>Resolved by: {problem.resolvedBy}</p>
                          <p>Date: {problem.resolvedAt ? new Date(problem.resolvedAt).toLocaleDateString() : "N/A"}</p>
                          {problem.notes && <p>Notes: {problem.notes}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolve Problem Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Problem - {selectedProblem?.capsuleNumber}</DialogTitle>
          </DialogHeader>
          {selectedProblem && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-medium">Problem:</p>
                <p className="text-sm text-gray-700">{selectedProblem.description}</p>
              </div>
              <form
                onSubmit={resolveProblemForm.handleSubmit((data) =>
                  resolveProblemMutation.mutate({ id: selectedProblem.id, data })
                )}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="resolvedBy">Resolved By</Label>
                  <Input {...resolveProblemForm.register("resolvedBy", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                  <Textarea
                    {...resolveProblemForm.register("notes")}
                    placeholder="Describe what was done to fix the problem..."
                    className="min-h-20"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setSelectedProblem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={resolveProblemMutation.isPending}>
                    {resolveProblemMutation.isPending ? "Resolving..." : "Mark as Resolved"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, isLoading, queryClient, toast }: any) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const createUserForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "staff",
    },
  });

  const editUserForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema.omit({ password: true })),
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      role: "staff",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      createUserForm.reset();
      toast({
        title: "User Created",
        description: "The user has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUser> }) => {
      await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      editUserForm.reset();
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      email: user.email,
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <Form {...createUserForm}>
                  <form
                    onSubmit={createUserForm.handleSubmit((data) => createUserMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={createUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createUserForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: User) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || "No name"}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.role === "admin" ? "destructive" : "default"}>
                            {user.role}
                          </Badge>
                          {user.username && (
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={user.email === "admin@pelangi.com"} // Protect default admin
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Form {...editUserForm}>
              <form
                onSubmit={editUserForm.handleSubmit((data) =>
                  updateUserMutation.mutate({ id: selectedUser.id, data })
                )}
                className="space-y-4"
              >
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editUserForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editUserForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Messages Tab Component
function MessagesTab({ settings, queryClient, toast }: any) {
  const [isEditing, setIsEditing] = useState(false);

  const messageForm = useForm<SelfCheckinMessageData>({
    resolver: zodResolver(selfCheckinMessageSchema),
    defaultValues: {
      successMessage: settings?.selfCheckinSuccessMessage || "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel.",
    },
  });

  // Update form when settings are loaded
  if (settings && messageForm.getValues().successMessage !== (settings.selfCheckinSuccessMessage || "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel.")) {
    messageForm.reset({
      successMessage: settings.selfCheckinSuccessMessage || "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel.",
    });
  }

  const updateMessageMutation = useMutation({
    mutationFn: async (data: SelfCheckinMessageData) => {
      await apiRequest("PATCH", "/api/settings", {
        selfCheckinSuccessMessage: data.successMessage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsEditing(false);
      toast({
        title: "Message Updated",
        description: "The self check-in success message has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update message",
        variant: "destructive",
      });
    },
  });

  const resetToDefault = () => {
    const defaultMessage = "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel.";
    messageForm.setValue("successMessage", defaultMessage);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Self Check-In Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Success Message</h4>
            <p className="text-sm text-gray-600 mb-4">
              This message is displayed to guests after they successfully complete the self check-in process.
            </p>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">Current Message:</h5>
                  <p className="text-green-700">
                    {settings?.selfCheckinSuccessMessage ||
                      "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel."}
                  </p>
                </div>
                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Message
                </Button>
              </div>
            ) : (
              <Form {...messageForm}>
                <form
                  onSubmit={messageForm.handleSubmit((data) => updateMessageMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={messageForm.control}
                    name="successMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Success Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-32"
                            placeholder="Enter the message guests will see after successful check-in..."
                          />
                        </FormControl>
                        <div className="text-sm text-gray-600">
                          <p>Character count: {field.value?.length || 0}/500</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Keep it friendly and informative. Include any important information about their stay.
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button type="submit" disabled={updateMessageMutation.isPending} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {updateMessageMutation.isPending ? "Saving..." : "Save Message"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetToDefault} className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset to Default
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>

          {/* Preview Section */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Preview</h4>
            <p className="text-sm text-gray-600 mb-4">
              This is how the message will appear to guests:
            </p>
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-3">Check-In Successful!</h3>
                <p className="text-green-700 max-w-md mx-auto">
                  {isEditing
                    ? messageForm.watch("successMessage")
                    : (settings?.selfCheckinSuccessMessage ||
                        "Thank you for checking in! Your capsule is ready. Please keep your belongings secure and enjoy your stay at Pelangi Capsule Hostel.")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}