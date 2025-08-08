import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clock, CheckCircle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Capsule } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MarkCleanedDialogProps {
  capsule: Capsule;
  onSuccess: () => void;
}

function MarkCleanedDialog({ capsule, onSuccess }: MarkCleanedDialogProps) {
  const [cleanedBy, setCleanedBy] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { capsuleNumber: string; cleanedBy: string }) => {
      await apiRequest(`/api/capsules/${data.capsuleNumber}/mark-cleaned`, {
        method: "POST",
        body: JSON.stringify({ cleanedBy: data.cleanedBy }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Capsule ${capsule.number} marked as cleaned successfully`,
      });
      setOpen(false);
      setCleanedBy("");
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark capsule as cleaned",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanedBy.trim()) {
      toast({
        title: "Error",
        description: "Please enter the cleaner's name",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({
      capsuleNumber: capsule.number,
      cleanedBy: cleanedBy.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <Sparkles className="h-4 w-4 mr-1" />
          Mark Cleaned
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Capsule {capsule.number} as Cleaned</DialogTitle>
          <DialogDescription>
            Please enter the name of the person who cleaned this capsule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cleanedBy">Cleaned By</Label>
              <Input
                id="cleanedBy"
                value={cleanedBy}
                onChange={(e) => setCleanedBy(e.target.value)}
                placeholder="Enter cleaner's name"
                disabled={mutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !cleanedBy.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {mutation.isPending ? "Marking..." : "Mark as Cleaned"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CapsuleCleaningCardProps {
  capsule: Capsule;
  onRefresh: () => void;
}

function CapsuleCleaningCard({ capsule, onRefresh }: CapsuleCleaningCardProps) {
  const isClean = capsule.cleaningStatus === "cleaned";
  
  return (
    <Card className={`${isClean ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{capsule.number}</h3>
            <Badge 
              variant={isClean ? "default" : "secondary"}
              className={isClean ? "bg-green-600 text-white" : "bg-orange-500 text-white"}
            >
              {isClean ? "Clean" : "Needs Cleaning"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {capsule.section}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {isClean && capsule.lastCleanedAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Cleaned {new Date(capsule.lastCleanedAt).toLocaleDateString()}</span>
            </div>
          )}
          
          {isClean && capsule.lastCleanedBy && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <User className="h-4 w-4" />
              <span>By {capsule.lastCleanedBy}</span>
            </div>
          )}
          
          {!isClean && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>Requires cleaning after guest checkout</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Status: {capsule.isAvailable ? "Available" : "Occupied"}
          </div>
          
          {!isClean && (
            <MarkCleanedDialog capsule={capsule} onSuccess={onRefresh} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CapsuleCleaningStatus() {
  const queryClient = useQueryClient();
  
  const { data: capsulesToClean = [], isLoading: loadingToClean, refetch: refetchToClean } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules/cleaning-status/to_be_cleaned"],
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: true, // Ensure query is enabled
  });

  const { data: cleanedCapsules = [], isLoading: loadingCleaned, refetch: refetchCleaned } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules/cleaning-status/cleaned"],
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: true, // Ensure query is enabled
  });

  const handleRefresh = async () => {
    // Explicitly refetch both queries
    await Promise.all([
      refetchToClean(),
      refetchCleaned(),
      queryClient.invalidateQueries({ queryKey: ["/api/capsules/cleaning-status/to_be_cleaned"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/capsules/cleaning-status/cleaned"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/capsules"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy"] }),
    ]);
  };

  if (loadingToClean || loadingCleaned) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Capsule Cleaning Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading cleaning status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Capsule Cleaning Status
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Track and manage capsule cleaning after guest checkout
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capsules needing cleaning */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-lg">Needs Cleaning ({capsulesToClean.length})</h3>
          </div>
          
          {capsulesToClean.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All capsules are clean! Great work!</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {capsulesToClean.map((capsule) => (
                <CapsuleCleaningCard
                  key={capsule.id}
                  capsule={capsule}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Recently cleaned capsules */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-lg">Recently Cleaned ({cleanedCapsules.length})</h3>
          </div>
          
          {cleanedCapsules.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No recently cleaned capsules</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cleanedCapsules
                .sort((a, b) => {
                  if (!a.lastCleanedAt || !b.lastCleanedAt) return 0;
                  return new Date(b.lastCleanedAt).getTime() - new Date(a.lastCleanedAt).getTime();
                })
                .slice(0, 6) // Show only recent 6 cleaned capsules
                .map((capsule) => (
                  <CapsuleCleaningCard
                    key={capsule.id}
                    capsule={capsule}
                    onRefresh={handleRefresh}
                  />
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}