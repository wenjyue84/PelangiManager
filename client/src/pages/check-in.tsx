import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVisibilityQuery } from "@/hooks/useVisibilityQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User, Bed, Phone, Mail, CreditCard, Calendar, Users } from "lucide-react";
import { insertGuestSchema, type InsertGuest, type Capsule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/components/auth-provider";
import GuestTokenGenerator from "@/components/guest-token-generator";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function CheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCheckinConfirmation, setShowCheckinConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<InsertGuest | null>(null);
  
  const { data: availableCapsules = [], isLoading: capsulesLoading } = useVisibilityQuery<Capsule[]>({
    queryKey: ["/api/capsules/available"],
    // Uses smart config: nearRealtime (30s stale, 60s refetch)
  });

  // Get the default collector name
  const getDefaultCollector = React.useCallback(() => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.username) {
      return user.username === "admin" ? "Admin" : user.username;
    }
    return user.email || "";
  }, [user]);

  const form = useForm<InsertGuest>({
    resolver: zodResolver(insertGuestSchema),
    defaultValues: {
      name: "",
      capsuleNumber: "",
      paymentAmount: "0",
      paymentMethod: "cash" as const,
      paymentCollector: "",
      gender: "",
      nationality: "",
      phoneNumber: "",
      email: "",
      idNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      age: "",
      expectedCheckoutDate: "",
    },
  });

  // Set default collector when user is available
  React.useEffect(() => {
    if (user && !form.getValues("paymentCollector")) {
      form.setValue("paymentCollector", getDefaultCollector());
    }
  }, [user, form, getDefaultCollector]);

  const checkinMutation = useMutation({
    mutationFn: async (data: InsertGuest) => {
      const response = await apiRequest("POST", "/api/guests/checkin", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests/checked-in"] });
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capsules/available"] });
      form.reset();
      toast({
        title: "Success",
        description: "Guest checked in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in guest",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGuest) => {
    setFormDataToSubmit(data);
    setShowCheckinConfirmation(true);
  };

  const confirmCheckin = () => {
    if (formDataToSubmit) {
      checkinMutation.mutate(formDataToSubmit);
      setShowCheckinConfirmation(false);
      setFormDataToSubmit(null);
    }
  };

  const handleClear = () => {
    form.reset({
      name: "",
      capsuleNumber: "",
      paymentAmount: "0",
      paymentMethod: "cash" as const,
      paymentCollector: getDefaultCollector(),
      gender: "",
      nationality: "",
      phoneNumber: "",
      email: "",
      idNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      age: "",
      expectedCheckoutDate: "",
    });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateString = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return { timeString, dateString };
  };

  const { timeString, dateString } = getCurrentDateTime();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-hostel-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-hostel-secondary h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-hostel-text">Guest Check-In</CardTitle>
            <p className="text-gray-600 mt-2">Enter guest information to complete check-in process</p>
            <div className="flex justify-center mt-4">
              <GuestTokenGenerator onTokenCreated={() => queryClient.invalidateQueries({ queryKey: ["/api/capsules/available"] })} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center text-sm font-medium text-hostel-text mb-2">
                <User className="mr-2 h-4 w-4" />
                Guest Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter guest full name"
                className="w-full"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-hostel-error text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="capsuleNumber" className="flex items-center text-sm font-medium text-hostel-text mb-2">
                <Bed className="mr-2 h-4 w-4" />
                Capsule Assignment
              </Label>
              <p className="text-xs text-gray-600 mb-2">
                💡 Tip: Even numbers (C2, C4, C6...) are bottom capsules - customers prefer these!
              </p>
              {capsulesLoading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <Select
                  value={form.watch("capsuleNumber")}
                  onValueChange={(value) => form.setValue("capsuleNumber", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select capsule (⭐ = bottom/preferred)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCapsules.length === 0 ? (
                      <SelectItem value="no-capsules" disabled>No capsules available</SelectItem>
                    ) : (
                      // Sort capsules: bottom (even numbers) first, then top (odd numbers)
                      availableCapsules
                        .sort((a, b) => {
                          const aNum = parseInt(a.number.replace('C', ''));
                          const bNum = parseInt(b.number.replace('C', ''));
                          const aIsBottom = aNum % 2 === 0;
                          const bIsBottom = bNum % 2 === 0;
                          
                          // Bottom capsules first
                          if (aIsBottom && !bIsBottom) return -1;
                          if (!aIsBottom && bIsBottom) return 1;
                          
                          // Within same position, sort by number
                          return aNum - bNum;
                        })
                        .map((capsule) => {
                          const capsuleNum = parseInt(capsule.number.replace('C', ''));
                          const isBottom = capsuleNum % 2 === 0;
                          const position = isBottom ? "Bottom" : "Top";
                          const preference = isBottom ? "⭐ Preferred" : "";
                          
                          return (
                            <SelectItem key={capsule.number} value={capsule.number}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {capsule.number} - {position} {preference}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {capsule.section}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                    )}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.capsuleNumber && (
                <p className="text-hostel-error text-sm mt-1">{form.formState.errors.capsuleNumber.message}</p>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-hostel-text mb-3">Payment Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div>
                  <Label htmlFor="paymentAmount" className="text-sm font-medium text-hostel-text">
                    Amount (RM)
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full"
                    {...form.register("paymentAmount")}
                  />
                  {form.formState.errors.paymentAmount && (
                    <p className="text-hostel-error text-sm mt-1">{form.formState.errors.paymentAmount.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-hostel-text">
                    Payment Method
                  </Label>
                  <Select
                    value={form.watch("paymentMethod")}
                    onValueChange={(value) => form.setValue("paymentMethod", value as "cash" | "tng" | "bank" | "platform")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="tng">Touch 'n Go</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="platform">Online Platform</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.paymentMethod && (
                    <p className="text-hostel-error text-sm mt-1">{form.formState.errors.paymentMethod.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="paymentCollector" className="text-sm font-medium text-hostel-text">
                    Payment Collector
                  </Label>
                  <Select
                    value={form.watch("paymentCollector")}
                    onValueChange={(value) => form.setValue("paymentCollector", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment collector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alston">Alston</SelectItem>
                      <SelectItem value="Jay">Jay</SelectItem>
                      <SelectItem value="Le">Le</SelectItem>
                      <SelectItem value="Kakar">Kakar</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.paymentCollector && (
                    <p className="text-hostel-error text-sm mt-1">{form.formState.errors.paymentCollector.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-hostel-text">
                    Phone Number
                  </Label>
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="e.g., +60123456789"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-hostel-text">
                    Email Address
                  </Label>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="guest@example.com"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Identification & Personal Details */}
            <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
              <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Identification & Personal Details
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div>
                  <Label htmlFor="idNumber" className="text-sm font-medium text-hostel-text">
                    ID/Passport Number
                  </Label>
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="idNumber"
                            type="text"
                            placeholder="IC or Passport No."
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="age" className="text-sm font-medium text-hostel-text">
                    Age
                  </Label>
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="age"
                            type="number"
                            min="16"
                            max="120"
                            placeholder="Age"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="nationality" className="text-sm font-medium text-hostel-text">
                    Nationality
                  </Label>
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="nationality"
                            type="text"
                            placeholder="e.g., Malaysian"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="gender" className="text-sm font-medium text-hostel-text">
                    Gender
                  </Label>
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="expectedCheckoutDate" className="text-sm font-medium text-hostel-text flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Expected Checkout Date
                  </Label>
                  <FormField
                    control={form.control}
                    name="expectedCheckoutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="expectedCheckoutDate"
                            type="date"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Emergency Contact (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact" className="text-sm font-medium text-hostel-text">
                    Emergency Contact Name
                  </Label>
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="emergencyContact"
                            type="text"
                            placeholder="Full name of emergency contact"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone" className="text-sm font-medium text-hostel-text">
                    Emergency Contact Phone
                  </Label>
                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="emergencyPhone"
                            type="tel"
                            placeholder="Emergency contact phone number"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-hostel-text mb-3">Additional Notes (Optional)</h3>
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-hostel-text">
                  Special Requirements or Notes
                </Label>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          id="notes"
                          rows={3}
                          placeholder="Any special requirements, allergies, accessibility needs, or additional notes..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hostel-primary focus:ring-hostel-primary sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="text-sm font-medium text-hostel-text mb-3">Check-in Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{dateString}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{timeString}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Staff:</span>
                  <span className="font-medium">Admin User</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hostel-accent bg-opacity-10 text-hostel-accent">
                    Pending Check-in
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit"
                disabled={checkinMutation.isPending || availableCapsules.length === 0}
                className="flex-1 bg-hostel-secondary hover:bg-green-600 text-white font-medium"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {checkinMutation.isPending ? "Processing..." : "Complete Check-In"}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleClear}
                className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>
          </form>
          </Form>
        </CardContent>
      </Card>

      {/* Check-in Confirmation Dialog */}
      {formDataToSubmit && (
        <ConfirmationDialog
          open={showCheckinConfirmation}
          onOpenChange={setShowCheckinConfirmation}
          title="Confirm Guest Check-In"
          description={`Please confirm the check-in details for ${formDataToSubmit.name} in capsule ${formDataToSubmit.capsuleNumber}. Payment: RM ${formDataToSubmit.paymentAmount} via ${formDataToSubmit.paymentMethod}.`}
          confirmText="Confirm Check-In"
          cancelText="Review Details"
          onConfirm={confirmCheckin}
          variant="info"
          icon={<UserPlus className="h-6 w-6 text-blue-600" />}
          isLoading={checkinMutation.isPending}
        />
      )}
    </div>
  );
}
