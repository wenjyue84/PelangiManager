import React, { useState, useEffect, useCallback } from "react";
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
import { insertGuestSchema, type InsertGuest, type Capsule, type Guest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/components/auth-provider";
import GuestTokenGenerator from "@/components/guest-token-generator";
import { useAccommodationLabels } from "@/hooks/useAccommodationLabels";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import CheckinConfirmation from "@/components/guest-checkin/CheckinConfirmation";
import { NATIONALITIES } from "@/lib/nationalities";
import { getHolidayLabel, hasPublicHoliday } from "@/lib/holidays";
import {
  getCurrentDateTime,
  getNextDayDate,
  getNextGuestNumber,
  getDefaultCollector,
  getRecommendedCapsule
} from "@/components/check-in/utils";
import PaymentInformationSection from "@/components/check-in/PaymentInformationSection";
import ContactInformationSection from "@/components/check-in/ContactInformationSection";
import IdentificationPersonalSection from "@/components/check-in/IdentificationPersonalSection";
import EmergencyContactSection from "@/components/check-in/EmergencyContactSection";
import AdditionalNotesSection from "@/components/check-in/AdditionalNotesSection";
import CapsuleAssignmentSection from "@/components/check-in/CapsuleAssignmentSection";
import CheckInDetailsSection from "@/components/check-in/CheckInDetailsSection";
import SmartFeaturesSection from "@/components/check-in/SmartFeaturesSection";
import StepProgressIndicator from "@/components/check-in/StepProgressIndicator";

import { SmartPhotoUploader } from "@/components/SmartPhotoUploader";
import { Camera, Upload } from "lucide-react";

export default function CheckIn() {
  const labels = useAccommodationLabels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCheckinConfirmation, setShowCheckinConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<InsertGuest | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [completed, setCompleted] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  
  const { data: availableCapsules = [], isLoading: capsulesLoading } = useVisibilityQuery<Capsule[]>({
    queryKey: ["/api/capsules/available"],
    // Uses smart config: nearRealtime (30s stale, 60s refetch)
  });

  // Get the default collector name
  const defaultCollector = getDefaultCollector(user);

  // Fetch current guest count for auto-incrementing names
  const { data: guestData = { data: [] } } = useVisibilityQuery<{ data: Guest[] }>({
    queryKey: ["/api/guests/checked-in"],
  });

  // Get the next guest number
  const nextGuestNumber = getNextGuestNumber(guestData.data || []);


  const form = useForm<InsertGuest>({
    resolver: zodResolver(insertGuestSchema),
    defaultValues: {
      name: "",
      capsuleNumber: "",
              paymentAmount: "45", // Default to RM45 per night
      paymentMethod: "cash" as const,
      paymentCollector: defaultCollector,
      gender: undefined,
      nationality: "Malaysian",
      phoneNumber: "",
      email: "",
      idNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      age: "",
      checkInDate: new Date().toISOString().split('T')[0], // Default to current date
      expectedCheckoutDate: getNextDayDate(),
    },
  });


  // Set defaults when user is available
  useEffect(() => {
    if (user && !form.getValues("paymentCollector")) {
      form.setValue("paymentCollector", defaultCollector);
    }
    if (!form.getValues("name")) {
      form.setValue("name", nextGuestNumber);
    }
    if (!form.getValues("expectedCheckoutDate")) {
      form.setValue("expectedCheckoutDate", getNextDayDate());
    }
  }, [user, form, defaultCollector, nextGuestNumber]);

  // Auto-assign capsule based on gender
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "gender" && value.gender && availableCapsules.length > 0) {
        // Always suggest a new capsule when gender changes
        const recommendedCapsule = getRecommendedCapsule(value.gender, availableCapsules);
        
        if (recommendedCapsule && recommendedCapsule !== form.getValues("capsuleNumber")) {
          form.setValue("capsuleNumber", recommendedCapsule);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [availableCapsules, form]); // Removed 'form' from dependencies to prevent infinite loop

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
    setCurrentStep(2);
  };

  const confirmCheckin = () => {
    if (formDataToSubmit) {
      setCurrentStep(3);
      const payload: InsertGuest = {
        ...formDataToSubmit,
        ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
      } as InsertGuest;
      checkinMutation.mutate(payload);
      setShowCheckinConfirmation(false);
      setFormDataToSubmit(null);
    }
  };

  const handleClear = () => {
    setShowClearConfirmation(true);
  };

  const confirmClear = () => {
    form.reset({
      name: getNextGuestNumber(guestData.data || []),
      capsuleNumber: "",
              paymentAmount: "45", // Reset to default RM45 per night
      paymentMethod: "cash" as const,
      paymentCollector: getDefaultCollector(user),
      gender: undefined,
      nationality: "Malaysian",
      phoneNumber: "",
      email: "",
      idNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      age: "",
      expectedCheckoutDate: getNextDayDate(),
    });
    setProfilePhotoUrl(""); // Clear profile photo
    setShowClearConfirmation(false);
    toast({
      title: "Form Cleared",
      description: "All fields have been reset to default values",
    });
  };

  // Handle payment amount preset selection
  const handlePaymentPreset = (amount: string) => {
    form.setValue("paymentAmount", amount);
  };

  const { timeString, dateString } = getCurrentDateTime();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-hostel-text">Guest Check-In</CardTitle>
            <p className="text-gray-600 mt-2">Smart check-in with auto-assignment and preset payment options</p>
            <StepProgressIndicator currentStep={currentStep} completed={completed} />
            <div className="flex justify-center mt-4">
              <GuestTokenGenerator onTokenCreated={() => queryClient.invalidateQueries({ queryKey: ["/api/capsules/available"] })} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center text-sm font-medium text-hostel-text mb-2">
                <User className="mr-2 h-4 w-4" />
                Guest Name *
              </Label>
              <div className="space-y-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="Guest name (auto-generated, editable)"
                  className="w-full"
                  {...form.register("name")}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("name", getNextGuestNumber(guestData.data || []))}
                    className="text-xs"
                  >
                    Reset to {nextGuestNumber}
                  </Button>
                </div>
              </div>
              {form.formState.errors.name && (
                <p className="text-hostel-error text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Gender Selection - Moved here for smart capsule assignment */}
            <div>
              <Label htmlFor="gender" className="flex items-center text-sm font-medium text-hostel-text mb-2">
                <Users className="mr-2 h-4 w-4" />
                Gender <span className="text-gray-500 text-xs ml-2">(For smart capsule assignment)</span>
              </Label>
              <Select
                value={form.watch("gender") || ""}
                onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other" | "prefer-not-to-say")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender to enable smart capsule assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male (Front section preferred)</SelectItem>
                  <SelectItem value="female">Female (Back section preferred)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-hostel-error text-sm mt-1">{form.formState.errors.gender.message}</p>
              )}
            </div>

            <CapsuleAssignmentSection 
              form={form} 
              availableCapsules={availableCapsules} 
              capsulesLoading={capsulesLoading} 
            />

            <PaymentInformationSection form={form} defaultCollector={defaultCollector} />

            <ContactInformationSection form={form} />

            <IdentificationPersonalSection 
              form={form} 
              profilePhotoUrl={profilePhotoUrl} 
              setProfilePhotoUrl={setProfilePhotoUrl} 
            />

            <EmergencyContactSection form={form} />

            <AdditionalNotesSection form={form} />

            <CheckInDetailsSection form={form} />

            <div className="flex space-x-4">
              <Button 
                type="submit"
                disabled={checkinMutation.isPending || availableCapsules.length === 0}
                isLoading={checkinMutation.isPending}
                className="flex-1 bg-hostel-secondary hover:bg-green-600 text-white font-medium"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Complete Check-In</span>
                <span className="sm:hidden">Complete</span>
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
          
          <SmartFeaturesSection />
        </CardContent>
      </Card>

      {/* Check-in Confirmation Dialog */}
      {formDataToSubmit && (
        <ConfirmationDialog
          open={showCheckinConfirmation}
          onOpenChange={setShowCheckinConfirmation}
          title="Confirm Guest Check-In"
          description={ <CheckinConfirmation guest={formDataToSubmit} /> }
          confirmText="Confirm Check-In"
          cancelText="Review Details"
          onConfirm={confirmCheckin}
          variant="info"
          icon={<UserPlus className="h-6 w-6 text-blue-600" />}
          isLoading={checkinMutation.isPending}
        />
      )}
      
      {/* Clear Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearConfirmation}
        onOpenChange={setShowClearConfirmation}
        title="Clear Form"
        description="Are you sure you want to clear all fields? This will reset the form to default values."
        confirmText="Yes, Clear Form"
        cancelText="Cancel"
        onConfirm={confirmClear}
        variant="warning"
      />
    </div>
  );
}
