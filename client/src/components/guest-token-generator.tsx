import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Clock, MapPin, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Capsule } from "@shared/schema";

interface TokenGeneratorProps {
  onTokenCreated?: () => void;
}

export default function GuestTokenGenerator({ onTokenCreated }: TokenGeneratorProps) {
  const [selectedCapsule, setSelectedCapsule] = useState("");
  const [guestName, setGuestName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [generatedToken, setGeneratedToken] = useState<{
    token: string;
    link: string;
    capsuleNumber: string;
    guestName: string;
    expiresAt: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: availableCapsules = [], isLoading: capsulesLoading } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules/available"],
  });

  const createTokenMutation = useMutation({
    mutationFn: async (data: { 
      capsuleNumber?: string; 
      autoAssign?: boolean;
      guestName?: string;
      phoneNumber?: string;
      email?: string;
      expectedCheckoutDate?: string;
      expiresInHours: number 
    }) => {
      const response = await apiRequest("POST", "/api/guest-tokens", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      toast({
        title: "Check-in Link Created",
        description: `Generated self-check-in link for capsule ${data.capsuleNumber}`,
      });
      onTokenCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create check-in link",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCapsule) {
      toast({
        title: "Validation Error",
        description: "Please select a capsule assignment option",
        variant: "destructive",
      });
      return;
    }
    // Name and phone are now optional - guest will fill them during self-check-in

    const isAutoAssign = selectedCapsule === "auto-assign";
    createTokenMutation.mutate({
      capsuleNumber: isAutoAssign ? undefined : selectedCapsule,
      autoAssign: isAutoAssign,
      guestName: guestName.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      expectedCheckoutDate: expectedCheckoutDate || undefined,
      expiresInHours: parseInt(expiresInHours),
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Check-in link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Create Guest Link
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-sm sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Create Guest Check-in Link
          </DialogTitle>
          <DialogDescription>
            Generate a link that guests can use to complete their own check-in process
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="guestName">Guest Name (Optional - guest will fill during check-in)</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Leave empty for guest to fill"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional - guest will fill during check-in)</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Leave empty for guest to fill"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="expectedCheckout">Expected Checkout</Label>
                <Input
                  id="expectedCheckout"
                  type="date"
                  value={expectedCheckoutDate}
                  onChange={(e) => setExpectedCheckoutDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="capsule" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Capsule
              </Label>
              <Select value={selectedCapsule} onValueChange={setSelectedCapsule}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose capsule assignment" />
                </SelectTrigger>
                <SelectContent>
                  {capsulesLoading ? (
                    <SelectItem value="loading" disabled>Loading capsules...</SelectItem>
                  ) : availableCapsules.length === 0 ? (
                    <SelectItem value="no-capsules" disabled>No capsules available</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="auto-assign">
                        <div className="flex items-center gap-2">
                          <span>🤖</span>
                          <span>Auto Assign (Based on Gender)</span>
                        </div>
                      </SelectItem>
                      {availableCapsules
                        .sort((a, b) => {
                          const aNum = parseInt(a.number.replace('C', ''));
                          const bNum = parseInt(b.number.replace('C', ''));
                          const aIsBottom = aNum % 2 === 0;
                          const bIsBottom = bNum % 2 === 0;
                          
                          if (aIsBottom && !bIsBottom) return -1;
                          if (!aIsBottom && bIsBottom) return 1;
                          return aNum - bNum;
                        })
                        .map((capsule) => {
                          const capsuleNum = parseInt(capsule.number.replace('C', ''));
                          const isBottom = capsuleNum % 2 === 0;
                          const position = isBottom ? "Bottom ⭐" : "Top";
                          
                          return (
                            <SelectItem key={capsule.number} value={capsule.number}>
                              {capsule.number} - {position} ({capsule.section})
                            </SelectItem>
                          );
                        })}
                    </>
                  )}
                </SelectContent>
              </Select>
              {selectedCapsule === "auto-assign" && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Auto Assignment:</span> The system will automatically assign the best available capsule based on the guest's gender preference:
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1">
                    <li>• Females: Back section, bottom bunks preferred</li>
                    <li>• Males: Front section, bottom bunks preferred</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="expires" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Link Expires In
              </Label>
              <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours (recommended)</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 sm:h-10 text-sm sm:text-base bg-orange-600 hover:bg-orange-700"
              disabled={createTokenMutation.isPending || !selectedCapsule}
            >
              {createTokenMutation.isPending ? "Generating..." : "Generate Check-in Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {generatedToken.capsuleNumber || "Auto Assign 🤖"}
                </Badge>
                <span className="text-sm text-green-700">Check-in link created!</span>
              </div>
              <div className="text-xs text-green-600">
                Expires: {new Date(generatedToken.expiresAt).toLocaleString()}
              </div>
              {!generatedToken.capsuleNumber && (
                <div className="text-xs text-blue-600 mt-1 font-medium">
                  Capsule will be auto-assigned based on guest's gender
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Guest Check-in Link:</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={generatedToken.link}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedToken.link)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link with the guest. They can use it to complete their check-in information before arrival.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedToken(null);
                  setSelectedCapsule("");
                  setGuestName("");
                  setPhoneNumber("");
                  setEmail("");
                  setExpectedCheckoutDate("");
                  setExpiresInHours("24");
                }}
                className="flex-1"
              >
                Create Another
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}