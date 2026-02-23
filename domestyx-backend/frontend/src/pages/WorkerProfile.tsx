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
import api from "@/services/api"; // ✅ Centralized API instance for port 8002

const serviceOptions = ["House Cleaning", "Babysitting", "Elder Care", "Pet Care", "Cooking", "Laundry", "Gardening", "Personal Assistant", "Tutoring", "Event Help"];
const availabilityOptions = [
  "Monday - Morning", "Monday - Afternoon", "Monday - Evening",
  "Tuesday - Morning", "Tuesday - Afternoon", "Tuesday - Evening",
  "Wednesday - Morning", "Wednesday - Afternoon", "Wednesday - Evening",
  "Thursday - Morning", "Thursday - Afternoon", "Thursday - Evening",
  "Friday - Morning", "Friday - Afternoon", "Friday - Evening",
  "Saturday - Morning", "Saturday - Afternoon", "Saturday - Evening",
  "Sunday - Morning", "Sunday - Afternoon", "Sunday - Evening"
];
const languageOptions = ["English", "Arabic", "Hindi", "Marathi", "Urdu", "Tagalog", "Filipino", "Bengali", "Malayalam", "Nepali", "Indonesian", "Sinhala", "Tamil", "Swahili", "Amharic"];
const countryOptions = ["India", "Dubai"];
const stateOptions = [
  { value: "mh", label: "Maharashtra" },
  { value: "dl", label: "Delhi" },
  { value: "ka", label: "Karnataka" },
  { value: "tn", label: "Tamil Nadu" }
];

const WorkerProfile = () => {
  const { user, isAuthenticated, isWorker } = useAuth();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: "",
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
    hasTransportation: false,
    hasReferences: false,
    isBackgroundChecked: false,
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
        const response = await api.get("/worker/profile/"); // ✅ Relative path uses 8002
        const data = response.data;
        setProfileData(prev => ({
          ...prev,
          firstName: user?.first_name || "",
          lastName: user?.last_name || "",
          email: user?.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zip_code || "", // ✅ Mapped from backend
          country: data.country || "",
          bio: data.bio || "",
          hourlyRate: data.hourly_rate || "", // ✅ Mapped from backend
          experience: data.years_of_experience || "", // ✅ Mapped from backend
          availability: Array.isArray(data.availability) ? data.availability : [],
          services: Array.isArray(data.services) ? data.services : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          hasTransportation: data.has_transportation || false,
          hasReferences: data.has_references || false,
          isBackgroundChecked: data.is_background_checked || false,
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
        zip_code: updatedData.zipCode,
        country: updatedData.country,
        bio: updatedData.bio,
        hourly_rate: updatedData.hourlyRate,
        years_of_experience: updatedData.experience,
        services: updatedData.services,
        availability: updatedData.availability,
        languages: updatedData.languages,
        has_transportation: updatedData.hasTransportation,
        has_references: updatedData.hasReferences,
        is_background_checked: updatedData.isBackgroundChecked
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

  const handleSelectChange = (field: "experience" | "state" | "country", value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: "hasTransportation" | "hasReferences" | "isBackgroundChecked", value: boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await autoSave(profileData);
    toast({ title: "Saved", description: "Profile updated successfully!" });
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-bg pb-12">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/worker/dashboard" className="flex items-center text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
            <span className="font-semibold text-gray-700">Worker Profile</span>
          </div>
          {isSaving && <span className="text-xs text-gray-400 animate-pulse">Saving changes...</span>}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><User className="h-5 w-5 mr-2"/> Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border">
                  <AvatarImage src={profileData.profileImage} className="object-cover"/>
                  <AvatarFallback className="bg-primary text-white">{user.first_name[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2"/> Change Photo
                  </Button>
                  <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}/>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" value={profileData.phone} onChange={handleInputChange}/>
                </div>
                <div>
                  <Label>City</Label>
                  <Input name="city" value={profileData.city} onChange={handleInputChange}/>
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input name="zipCode" value={profileData.zipCode} onChange={handleInputChange}/>
                </div>
                <div>
                  <Label>Country</Label>
                  <Select onValueChange={(v) => handleSelectChange("country", v)} value={profileData.country}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Country"/></SelectTrigger>
                    <SelectContent>{countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Work Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Bio</Label>
              <Textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows={4}/>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input name="hourlyRate" type="number" value={profileData.hourlyRate} onChange={handleInputChange}/>
                </div>
                <div>
                  <Label>Experience</Label>
                  <Select onValueChange={(v) => handleSelectChange("experience", v)} value={profileData.experience}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Years"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0-1">0-1 Years</SelectItem>
                        <SelectItem value="1-3">1-3 Years</SelectItem>
                        <SelectItem value="5+">5+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Services & Languages</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold">Services</Label>
                {serviceOptions.slice(0, 5).map(s => (
                  <div key={s} className="flex items-center space-x-2">
                    <Checkbox id={s} checked={profileData.services.includes(s)} onCheckedChange={() => handleCheckboxChange("services", s)}/>
                    <Label htmlFor={s}>{s}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Label className="font-bold">Languages</Label>
                {languageOptions.slice(0, 5).map(l => (
                  <div key={l} className="flex items-center space-x-2">
                    <Checkbox id={l} checked={profileData.languages.includes(l)} onCheckedChange={() => handleCheckboxChange("languages", l)}/>
                    <Label htmlFor={l}>{l}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save All Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfile;