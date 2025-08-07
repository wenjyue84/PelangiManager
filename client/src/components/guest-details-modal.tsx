import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, MapPin, Phone, Mail, CreditCard, Edit, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Guest } from "@shared/schema";

interface GuestDetailsModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestDetailsModal({ guest, isOpen, onClose }: GuestDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Guest>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateGuestMutation = useMutation({
    mutationFn: async (updates: Partial<Guest>) => {
      if (!guest) return;
      const response = await apiRequest("PATCH", `/api/guests/${guest.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests/checked-in"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guests/history"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Guest information updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest information",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (!guest) return;
    setEditData({
      name: guest.name,
      phoneNumber: guest.phoneNumber || "",
      email: guest.email || "",
      nationality: guest.nationality || "",
      gender: guest.gender || "",
      age: guest.age || "",
      idNumber: guest.idNumber || "",
      emergencyContact: guest.emergencyContact || "",
      emergencyPhone: guest.emergencyPhone || "",
      notes: guest.notes || "",
      paymentMethod: guest.paymentMethod || "cash",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateGuestMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (checkinTime: string): string => {
    const checkin = new Date(checkinTime);
    const now = new Date();
    const diff = now.getTime() - checkin.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  if (!guest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-orange-600" />
              <DialogTitle className="text-lg font-semibold">Guest Details</DialogTitle>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                {guest.capsuleNumber}
              </Badge>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  disabled={updateGuestMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateGuestMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <DialogDescription>
            Viewing and managing guest information for {guest.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium">{guest.name}</div>
                )}
              </div>
              <div>
                <Label>Gender</Label>
                {isEditing ? (
                  <Select 
                    value={editData.gender || ""} 
                    onValueChange={(value) => setEditData({ ...editData, gender: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm capitalize">{guest.gender || "Not specified"}</div>
                )}
              </div>
              <div>
                <Label>Age</Label>
                {isEditing ? (
                  <Input
                    value={editData.age || ""}
                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                    className="mt-1"
                    placeholder="Age"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.age || "Not specified"}</div>
                )}
              </div>
              <div>
                <Label>Nationality</Label>
                {isEditing ? (
                  <Input
                    value={editData.nationality || ""}
                    onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                    className="mt-1"
                    placeholder="Nationality"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.nationality || "Not specified"}</div>
                )}
              </div>
              <div>
                <Label>ID Number</Label>
                {isEditing ? (
                  <Input
                    value={editData.idNumber || ""}
                    onChange={(e) => setEditData({ ...editData, idNumber: e.target.value })}
                    className="mt-1"
                    placeholder="Passport/IC Number"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.idNumber || "Not provided"}</div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                {isEditing ? (
                  <Input
                    value={editData.phoneNumber || ""}
                    onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                    className="mt-1"
                    placeholder="Phone number"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.phoneNumber || "Not provided"}</div>
                )}
              </div>
              <div>
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="mt-1"
                    placeholder="Email address"
                    type="email"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.email || "Not provided"}</div>
                )}
              </div>
              <div>
                <Label>Emergency Contact</Label>
                {isEditing ? (
                  <Input
                    value={editData.emergencyContact || ""}
                    onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                    className="mt-1"
                    placeholder="Emergency contact name"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.emergencyContact || "Not provided"}</div>
                )}
              </div>
              <div>
                <Label>Emergency Phone</Label>
                {isEditing ? (
                  <Input
                    value={editData.emergencyPhone || ""}
                    onChange={(e) => setEditData({ ...editData, emergencyPhone: e.target.value })}
                    className="mt-1"
                    placeholder="Emergency phone number"
                  />
                ) : (
                  <div className="mt-1 text-sm">{guest.emergencyPhone || "Not provided"}</div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Stay Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Stay Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Capsule</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    <MapPin className="h-3 w-3 mr-1" />
                    {guest.capsuleNumber}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Duration</Label>
                <div className="mt-1 text-sm font-medium text-green-600">
                  {formatDuration(guest.checkinTime)}
                </div>
              </div>
              <div>
                <Label>Check-in Time</Label>
                <div className="mt-1 text-sm">{formatDate(guest.checkinTime)}</div>
              </div>
              <div>
                <Label>Expected Checkout</Label>
                <div className="mt-1 text-sm">
                  {guest.expectedCheckoutDate 
                    ? new Date(guest.expectedCheckoutDate.toString()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "Not specified"
                  }
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Amount</Label>
                <div className="mt-1 text-sm font-medium">RM {guest.paymentAmount}</div>
              </div>
              <div>
                <Label>Method</Label>
                {isEditing ? (
                  <Select 
                    value={editData.paymentMethod || ""} 
                    onValueChange={(value) => setEditData({ ...editData, paymentMethod: value as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="tng">Touch 'n Go</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="platform">Platform Booking</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm capitalize">{guest.paymentMethod}</div>
                )}
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={guest.isPaid ? "default" : "destructive"}>
                    {guest.isPaid ? "Paid" : "Outstanding"}
                  </Badge>
                </div>
              </div>
              <div className="md:col-span-3">
                <Label>Collected By</Label>
                <div className="mt-1 text-sm">{guest.paymentCollector || "Not specified"}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(guest.notes || isEditing) && (
            <>
              <Separator />
              <div>
                <Label>Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ""}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="mt-1"
                    placeholder="Additional notes about the guest..."
                    rows={3}
                  />
                ) : (
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {guest.notes || "No notes available"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}