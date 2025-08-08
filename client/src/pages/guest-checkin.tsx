import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, User, Phone, Mail, Calendar, MapPin, CheckCircle, Upload, Camera, Globe, Video, CreditCard, Users, Banknote, DollarSign } from "lucide-react";
import { guestSelfCheckinSchema, type GuestSelfCheckin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import qrCodeImage from "@assets/WhatsApp Image 2025-08-08 at 19.49.44_5bbbcb18_1754653834112.jpg";

// Comprehensive nationality list
const NATIONALITIES = [
  { value: "Malaysian", label: "Malaysian" },
  { value: "Singaporean", label: "Singaporean" },
  // Alphabetical order for the rest
  { value: "Afghan", label: "Afghan" },
  { value: "Albanian", label: "Albanian" },
  { value: "Algerian", label: "Algerian" },
  { value: "American", label: "American" },
  { value: "Andorran", label: "Andorran" },
  { value: "Angolan", label: "Angolan" },
  { value: "Argentine", label: "Argentine" },
  { value: "Armenian", label: "Armenian" },
  { value: "Australian", label: "Australian" },
  { value: "Austrian", label: "Austrian" },
  { value: "Azerbaijani", label: "Azerbaijani" },
  { value: "Bahamian", label: "Bahamian" },
  { value: "Bahraini", label: "Bahraini" },
  { value: "Bangladeshi", label: "Bangladeshi" },
  { value: "Barbadian", label: "Barbadian" },
  { value: "Belarusian", label: "Belarusian" },
  { value: "Belgian", label: "Belgian" },
  { value: "Belizean", label: "Belizean" },
  { value: "Beninese", label: "Beninese" },
  { value: "Bhutanese", label: "Bhutanese" },
  { value: "Bolivian", label: "Bolivian" },
  { value: "Bosnian", label: "Bosnian" },
  { value: "Botswanan", label: "Botswanan" },
  { value: "Brazilian", label: "Brazilian" },
  { value: "British", label: "British" },
  { value: "Bruneian", label: "Bruneian" },
  { value: "Bulgarian", label: "Bulgarian" },
  { value: "Burkinabe", label: "Burkinabe" },
  { value: "Burmese", label: "Burmese" },
  { value: "Burundian", label: "Burundian" },
  { value: "Cambodian", label: "Cambodian" },
  { value: "Cameroonian", label: "Cameroonian" },
  { value: "Canadian", label: "Canadian" },
  { value: "Cape Verdean", label: "Cape Verdean" },
  { value: "Central African", label: "Central African" },
  { value: "Chadian", label: "Chadian" },
  { value: "Chilean", label: "Chilean" },
  { value: "Chinese", label: "Chinese" },
  { value: "Colombian", label: "Colombian" },
  { value: "Comoran", label: "Comoran" },
  { value: "Congolese", label: "Congolese" },
  { value: "Costa Rican", label: "Costa Rican" },
  { value: "Croatian", label: "Croatian" },
  { value: "Cuban", label: "Cuban" },
  { value: "Cypriot", label: "Cypriot" },
  { value: "Czech", label: "Czech" },
  { value: "Danish", label: "Danish" },
  { value: "Djiboutian", label: "Djiboutian" },
  { value: "Dominican", label: "Dominican" },
  { value: "Dutch", label: "Dutch" },
  { value: "East Timorese", label: "East Timorese" },
  { value: "Ecuadorean", label: "Ecuadorean" },
  { value: "Egyptian", label: "Egyptian" },
  { value: "Emirian", label: "Emirian" },
  { value: "Equatorial Guinean", label: "Equatorial Guinean" },
  { value: "Eritrean", label: "Eritrean" },
  { value: "Estonian", label: "Estonian" },
  { value: "Ethiopian", label: "Ethiopian" },
  { value: "Fijian", label: "Fijian" },
  { value: "Filipino", label: "Filipino" },
  { value: "Finnish", label: "Finnish" },
  { value: "French", label: "French" },
  { value: "Gabonese", label: "Gabonese" },
  { value: "Gambian", label: "Gambian" },
  { value: "Georgian", label: "Georgian" },
  { value: "German", label: "German" },
  { value: "Ghanaian", label: "Ghanaian" },
  { value: "Greek", label: "Greek" },
  { value: "Grenadian", label: "Grenadian" },
  { value: "Guatemalan", label: "Guatemalan" },
  { value: "Guinea-Bissauan", label: "Guinea-Bissauan" },
  { value: "Guinean", label: "Guinean" },
  { value: "Guyanese", label: "Guyanese" },
  { value: "Haitian", label: "Haitian" },
  { value: "Herzegovinian", label: "Herzegovinian" },
  { value: "Honduran", label: "Honduran" },
  { value: "Hungarian", label: "Hungarian" },
  { value: "Icelandic", label: "Icelandic" },
  { value: "Indian", label: "Indian" },
  { value: "Indonesian", label: "Indonesian" },
  { value: "Iranian", label: "Iranian" },
  { value: "Iraqi", label: "Iraqi" },
  { value: "Irish", label: "Irish" },
  { value: "Israeli", label: "Israeli" },
  { value: "Italian", label: "Italian" },
  { value: "Ivorian", label: "Ivorian" },
  { value: "Jamaican", label: "Jamaican" },
  { value: "Japanese", label: "Japanese" },
  { value: "Jordanian", label: "Jordanian" },
  { value: "Kazakhstani", label: "Kazakhstani" },
  { value: "Kenyan", label: "Kenyan" },
  { value: "Kittian and Nevisian", label: "Kittian and Nevisian" },
  { value: "Kuwaiti", label: "Kuwaiti" },
  { value: "Kyrgyz", label: "Kyrgyz" },
  { value: "Laotian", label: "Laotian" },
  { value: "Latvian", label: "Latvian" },
  { value: "Lebanese", label: "Lebanese" },
  { value: "Liberian", label: "Liberian" },
  { value: "Libyan", label: "Libyan" },
  { value: "Liechtensteiner", label: "Liechtensteiner" },
  { value: "Lithuanian", label: "Lithuanian" },
  { value: "Luxembourgish", label: "Luxembourgish" },
  { value: "Macedonian", label: "Macedonian" },
  { value: "Malagasy", label: "Malagasy" },
  { value: "Malawian", label: "Malawian" },
  { value: "Maldivan", label: "Maldivan" },
  { value: "Malian", label: "Malian" },
  { value: "Maltese", label: "Maltese" },
  { value: "Marshallese", label: "Marshallese" },
  { value: "Mauritanian", label: "Mauritanian" },
  { value: "Mauritian", label: "Mauritian" },
  { value: "Mexican", label: "Mexican" },
  { value: "Micronesian", label: "Micronesian" },
  { value: "Moldovan", label: "Moldovan" },
  { value: "Monacan", label: "Monacan" },
  { value: "Mongolian", label: "Mongolian" },
  { value: "Moroccan", label: "Moroccan" },
  { value: "Mosotho", label: "Mosotho" },
  { value: "Motswana", label: "Motswana" },
  { value: "Mozambican", label: "Mozambican" },
  { value: "Namibian", label: "Namibian" },
  { value: "Nauruan", label: "Nauruan" },
  { value: "Nepalese", label: "Nepalese" },
  { value: "New Zealander", label: "New Zealander" },
  { value: "Ni-Vanuatu", label: "Ni-Vanuatu" },
  { value: "Nicaraguan", label: "Nicaraguan" },
  { value: "Nigerian", label: "Nigerian" },
  { value: "Nigerien", label: "Nigerien" },
  { value: "North Korean", label: "North Korean" },
  { value: "Northern Irish", label: "Northern Irish" },
  { value: "Norwegian", label: "Norwegian" },
  { value: "Omani", label: "Omani" },
  { value: "Pakistani", label: "Pakistani" },
  { value: "Palauan", label: "Palauan" },
  { value: "Panamanian", label: "Panamanian" },
  { value: "Papua New Guinean", label: "Papua New Guinean" },
  { value: "Paraguayan", label: "Paraguayan" },
  { value: "Peruvian", label: "Peruvian" },
  { value: "Polish", label: "Polish" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Qatari", label: "Qatari" },
  { value: "Romanian", label: "Romanian" },
  { value: "Russian", label: "Russian" },
  { value: "Rwandan", label: "Rwandan" },
  { value: "Saint Lucian", label: "Saint Lucian" },
  { value: "Salvadoran", label: "Salvadoran" },
  { value: "Samoan", label: "Samoan" },
  { value: "San Marinese", label: "San Marinese" },
  { value: "Sao Tomean", label: "Sao Tomean" },
  { value: "Saudi", label: "Saudi" },
  { value: "Scottish", label: "Scottish" },
  { value: "Senegalese", label: "Senegalese" },
  { value: "Serbian", label: "Serbian" },
  { value: "Seychellois", label: "Seychellois" },
  { value: "Sierra Leonean", label: "Sierra Leonean" },
  { value: "Slovak", label: "Slovak" },
  { value: "Slovenian", label: "Slovenian" },
  { value: "Solomon Islander", label: "Solomon Islander" },
  { value: "Somali", label: "Somali" },
  { value: "South African", label: "South African" },
  { value: "South Korean", label: "South Korean" },
  { value: "Spanish", label: "Spanish" },
  { value: "Sri Lankan", label: "Sri Lankan" },
  { value: "Sudanese", label: "Sudanese" },
  { value: "Surinamer", label: "Surinamer" },
  { value: "Swazi", label: "Swazi" },
  { value: "Swedish", label: "Swedish" },
  { value: "Swiss", label: "Swiss" },
  { value: "Syrian", label: "Syrian" },
  { value: "Taiwanese", label: "Taiwanese" },
  { value: "Tajik", label: "Tajik" },
  { value: "Tanzanian", label: "Tanzanian" },
  { value: "Thai", label: "Thai" },
  { value: "Togolese", label: "Togolese" },
  { value: "Tongan", label: "Tongan" },
  { value: "Trinidadian or Tobagonian", label: "Trinidadian or Tobagonian" },
  { value: "Tunisian", label: "Tunisian" },
  { value: "Turkish", label: "Turkish" },
  { value: "Tuvaluan", label: "Tuvaluan" },
  { value: "Ugandan", label: "Ugandan" },
  { value: "Ukrainian", label: "Ukrainian" },
  { value: "Uruguayan", label: "Uruguayan" },
  { value: "Uzbekistani", label: "Uzbekistani" },
  { value: "Venezuelan", label: "Venezuelan" },
  { value: "Vietnamese", label: "Vietnamese" },
  { value: "Welsh", label: "Welsh" },
  { value: "Yemenite", label: "Yemenite" },
  { value: "Zambian", label: "Zambian" },
  { value: "Zimbabwean", label: "Zimbabwean" },
];

export default function GuestCheckin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [token, setToken] = useState<string>("");
  const [guestInfo, setGuestInfo] = useState<{
    capsuleNumber?: string;
    autoAssign?: boolean;
    guestName: string;
    phoneNumber: string;
    email?: string;
    expectedCheckoutDate?: string;
    position: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editToken, setEditToken] = useState<string>("");
  const [editExpiresAt, setEditExpiresAt] = useState<Date | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [icDocumentUrl, setIcDocumentUrl] = useState<string>("");
  const [passportDocumentUrl, setPassportDocumentUrl] = useState<string>("");
  const [nationalityFilter, setNationalityFilter] = useState("");

  const form = useForm<GuestSelfCheckin>({
    resolver: zodResolver(guestSelfCheckinSchema),
    defaultValues: {
      nameAsInDocument: "",
      phoneNumber: "",
      gender: undefined,
      nationality: "Malaysian",
      icNumber: "",
      passportNumber: "",
      icDocumentUrl: "",
      passportDocumentUrl: "",
      paymentMethod: undefined,
      guestPaymentDescription: "",
    },
  });

  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedIcNumber = form.watch("icNumber");
  const watchedPassportNumber = form.watch("passportNumber");
  
  // Determine which fields should be disabled based on mutual exclusivity
  const isIcFieldDisabled = !!(watchedPassportNumber && watchedPassportNumber.trim().length > 0);
  const isPassportFieldDisabled = !!(watchedIcNumber && watchedIcNumber.trim().length > 0);

  // Clear the disabled field when the other field is filled
  useEffect(() => {
    if (watchedIcNumber && watchedIcNumber.trim().length > 0) {
      // Clear passport fields when IC is filled - set to empty strings which will be converted to undefined by schema
      if (watchedPassportNumber) {
        form.setValue("passportNumber", "");
      }
      if (passportDocumentUrl) {
        form.setValue("passportDocumentUrl", "");
        setPassportDocumentUrl("");
      }
    }
  }, [watchedIcNumber]);

  useEffect(() => {
    if (watchedPassportNumber && watchedPassportNumber.trim().length > 0) {
      // Clear IC fields when passport is filled - set to empty strings which will be converted to undefined by schema
      if (watchedIcNumber) {
        form.setValue("icNumber", "");
      }
      if (icDocumentUrl) {
        form.setValue("icDocumentUrl", "");
        setIcDocumentUrl("");
      }
    }
  }, [watchedPassportNumber]);

  // Filter nationalities based on search input
  const filteredNationalities = NATIONALITIES.filter(nationality =>
    nationality.label.toLowerCase().includes(nationalityFilter.toLowerCase())
  );

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (!urlToken) {
      toast({
        title: t.invalidLink,
        description: t.invalidLinkDesc,
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
        let position = 'Available capsule will be assigned';
        
        if (data.capsuleNumber) {
          const capsuleNum = parseInt(data.capsuleNumber.replace('C', ''));
          position = capsuleNum % 2 === 0 ? 'Bottom (Preferred)' : 'Top';
        }
        
        setGuestInfo({
          capsuleNumber: data.capsuleNumber,
          autoAssign: data.autoAssign,
          guestName: data.guestName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          expectedCheckoutDate: data.expectedCheckoutDate,
          position: position
        });

        // Pre-fill form with existing information if available
        if (data.guestName) {
          form.setValue("nameAsInDocument", data.guestName);
        }
        if (data.phoneNumber) {
          form.setValue("phoneNumber", data.phoneNumber);
        }
      } else {
        toast({
          title: t.expiredLink,
          description: t.expiredLinkDesc,
          variant: "destructive",
        });
        setLocation('/');
        return;
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.validationError,
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
      // Update document URLs based on what's uploaded
      const submitData = { 
        ...data, 
        icDocumentUrl: icDocumentUrl || undefined,
        passportDocumentUrl: passportDocumentUrl || undefined,
      };
      
      // Log submission data for debugging
      console.log("Submitting data:", submitData);
      console.log("Form errors:", form.formState.errors);
      
      const response = await fetch(`/api/guest-checkin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        setIsSuccess(true);
        setEditToken(result.editToken);
        setEditExpiresAt(new Date(result.editExpiresAt));
        setCanEdit(true);
        toast({
          title: t.checkInSuccess,
          description: `${t.checkInSuccessDesc} ${result.capsuleNumber || 'your assigned capsule'}.`,
        });
      } else {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        toast({
          title: t.checkInFailed,
          description: errorData.message || "Please check all required fields and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: t.error,
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleDocumentUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, documentType: 'ic' | 'passport') => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        // Convert the upload URL to our object path format
        const objectPath = new URL(uploadedFile.uploadURL).pathname;
        const objectId = objectPath.split('/').pop(); // Get the final part of the path (the object ID)
        
        // Construct full URL that points to our object serving endpoint
        const baseUrl = window.location.origin;
        const documentUrl = `${baseUrl}/objects/uploads/${objectId}`;
        
        if (documentType === 'ic') {
          setIcDocumentUrl(documentUrl);
          form.setValue("icDocumentUrl", documentUrl);
        } else {
          setPassportDocumentUrl(documentUrl);
          form.setValue("passportDocumentUrl", documentUrl);
        }
        
        toast({
          title: "Document Uploaded",
          description: `Your ${documentType === 'ic' ? 'IC' : 'passport'} document has been uploaded successfully.`,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hostel-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t.validatingLink}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.goodDay}</h1>
                <div className="text-2xl mb-4">🎉</div>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-xl p-6 mb-6 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  {t.welcomeHostel} <span className="text-2xl">🌈</span>
                </h2>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{t.address}</span>
                    <span>26A, Jalan Perang, Taman Pelangi, 80400 Johor Bahru</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Button variant="outline" className="flex items-center gap-2 h-auto py-3 px-4" onClick={() => window.open('#', '_blank')}>
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">{t.hostelPhotos}</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 h-auto py-3 px-4" onClick={() => window.open('https://maps.google.com/?q=26A+Jalan+Perang+Taman+Pelangi+80400+Johor+Bahru', '_blank')}>
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{t.googleMaps}</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2 h-auto py-3 px-4" onClick={() => window.open('#', '_blank')}>
                  <Video className="h-4 w-4" />
                  <span className="text-sm">{t.checkInVideo}</span>
                </Button>
              </div>

              <div className="border-t border-gray-200 py-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🕒</span>
                    <span className="font-medium">Check-in:</span>
                    <span>{t.checkInTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕛</span>
                    <span className="font-medium">Check-out:</span>
                    <span>{t.checkOutTime}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span>🔐</span>
                    <span className="font-medium">{t.doorPassword}</span>
                    <span className="font-mono text-lg font-bold text-blue-600">1270#</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🛌</span>
                    <span className="font-medium">{t.capsuleNumber}</span>
                    {guestInfo?.autoAssign ? (
                      <span className="font-bold text-lg text-blue-600">Assigned based on availability</span>
                    ) : (
                      <span className="font-bold text-lg text-orange-600">{guestInfo?.capsuleNumber} ({guestInfo?.position})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🃏</span>
                    <span className="font-medium">{t.accessCard}</span>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <span>⚠</span> {t.importantReminders}
                  </h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• {t.noCardWarning}</li>
                    <li>• {t.noSmoking}</li>
                    <li>• {t.cctvWarning}</li>
                  </ul>
                </div>

                {canEdit && editExpiresAt && new Date() < editExpiresAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-800">{t.infoEditable}</span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {t.editUntil} {editExpiresAt.toLocaleTimeString()}.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        // Navigate back to edit form
                        window.location.href = `/guest-edit?token=${editToken}`;
                      }}
                    >
                      {t.editMyInfo}
                    </Button>
                  </div>
                )}

                <div className="text-center text-gray-600 text-sm">
                  {t.assistance} <br />
                  {t.enjoyStay}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <CardTitle className="text-2xl font-bold text-hostel-text">{t.welcomeTitle}</CardTitle>
              <p className="text-gray-600 mt-2">{t.completeCheckIn}</p>
              <div className="mt-4">
                <LanguageSwitcher variant="compact" className="mx-auto" />
              </div>
              {guestInfo && (
                <div className="mt-4 space-y-2">
                  {!guestInfo.autoAssign && (
                    <div className="rounded-lg p-3 bg-orange-50">
                      <div className="flex items-center justify-center text-sm font-medium text-orange-800">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{t.assignedCapsule}: {guestInfo.capsuleNumber} - {guestInfo.position}</span>
                      </div>
                    </div>
                  )}
                  {(guestInfo.guestName || guestInfo.phoneNumber || guestInfo.email) && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                      <div className="font-medium">{t.prefilledInfo}</div>
                      {guestInfo.guestName && <div>Name: {guestInfo.guestName}</div>}
                      {guestInfo.phoneNumber && <div>Phone: {guestInfo.phoneNumber}</div>}
                      {guestInfo.email && <div>Email: {guestInfo.email}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Manually set document URLs in form before validation
              if (icDocumentUrl) {
                form.setValue("icDocumentUrl", icDocumentUrl);
              }
              if (passportDocumentUrl) {
                form.setValue("passportDocumentUrl", passportDocumentUrl);
              }
              
              // Trigger form submission
              form.handleSubmit(onSubmit)(e);
            }} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {t.personalInfo}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="nameAsInDocument" className="text-sm font-medium text-hostel-text">
                      {t.fullNameLabel}
                    </Label>
                    <Input
                      id="nameAsInDocument"
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      className="w-full mt-1"
                      {...form.register("nameAsInDocument")}
                    />
                    {form.formState.errors.nameAsInDocument && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.nameAsInDocument.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-hostel-text flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t.contactNumberLabel}
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder={t.contactNumberPlaceholder}
                      className="w-full mt-1"
                      {...form.register("phoneNumber")}
                    />
                    {form.formState.errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-hostel-text">
                      {t.genderLabel}
                    </Label>
                    <Select
                      value={form.watch("gender") || ""}
                      onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder={t.genderPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t.male}</SelectItem>
                        <SelectItem value="female">{t.female}</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gender && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.gender.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality" className="text-sm font-medium text-hostel-text">
                      {t.nationalityLabel}
                    </Label>
                    <Select
                      value={form.watch("nationality") || "Malaysian"}
                      onValueChange={(value) => form.setValue("nationality", value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search nationality..."
                            value={nationalityFilter}
                            onChange={(e) => setNationalityFilter(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {filteredNationalities.map((nationality) => (
                          <SelectItem key={nationality.value} value={nationality.value}>
                            {nationality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.nationality && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.nationality.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Documents */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t.identityDocs}
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">📋 Document Selection Rule</p>
                    <p className="text-sm text-gray-600">Provide either IC number OR passport number (only one required). When you enter one, the other field will be automatically disabled.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icNumber" className="text-sm font-medium text-hostel-text">
                        IC Number (e.g., 840816015291) {!watchedPassportNumber && <span className="text-red-500">*</span>}
                        {isIcFieldDisabled && <span className="text-gray-500 text-xs ml-2">(Disabled - passport entered)</span>}
                      </Label>
                      <Input
                        id="icNumber"
                        type="text"
                        placeholder={isIcFieldDisabled ? "Disabled - clear passport to enable" : "840816015291"}
                        className={`w-full mt-1 ${isIcFieldDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isIcFieldDisabled}
                        {...form.register("icNumber")}
                      />
                      {form.formState.errors.icNumber && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.icNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="passportNumber" className="text-sm font-medium text-hostel-text">
                        {t.passportNumberLabel} {!watchedIcNumber && <span className="text-red-500">*</span>}
                        {isPassportFieldDisabled && <span className="text-gray-500 text-xs ml-2">(Disabled - IC entered)</span>}
                      </Label>
                      <Input
                        id="passportNumber"
                        type="text"
                        placeholder={isPassportFieldDisabled ? "Disabled - clear IC to enable" : t.passportNumberPlaceholder}
                        className={`w-full mt-1 ${isPassportFieldDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isPassportFieldDisabled}
                        {...form.register("passportNumber")}
                      />
                      {form.formState.errors.passportNumber && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.passportNumber.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Combined Document Upload Section */}
                  {(watchedIcNumber || watchedPassportNumber) && (
                    <div>
                      <Label className="text-sm font-medium text-hostel-text flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload IC/Passport Photo
                      </Label>
                      {(icDocumentUrl || passportDocumentUrl) ? (
                        <div className="mt-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {watchedIcNumber && icDocumentUrl && "IC document uploaded successfully"}
                              {watchedPassportNumber && passportDocumentUrl && "Passport document uploaded successfully"}
                            </span>
                          </div>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760} // 10MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => {
                              if (watchedIcNumber) {
                                handleDocumentUpload(result, 'ic');
                              } else if (watchedPassportNumber) {
                                handleDocumentUpload(result, 'passport');
                              }
                            }}
                            buttonClassName="mt-2"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Change Document Photo
                          </ObjectUploader>
                        </div>
                      ) : (
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">
                            Upload a clear photo of your {watchedIcNumber ? 'IC' : 'passport'}
                          </p>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760} // 10MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => {
                              if (watchedIcNumber) {
                                handleDocumentUpload(result, 'ic');
                              } else if (watchedPassportNumber) {
                                handleDocumentUpload(result, 'passport');
                              }
                            }}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Upload {watchedIcNumber ? 'IC' : 'Passport'} Photo
                          </ObjectUploader>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paymentMethod" className="text-sm font-medium text-hostel-text">
                      Payment Method
                    </Label>
                    <Select
                      value={form.watch("paymentMethod") || ""}
                      onValueChange={(value) => form.setValue("paymentMethod", value as "cash" | "bank" | "online_platform")}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            <span>Cash (Paid to Guest/Person)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Bank Transfer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="online_platform">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Online Platform (Booking.com, Agoda, etc.)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.paymentMethod.message}</p>
                    )}
                  </div>

                  {/* Cash Payment Description */}
                  {watchedPaymentMethod === "cash" && (
                    <div>
                      <Label htmlFor="guestPaymentDescription" className="text-sm font-medium text-hostel-text">
                        Describe whom you gave the payment to
                      </Label>
                      <Textarea
                        id="guestPaymentDescription"
                        placeholder="e.g., Paid RM50 to Ahmad at the front desk"
                        className="w-full mt-1"
                        {...form.register("guestPaymentDescription")}
                      />
                      {form.formState.errors.guestPaymentDescription && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.guestPaymentDescription.message}</p>
                      )}
                    </div>
                  )}

                  {/* Bank Transfer Details */}
                  {watchedPaymentMethod === "bank" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Bank Account Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Account Name:</strong> Pelangi Capsule Hostel</div>
                        <div><strong>Account Number:</strong> 551128652007</div>
                        <div><strong>Bank:</strong> Maybank</div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-blue-700 mb-2">QR Code for Payment</p>
                        <img 
                          src={qrCodeImage} 
                          alt="Payment QR Code" 
                          className="w-32 h-auto mx-auto border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing Check-in..." : "Complete Check-in"}
              </Button>
              
              {/* Show validation errors summary if form was submitted */}
              {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field} className="text-sm text-red-600">
                        {error?.message || `Error in ${field} field`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}