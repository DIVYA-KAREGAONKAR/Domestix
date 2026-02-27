import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, User, MapPin, Upload, Save, ArrowLeft, Star, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";

const serviceOptions = ["House Cleaning", "Babysitting", "Elder Care", "Pet Care", "Cooking", "Laundry", "Gardening", "Personal Assistant", "Tutoring", "Event Help"];
const languageOptions = ["English", "Hindi", "Marathi", "Urdu", "Bengali", "Malayalam", "Tamil"];
const countryOptions = ["India", "Other"];
const availabilityOptions = ["Full-time", "Part-time", "Live-in", "Live-out", "Hourly Basis"];
const genderOptions = ["male", "female", "other"];
const maritalStatusOptions = ["single", "married", "divorced", "widowed"];
const workPreferenceOptions = ["full_time", "part_time", "hourly", "live_in", "live_out"];
const visaTypeOptions = ["employment", "visit", "none"];
const workPermitStatusOptions = ["not_applied", "applied", "approved"];

const WorkerProfile = () => {
  const { user, isAuthenticated, isWorker, logout } = useAuth();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    dateOfBirth: "",
    phone: "",
    alternatePhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    bio: "",
    hourlyRate: "",
    experience: "",
    availability: [] as string[],
    services: [] as string[],
    languages: [] as string[],
    workPreference: "",
    preferredWorkLocations: [] as string[],
    willingToRelocate: false,
    expectedSalaryFullTime: "",
    expectedSalaryPartTime: "",
    hasTransportation: false,
    hasReferences: false,
    isBackgroundChecked: false,
    passportNumber: "",
    passportExpiryDate: "",
    visaType: "",
    domesticWorkerVisaIssuedBy: "",
    workPermitStatus: "",
    hasCriminalRecord: false,
    criminalRecordDetails: "",
    policeClearanceAvailable: false,
    educationalQualification: "",
    healthConditions: "",
    emergencyContact: "",
    availableFrom: "",
    expectedBenefits: "",
    emiratesIdDocument: "",
    residencyVisaDocument: "",
    medicalFitnessCertificate: "",
    policeVerificationCertificate: "",
    profileImage: ""
  });

  // 1. Fetch Profile on Load
  useEffect(() => {
    if (!isAuthenticated || !isWorker) {
      navigate("/worker/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/worker/profile/");
        const data = response.data;
        setProfileData(prev => ({
          ...prev,
          firstName: user?.first_name || "",
          lastName: user?.last_name || "",
          email: user?.email || "",
          gender: data.gender || "",
          maritalStatus: data.marital_status || "",
          nationality: data.nationality || "",
          dateOfBirth: data.date_of_birth || "",
          phone: data.phone || "",
          alternatePhone: data.alternate_phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zip_code || "", // ✅ Mapped correctly from snake_case
          country: data.country || "",
          bio: data.bio || "",
          hourlyRate: data.hourly_rate || "", // ✅ Mapped correctly from snake_case
          experience: data.experience || "", // ✅ Matches models.py 'experience'
          availability: Array.isArray(data.availability) ? data.availability : [],
          services: Array.isArray(data.services) ? data.services : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          workPreference: data.work_preference || "",
          preferredWorkLocations: Array.isArray(data.preferred_work_locations) ? data.preferred_work_locations : [],
          willingToRelocate: data.willing_to_relocate || false,
          expectedSalaryFullTime: data.expected_salary_full_time || "",
          expectedSalaryPartTime: data.expected_salary_part_time || "",
          hasTransportation: data.has_transportation || false,
          hasReferences: data.has_references || false,
          isBackgroundChecked: data.is_background_checked || false,
          passportNumber: data.passport_number || "",
          passportExpiryDate: data.passport_expiry_date || "",
          visaType: data.visa_type || "",
          domesticWorkerVisaIssuedBy: data.domestic_worker_visa_issued_by || "",
          workPermitStatus: data.work_permit_status || "",
          hasCriminalRecord: data.has_criminal_record || false,
          criminalRecordDetails: data.criminal_record_details || "",
          policeClearanceAvailable: data.police_clearance_available || false,
          educationalQualification: data.educational_qualification || "",
          healthConditions: data.health_conditions || "",
          emergencyContact: data.emergency_contact || "",
          availableFrom: data.available_from || "",
          expectedBenefits: Array.isArray(data.expected_benefits) ? data.expected_benefits.join(", ") : "",
          emiratesIdDocument: data.emirates_id_document || "",
          residencyVisaDocument: data.residency_visa_document || "",
          medicalFitnessCertificate: data.medical_fitness_certificate || "",
          policeVerificationCertificate: data.police_verification_certificate || "",
          profileImage: data.profile_image || ""
        }));
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchProfile();
  }, [isAuthenticated, isWorker, navigate, user]);

  // 2. Auto-save logic
  const autoSave = async (updatedData: typeof profileData) => {
    setIsSaving(true);
    try {
      const payload = {
        phone: updatedData.phone,
        address: updatedData.address,
        city: updatedData.city,
        state: updatedData.state,
        zip_code: updatedData.zipCode, // ✅ Match Django zip_code
        country: updatedData.country,
        bio: updatedData.bio,
        hourly_rate: updatedData.hourlyRate, // ✅ Match Django hourly_rate
        experience: updatedData.experience, // ✅ Match Django experience
        services: updatedData.services,
        availability: updatedData.availability,
        languages: updatedData.languages,
        gender: updatedData.gender,
        marital_status: updatedData.maritalStatus,
        nationality: updatedData.nationality,
        date_of_birth: updatedData.dateOfBirth || null,
        alternate_phone: updatedData.alternatePhone,
        work_preference: updatedData.workPreference,
        preferred_work_locations: updatedData.preferredWorkLocations,
        willing_to_relocate: updatedData.willingToRelocate,
        expected_salary_full_time: updatedData.expectedSalaryFullTime || null,
        expected_salary_part_time: updatedData.expectedSalaryPartTime || null,
        has_transportation: updatedData.hasTransportation,
        has_references: updatedData.hasReferences,
        is_background_checked: updatedData.isBackgroundChecked,
        passport_number: updatedData.passportNumber,
        passport_expiry_date: updatedData.passportExpiryDate || null,
        visa_type: updatedData.visaType,
        domestic_worker_visa_issued_by: updatedData.domesticWorkerVisaIssuedBy,
        work_permit_status: updatedData.workPermitStatus,
        has_criminal_record: updatedData.hasCriminalRecord,
        criminal_record_details: updatedData.criminalRecordDetails,
        police_clearance_available: updatedData.policeClearanceAvailable,
        educational_qualification: updatedData.educationalQualification,
        health_conditions: updatedData.healthConditions,
        emergency_contact: updatedData.emergencyContact,
        available_from: updatedData.availableFrom || null,
        expected_benefits: updatedData.expectedBenefits.split(",").map((i) => i.trim()).filter(Boolean),
      };
      await api.put("/worker/profile/", payload);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => autoSave(profileData), 2000));
    return () => debounceTimer && clearTimeout(debounceTimer);
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: "services" | "availability" | "languages", value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(i => i !== value) : [...prev[field], value]
    }));
  };

  const handleSelectChange = (
    field: "experience" | "state" | "country" | "gender" | "maritalStatus" | "workPreference" | "visaType" | "workPermitStatus",
    value: string
  ) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("profile_image", file);
    try {
      const response = await api.put("/worker/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfileData(prev => ({ ...prev, profileImage: response.data.profile_image }));
      toast({ title: "Success", description: "Photo updated!" });
    } catch {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    }
  };

  const handleDocumentUpload = async (fieldName: string, file: File) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    try {
      const response = await api.put("/worker/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfileData(prev => ({
        ...prev,
        emiratesIdDocument: response.data.emirates_id_document || prev.emiratesIdDocument,
        residencyVisaDocument: response.data.residency_visa_document || prev.residencyVisaDocument,
        medicalFitnessCertificate: response.data.medical_fitness_certificate || prev.medicalFitnessCertificate,
        policeVerificationCertificate: response.data.police_verification_certificate || prev.policeVerificationCertificate,
      }));
      toast({ title: "Success", description: "Document uploaded." });
    } catch {
      toast({ title: "Error", description: "Document upload failed", variant: "destructive" });
    }
  };

  const handleDeactivateAccount = async () => {
    if (!window.confirm("Deactivate your account? You will be logged out immediately.")) return;
    try {
      await api.patch("/profile/deactivate/");
      toast({ title: "Account deactivated", description: "Your profile has been deactivated." });
      logout();
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Unable to deactivate account.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await autoSave(profileData);
    toast({ title: "Saved", description: "Profile updated successfully!" });
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div className="app-shell pb-10">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/worker/dashboard" className="flex items-center text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
            <span className="font-semibold text-slate-700">Worker Profile</span>
          </div>
          {isSaving && <span className="text-xs text-slate-500 animate-pulse">Saving changes...</span>}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle className="flex items-center"><User className="h-5 w-5 mr-2"/> Profile Photo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border">
                  <AvatarImage src={profileData.profileImage} className="object-cover"/>
                  <AvatarFallback className="bg-primary text-white">{user.first_name[0]}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2"/> Change Photo
                </Button>
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}/>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Personal & Legal Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Gender</Label>
                <Select onValueChange={(v) => handleSelectChange("gender", v)} value={profileData.gender}>
                  <SelectTrigger><SelectValue placeholder="Gender"/></SelectTrigger>
                  <SelectContent>{genderOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Marital Status</Label>
                <Select onValueChange={(v) => handleSelectChange("maritalStatus", v)} value={profileData.maritalStatus}>
                  <SelectTrigger><SelectValue placeholder="Marital Status"/></SelectTrigger>
                  <SelectContent>{maritalStatusOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date of Birth</Label><Input type="date" name="dateOfBirth" value={profileData.dateOfBirth} onChange={handleInputChange}/></div>
              <div><Label>Nationality</Label><Input name="nationality" value={profileData.nationality} onChange={handleInputChange}/></div>
              <div><Label>Passport Number</Label><Input name="passportNumber" value={profileData.passportNumber} onChange={handleInputChange}/></div>
              <div><Label>Passport Expiry</Label><Input type="date" name="passportExpiryDate" value={profileData.passportExpiryDate} onChange={handleInputChange}/></div>
              <div><Label>Visa Type</Label>
                <Select onValueChange={(v) => handleSelectChange("visaType", v)} value={profileData.visaType}>
                  <SelectTrigger><SelectValue placeholder="Visa Type"/></SelectTrigger>
                  <SelectContent>{visaTypeOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Domestic Worker Visa Issued By</Label><Input name="domesticWorkerVisaIssuedBy" value={profileData.domesticWorkerVisaIssuedBy} onChange={handleInputChange} placeholder="MOHRE / GDRFA" /></div>
              <div><Label>Work Permit Status</Label>
                <Select onValueChange={(v) => handleSelectChange("workPermitStatus", v)} value={profileData.workPermitStatus}>
                  <SelectTrigger><SelectValue placeholder="Permit Status"/></SelectTrigger>
                  <SelectContent>{workPermitStatusOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="hasCriminalRecord" checked={profileData.hasCriminalRecord} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, hasCriminalRecord: !!c }))}/>
                <Label htmlFor="hasCriminalRecord">Has Criminal Record</Label>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="policeClearanceAvailable" checked={profileData.policeClearanceAvailable} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, policeClearanceAvailable: !!c }))}/>
                <Label htmlFor="policeClearanceAvailable">Police Clearance Available</Label>
              </div>
              <div className="md:col-span-2"><Label>Criminal Record Details</Label><Textarea name="criminalRecordDetails" value={profileData.criminalRecordDetails} onChange={handleInputChange} rows={3} /></div>
              <div><Label>Educational Qualification</Label><Input name="educationalQualification" value={profileData.educationalQualification} onChange={handleInputChange} /></div>
              <div><Label>Available From</Label><Input type="date" name="availableFrom" value={profileData.availableFrom} onChange={handleInputChange} /></div>
              <div><Label>Emergency Contact</Label><Input name="emergencyContact" value={profileData.emergencyContact} onChange={handleInputChange} /></div>
              <div><Label>Expected Benefits</Label><Input name="expectedBenefits" value={profileData.expectedBenefits} onChange={handleInputChange} placeholder="Weekly Off, Medical Insurance" /></div>
              <div className="md:col-span-2"><Label>Health Conditions</Label><Textarea name="healthConditions" value={profileData.healthConditions} onChange={handleInputChange} rows={3} /></div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input name="phone" value={profileData.phone} onChange={handleInputChange}/></div>
              <div><Label>Alternate Phone</Label><Input name="alternatePhone" value={profileData.alternatePhone} onChange={handleInputChange}/></div>
              <div><Label>City</Label><Input name="city" value={profileData.city} onChange={handleInputChange}/></div>
              <div><Label>ZIP Code</Label><Input name="zipCode" value={profileData.zipCode} onChange={handleInputChange}/></div>
              <div><Label>Country</Label>
                <Select onValueChange={(v) => handleSelectChange("country", v)} value={profileData.country}>
                  <SelectTrigger><SelectValue placeholder="Country"/></SelectTrigger>
                  <SelectContent>{countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Work Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Bio</Label><Textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows={4}/>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><Label>Hourly Rate (₹)</Label><Input name="hourlyRate" type="number" value={profileData.hourlyRate} onChange={handleInputChange}/></div>
                <div><Label>Expected Salary Full-time (AED)</Label><Input name="expectedSalaryFullTime" type="number" value={profileData.expectedSalaryFullTime} onChange={handleInputChange}/></div>
                <div><Label>Expected Salary Part-time (AED)</Label><Input name="expectedSalaryPartTime" type="number" value={profileData.expectedSalaryPartTime} onChange={handleInputChange}/></div>
                <div><Label>Experience</Label>
                  <Select onValueChange={(v) => handleSelectChange("experience", v)} value={profileData.experience}>
                    <SelectTrigger><SelectValue placeholder="Years"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0-1">0-1 Years</SelectItem>
                        <SelectItem value="1-3">1-3 Years</SelectItem>
                        <SelectItem value="5+">5+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Work Preference</Label>
                  <Select onValueChange={(v) => handleSelectChange("workPreference", v)} value={profileData.workPreference}>
                    <SelectTrigger><SelectValue placeholder="Work Preference"/></SelectTrigger>
                    <SelectContent>{workPreferenceOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox id="willingToRelocate" checked={profileData.willingToRelocate} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, willingToRelocate: !!c }))}/>
                  <Label htmlFor="willingToRelocate">Willing to Relocate</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Services & Languages</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3"><Label className="font-bold">Services</Label>
                {serviceOptions.slice(0, 5).map(s => (
                  <div key={s} className="flex items-center space-x-2">
                    <Checkbox id={s} checked={profileData.services.includes(s)} onCheckedChange={() => handleCheckboxChange("services", s)}/>
                    <Label htmlFor={s}>{s}</Label>
                  </div>))}
              </div>
              <div className="space-y-3"><Label className="font-bold">Languages</Label>
                {languageOptions.slice(0, 5).map(l => (
                  <div key={l} className="flex items-center space-x-2">
                    <Checkbox id={l} checked={profileData.languages.includes(l)} onCheckedChange={() => handleCheckboxChange("languages", l)}/>
                    <Label htmlFor={l}>{l}</Label>
                  </div>))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Availability & Verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map(a => (
                  <div key={a} className="flex items-center space-x-2">
                    <Checkbox id={a} checked={profileData.availability.includes(a)} onCheckedChange={() => handleCheckboxChange("availability", a)} />
                    <Label htmlFor={a}>{a}</Label>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="hasReferences" checked={profileData.hasReferences} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, hasReferences: !!c }))}/>
                  <Label htmlFor="hasReferences">Has References</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="isBackgroundChecked" checked={profileData.isBackgroundChecked} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, isBackgroundChecked: !!c }))}/>
                  <Label htmlFor="isBackgroundChecked">Background Checked</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hasTransportation" checked={profileData.hasTransportation} onCheckedChange={(c) => setProfileData(prev => ({ ...prev, hasTransportation: !!c }))}/>
                  <Label htmlFor="hasTransportation">Has Transportation</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-200">
            <CardHeader><CardTitle>Verification Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Emirates ID / Residency Visa</Label>
                  <Input type="file" onChange={(e) => e.target.files && handleDocumentUpload("emirates_id_document", e.target.files[0])} />
                  {profileData.emiratesIdDocument && <a className="text-xs text-primary underline" href={profileData.emiratesIdDocument} target="_blank" rel="noreferrer">View uploaded file</a>}
                </div>
                <div>
                  <Label>Residency Visa Document</Label>
                  <Input type="file" onChange={(e) => e.target.files && handleDocumentUpload("residency_visa_document", e.target.files[0])} />
                  {profileData.residencyVisaDocument && <a className="text-xs text-primary underline" href={profileData.residencyVisaDocument} target="_blank" rel="noreferrer">View uploaded file</a>}
                </div>
                <div>
                  <Label>Medical Fitness Certificate</Label>
                  <Input type="file" onChange={(e) => e.target.files && handleDocumentUpload("medical_fitness_certificate", e.target.files[0])} />
                  {profileData.medicalFitnessCertificate && <a className="text-xs text-primary underline" href={profileData.medicalFitnessCertificate} target="_blank" rel="noreferrer">View uploaded file</a>}
                </div>
                <div>
                  <Label>Police Verification Certificate</Label>
                  <Input type="file" onChange={(e) => e.target.files && handleDocumentUpload("police_verification_certificate", e.target.files[0])} />
                  {profileData.policeVerificationCertificate && <a className="text-xs text-primary underline" href={profileData.policeVerificationCertificate} target="_blank" rel="noreferrer">View uploaded file</a>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full btn-primary" disabled={isLoading}>{isLoading ? "Saving..." : "Save All Changes"}</Button>
          <Button type="button" variant="destructive" className="w-full" onClick={() => void handleDeactivateAccount()}>
            Deactivate Account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfile;
