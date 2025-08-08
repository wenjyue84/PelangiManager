import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User, Phone, Mail, Calendar, MapPin, CheckCircle, Upload, Camera, Globe, Video, ImageIcon } from "lucide-react";
import { guestSelfCheckinSchema, type GuestSelfCheckin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");

  const form = useForm<GuestSelfCheckin>({
    resolver: zodResolver(guestSelfCheckinSchema),
    defaultValues: {
      nameAsInDocument: "",
      phoneNumber: "",
      gender: undefined,
      nationality: "",
      icNumber: "",
      passportNumber: "",
      icDocumentUrl: "",
      passportDocumentUrl: "",
      paymentMethod: undefined,
      profilePhotoUrl: "",
    },
  });

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
        let position = 'To be assigned based on gender';
        
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

        // Pre-fill the form with guest name as placeholder
        form.setValue("nameAsInDocument", "");
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
      const submitData = { ...data, profilePhotoUrl };
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
          description: `${t.checkInSuccessDesc} ${guestInfo?.capsuleNumber}.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: t.checkInFailed,
          description: errorData.message || "Failed to complete check-in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t.error,
        description: "Failed to submit check-in information.",
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

  const handlePhotoUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        // Convert the upload URL to our object path format
        const objectPath = new URL(uploadedFile.uploadURL).pathname;
        const normalizedPath = `/objects${objectPath.split('/.private')[1]}`;
        setProfilePhotoUrl(normalizedPath);
        toast({
          title: "Photo Uploaded",
          description: "Your profile photo has been uploaded successfully.",
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
                      <span className="font-bold text-lg text-blue-600">Auto-assigned based on gender</span>
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
                  <div className={`rounded-lg p-3 ${guestInfo.autoAssign ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <div className={`flex items-center justify-center text-sm font-medium ${guestInfo.autoAssign ? 'text-blue-800' : 'text-orange-800'}`}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {guestInfo.autoAssign ? (
                        <span>🤖 Auto Assignment: Capsule will be assigned based on your gender</span>
                      ) : (
                        <span>{t.assignedCapsule}: {guestInfo.capsuleNumber} - {guestInfo.position}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                    <div className="font-medium">{t.prefilledInfo}</div>
                    <div>Name: {guestInfo.guestName}</div>
                    <div>Phone: {guestInfo.phoneNumber}</div>
                    {guestInfo.email && <div>Email: {guestInfo.email}</div>}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Profile Photo (Optional)
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Upload a profile photo to personalize your stay</p>
                  
                  {profilePhotoUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={profilePhotoUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-600">Photo uploaded successfully!</p>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          allowedFileTypes={['.jpg', '.jpeg', '.png', '.gif', '.webp']}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handlePhotoUpload}
                          buttonClassName="mt-2"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </ObjectUploader>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-3">No profile photo yet</p>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        allowedFileTypes={['.jpg', '.jpeg', '.png', '.gif', '.webp']}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handlePhotoUpload}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </ObjectUploader>
                    </div>
                  )}
                </div>
              </div>

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
                      placeholder={`${t.fullNamePlaceholder} (Expected: ${guestInfo?.guestName || 'Full Name'})`}
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
                      placeholder={`${t.contactNumberPlaceholder} (Expected: ${guestInfo?.phoneNumber || 'e.g., +60123456789'})`}
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
                    <Input
                      id="nationality"
                      type="text"
                      placeholder={t.nationalityPlaceholder}
                      className="w-full mt-1"
                      {...form.register("nationality")}
                    />
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
                  <p className="text-sm text-gray-600">{t.identityDocsDesc}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icNumber" className="text-sm font-medium text-hostel-text">
                        {t.icNumberLabel}
                      </Label>
                      <Input
                        id="icNumber"
                        type="text"
                        placeholder={t.icNumberPlaceholder}
                        className="w-full mt-1"
                        {...form.register("icNumber")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="passportNumber" className="text-sm font-medium text-hostel-text">
                        {t.passportNumberLabel}
                      </Label>
                      <Input
                        id="passportNumber"
                        type="text"
                        placeholder={t.passportNumberPlaceholder}
                        className="w-full mt-1"
                        {...form.register("passportNumber")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-hostel-text flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {t.icPhotoLabel}
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">{t.icPhotoDesc}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          // This would trigger file upload - simplified for demo
                          toast({ title: "Photo Upload", description: "IC photo upload feature would be implemented here" });
                        }}>
                          {t.chooseFile}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-hostel-text flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {t.passportPhotoLabel}
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">{t.passportPhotoDesc}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          // This would trigger file upload - simplified for demo
                          toast({ title: "Photo Upload", description: "Passport photo upload feature would be implemented here" });
                        }}>
                          {t.chooseFile}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {form.formState.errors.icNumber && (
                    <p className="text-red-500 text-sm">{form.formState.errors.icNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-medium text-hostel-text mb-3 flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {t.paymentMethod}
                </h3>
                <div>
                  <Select
                    value={form.watch("paymentMethod") || ""}
                    onValueChange={(value) => form.setValue("paymentMethod", value as "cash" | "card" | "online_transfer")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.paymentMethodPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t.cash}</SelectItem>
                      <SelectItem value="card">{t.card}</SelectItem>
                      <SelectItem value="online_transfer">{t.onlineTransfer}</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.paymentMethod.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{t.paymentNote}</p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-hostel-secondary hover:bg-orange-700 text-white py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.completingCheckIn : t.completeCheckInBtn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}