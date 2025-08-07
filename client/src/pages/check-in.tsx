import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User, Bed, MapPin, CreditCard, Users, Smartphone, Link as LinkIcon } from "lucide-react";
import { insertGuestSchema, type InsertGuest, type Capsule, type User as AppUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";

// Comprehensive nationality list with Malaysia and Singapore prioritized
const NATIONALITIES = [
  "Malaysia",
  "Singapore", 
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", 
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", 
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", 
  "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", 
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", 
  "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", 
  "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", 
  "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", 
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", 
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", 
  "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", 
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", 
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", 
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", 
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", 
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Maldives", "Mali", "Malta", "Marshall Islands", 
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", 
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", 
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", 
  "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", 
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", 
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", 
  "Serbia", "Seychelles", "Sierra Leone", "Slovakia", "Slovenia", "Solomon Islands", 
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", 
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", 
  "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", 
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", 
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function CheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: availableCapsules = [], isLoading: capsulesLoading } = useQuery<Capsule[]>({
    queryKey: ["/api/capsules/available"],
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<AppUser[]>({
    queryKey: ["/api/staff"],
  });

  // Sort capsules with even numbers (bottom bunks) first, then odd numbers  
  const sortedCapsules = [...availableCapsules].sort((a, b) => {
    const aNum = parseInt(a.number.split('-')[1]);
    const bNum = parseInt(b.number.split('-')[1]);
    
    const aIsEven = aNum % 2 === 0;
    const bIsEven = bNum % 2 === 0;
    
    if (aIsEven && !bIsEven) return -1;
    if (!aIsEven && bIsEven) return 1;
    return a.number.localeCompare(b.number);
  });

  const form = useForm<InsertGuest>({
    resolver: zodResolver(insertGuestSchema),
    defaultValues: {
      name: "",
      capsuleNumber: "",
      paymentAmount: "0",
      paymentMethod: "cash" as const,
      paymentCollector: user?.username || "",
      gender: "",
      nationality: "Malaysia", // Default to Malaysia
      phoneNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      idNumber: "",
      checkinMethod: "staff" as const,
    },
  });

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
    checkinMutation.mutate(data);
  };

  const handleClear = () => {
    form.reset();
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

  // Generate guest link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async (data: { capsuleNumber: string; expiryHours?: number }) => {
      const response = await apiRequest("POST", "/api/guest-links", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Guest self-check-in link generated for capsule ${form.getValues('capsuleNumber')}`,
      });
      // Copy link to clipboard
      navigator.clipboard.writeText(data.link);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to generate guest link",
        variant: "destructive",
      });
    },
  });

  const handleGenerateGuestLink = () => {
    const capsuleNumber = form.getValues('capsuleNumber');
    if (!capsuleNumber) {
      toast({
        title: "Error",
        description: "Please select a capsule first",
        variant: "destructive",
      });
      return;
    }
    generateLinkMutation.mutate({ capsuleNumber, expiryHours: 24 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Card>
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-hostel-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-hostel-secondary h-8 w-8" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold text-hostel-text">Guest Check-In</CardTitle>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Complete guest information for check-in</p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 md:space-y-6">
              
              {/* Guest Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-hostel-text">
                      <User className="mr-2 h-4 w-4" />
                      Guest Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guest full name" {...field} className="text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Capsule Selection */}
              <FormField
                control={form.control}
                name="capsuleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-hostel-text">
                      <Bed className="mr-2 h-4 w-4" />
                      Capsule Number
                    </FormLabel>
                    <FormControl>
                      {capsulesLoading ? (
                        <Skeleton className="w-full h-12" />
                      ) : (
                        <Select {...field}>
                          <SelectTrigger className="w-full h-12">
                            <SelectValue placeholder="Select available capsule" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedCapsules.length === 0 ? (
                              <SelectItem value="no-capsules" disabled>No capsules available</SelectItem>
                            ) : (
                              sortedCapsules.map((capsule) => {
                                const capsuleNum = parseInt(capsule.number.split('-')[1]);
                                const isBottomBunk = capsuleNum % 2 === 0;
                                return (
                                  <SelectItem key={capsule.number} value={capsule.number}>
                                    <div className="flex items-center">
                                      {isBottomBunk && <span className="mr-2">🛏️</span>}
                                      {capsule.number} ({capsule.section} section)
                                      {isBottomBunk && <span className="ml-2 text-xs text-gray-500">Bottom</span>}
                                    </div>
                                  </SelectItem>
                                )
                              })
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Generate Guest Link Button */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-hostel-text">Guest Self Check-in</h4>
                  <p className="text-xs text-gray-600">Generate a secure link for guest to complete their own check-in</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateGuestLink}
                  disabled={!form.watch('capsuleNumber') || generateLinkMutation.isPending}
                  className="ml-2"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {generateLinkMutation.isPending ? 'Generating...' : 'Generate Link'}
                </Button>
              </div>

              {/* Guest Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-hostel-text">
                        <Smartphone className="mr-2 h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-hostel-text">
                        IC/Passport Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IC/Passport number" {...field} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender and Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-hostel-text">Gender</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-hostel-text">
                        <MapPin className="mr-2 h-4 w-4" />
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48">
                            {NATIONALITIES.map((nationality) => (
                              <SelectItem key={nationality} value={nationality}>
                                {nationality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-hostel-text">
                        Emergency Contact Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency contact name" {...field} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-hostel-text">
                        Emergency Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency phone number" {...field} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Information Section */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="flex items-center text-sm font-medium text-hostel-text">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-hostel-text">
                          Amount (RM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            className="text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-hostel-text">
                          Payment Method
                        </FormLabel>
                        <FormControl>
                          <Select {...field}>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentCollector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium text-hostel-text">
                          <Users className="mr-2 h-4 w-4" />
                          Payment Collector
                        </FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffLoading ? (
                                <SelectItem value="loading" disabled>Loading staff...</SelectItem>
                              ) : staff.length > 0 ? (
                                staff.map((staffMember) => (
                                  <SelectItem key={staffMember.id} value={staffMember.username}>
                                    {staffMember.username}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Alston">Alston</SelectItem>
                                  <SelectItem value="Jay">Jay</SelectItem>
                                  <SelectItem value="Le">Le</SelectItem>
                                  <SelectItem value="Kakar">Kakar</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Check-in Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border space-y-3">
                <h3 className="text-sm font-medium text-hostel-text">Check-in Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{dateString}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">Time</span>
                    <span className="font-medium">{timeString}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">Staff</span>
                    <span className="font-medium">{user?.username || 'Current User'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">Method</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Staff Check-in
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                <Button 
                  type="submit"
                  disabled={checkinMutation.isPending || sortedCapsules.length === 0}
                  className="flex-1 bg-hostel-secondary hover:bg-green-600 text-white font-medium h-12"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {checkinMutation.isPending ? "Processing Check-in..." : "Complete Check-In"}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="md:w-32 border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                >
                  Clear Form
                </Button>
              </div>
          </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
