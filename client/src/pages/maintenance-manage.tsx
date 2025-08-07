import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, CheckCircle, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Capsule } from "@shared/schema";

export default function MaintenanceManage() {
  const [selectedCapsule, setSelectedCapsule] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: capsules = [], isLoading } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules"],
  });

  const addProblemMutation = useMutation({
    mutationFn: async ({ capsuleNumber, description }: { capsuleNumber: string; description: string }) => {
      const response = await apiRequest("POST", `/api/capsules/${capsuleNumber}/problem`, {
        problemDescription: description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capsules"] });
      setSelectedCapsule("");
      setProblemDescription("");
      toast({
        title: "Success",
        description: "Problem reported successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to report problem",
        variant: "destructive",
      });
    },
  });

  const removeProblemMutation = useMutation({
    mutationFn: async (capsuleNumber: string) => {
      const response = await apiRequest("DELETE", `/api/capsules/${capsuleNumber}/problem`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capsules"] });
      toast({
        title: "Success",
        description: "Problem resolved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve problem",
        variant: "destructive",
      });
    },
  });

  const handleAddProblem = () => {
    if (!selectedCapsule || !problemDescription.trim()) {
      toast({
        title: "Error",
        description: "Please select a capsule and enter a problem description",
        variant: "destructive",
      });
      return;
    }
    addProblemMutation.mutate({ capsuleNumber: selectedCapsule, description: problemDescription.trim() });
  };

  const handleRemoveProblem = (capsuleNumber: string) => {
    removeProblemMutation.mutate(capsuleNumber);
  };

  const problemCapsules = capsules.filter(c => c.problemDescription);
  const workingCapsules = capsules.filter(c => !c.problemDescription);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hostel-text">Maintenance Management</h1>
          <p className="text-gray-600">Add and resolve capsule maintenance issues</p>
        </div>
      </div>

      {/* Add Problem Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-hostel-text flex items-center">
            <Plus className="mr-2 h-5 w-5 text-red-500" />
            Report New Problem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capsule-select">Select Capsule</Label>
              <Select value={selectedCapsule} onValueChange={setSelectedCapsule}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a capsule" />
                </SelectTrigger>
                <SelectContent>
                  {workingCapsules.map((capsule) => (
                    <SelectItem key={capsule.number} value={capsule.number}>
                      {capsule.number} ({capsule.section} section)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:flex md:items-end">
              <Button
                onClick={handleAddProblem}
                disabled={addProblemMutation.isPending || !selectedCapsule || !problemDescription.trim()}
                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addProblemMutation.isPending ? "Adding..." : "Report Problem"}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="problem-description">Problem Description</Label>
            <Textarea
              id="problem-description"
              placeholder="Describe the maintenance issue..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Problem Capsules</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{problemCapsules.length}</div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Capsules requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Working Capsules</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{workingCapsules.length}</div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Capsules in good condition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Capsules</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{capsules.length}</div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              All capsules managed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Problem Capsules */}
      {problemCapsules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-hostel-text flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Capsules Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {problemCapsules.map((capsule) => (
                <div key={capsule.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-red-600 text-white border-red-600 mr-2">
                        {capsule.number}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">{capsule.section} section</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveProblem(capsule.number)}
                      disabled={removeProblemMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{capsule.problemDescription}</p>
                  {capsule.problemReportedAt && (
                    <p className="text-xs text-gray-500">
                      Reported: {new Date(capsule.problemReportedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Capsules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-hostel-text flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Working Capsules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workingCapsules.map((capsule) => (
              <div key={capsule.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-green-600 text-white border-green-600 mr-2">
                      {capsule.number}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{capsule.section}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">OK</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}