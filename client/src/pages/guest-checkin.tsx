import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, User, Phone, Mail, Calendar, MapPin, CheckCircle } from "lucide-react";
import { guestSelfCheckinSchema, type GuestSelfCheckin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function GuestCheckin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [capsuleInfo, setCapsuleInfo] = useState<{ capsuleNumber: string; position: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<GuestSelfCheckin>({
    resolver: zodResolver(guestSelfCheckinSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      gender: undefined,
      nationality: "",
      age: "",
      idNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      expectedCheckoutDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (!urlToken) {
      toast({
        title: "Invalid Link",
        description: "This check-in link is invalid or missing a token.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    setToken(urlToken);
    validateToken(urlToken);
  }, [toast, setLocation]);

  const validateToken = async (tokenValue: string) => {
    try {
      const response = await fetch(`/api/guest-tokens/${tokenValue}`);
      if (response.ok) {
        const data = await response.json();
        const capsuleNum = parseInt(data.capsuleNumber.replace('C', ''));
        const position = capsuleNum % 2 === 0 ? 'Bottom (Preferred)' : 'Top';
        
        setCapsuleInfo({
          capsuleNumber: data.capsuleNumber,
          position: position
        });
      } else {
        toast({
          title: "Invalid or Expired Link",
          description: "This check-in link is invalid or has expired.",
          variant: "destructive",
        });
        setLocation('/');
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate check-in link.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: GuestSelfCheckin) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/guest-checkin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Check-in Successful!",
          description: `Welcome to Pelangi Capsule Hostel! You've been assigned to ${capsuleInfo?.capsuleNumber}.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Check-in Failed",
          description: errorData.message || "Failed to complete check-in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit check-in information.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hostel-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Validating check-in link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-hostel-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in Complete!</h2>
              <p className="text-gray-600 mb-4">
                Welcome to Pelangi Capsule Hostel! You've been successfully assigned to capsule {capsuleInfo?.capsuleNumber}.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Your Capsule:</span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {capsuleInfo?.capsuleNumber} - {capsuleInfo?.position}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Please proceed to the front desk to collect your key and complete payment if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hostel-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center pb-6">
            <div>
              <div className="w-16 h-16 bg-hostel-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="text-hostel-secondary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-hostel-text">Welcome to Pelangi Capsule Hostel</CardTitle>
              <p className="text-gray-600 mt-2">Complete your check-in information</p>
              {capsuleInfo && (
                <div className="mt-4 bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center justify-center text-sm font-medium text-orange-800">
                    <MapPin className="h-4 w-4 mr-2" />
                    Your assigned capsule: {capsuleInfo.capsuleNumber} - {capsuleInfo.position}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium text-hostel-text">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full mt-1"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-hostel-text">
                      Gender
                    </Label>
                    <Select
                      value={form.watch("gender") || ""}
                      onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="age" className="text-sm font-medium text-hostel-text">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Age"
                      className="w-full mt-1"
                      {...form.register("age")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality" className="text-sm font-medium text-hostel-text">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      type="text"
                      placeholder="e.g., Malaysian"
                      className="w-full mt-1"
                      {...form.register("nationality")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="idNumber" className="text-sm font-medium text-hostel-text">
                      ID/Passport Number
                    </Label>
                    <Input
                      id="idNumber"
                      type="text"
                      placeholder="IC or Passport Number"
                      className="w-full mt-1"
                      {...form.register("idNumber")}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-hostel-text">
                      Phone Number *
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g., +60123456789"
                      className="w-full mt-1"
                      {...form.register("phoneNumber")}
                    />
                    {form.formState.errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-hostel-text">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="w-full mt-1"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyContact" className="text-sm font-medium text-hostel-text">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyContact"
                      type="text"
                      placeholder="Emergency contact person"
                      className="w-full mt-1"
                      {...form.register("emergencyContact")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyPhone" className="text-sm font-medium text-hostel-text">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="Emergency contact number"
                      className="w-full mt-1"
                      {...form.register("emergencyPhone")}
                    />
                  </div>
                </div>
              </div>

              {/* Stay Information */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Stay Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedCheckoutDate" className="text-sm font-medium text-hostel-text">
                      Expected Checkout Date
                    </Label>
                    <Input
                      id="expectedCheckoutDate"
                      type="date"
                      className="w-full mt-1"
                      {...form.register("expectedCheckoutDate")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-hostel-text">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requests or notes..."
                      className="w-full mt-1"
                      rows={3}
                      {...form.register("notes")}
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-hostel-secondary hover:bg-orange-700 text-white py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing Check-in..." : "Complete Check-in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}