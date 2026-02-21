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
import axios from "axios";

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
  const { user, isAuthenticated, isWorker, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  // Redirect if not authenticated or not a worker
  useEffect(() => {
    if (!isAuthenticated || !isWorker) {
      navigate("/worker/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = getAccessToken();
        const response = await axios.get("http://localhost:8000/api/worker/profile/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setProfileData(prev => ({
          ...prev,
          firstName: data.firstName || data.first_name || "",
          lastName: data.lastName || data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          country: data.country || "",
          bio: data.bio || "",
          hourlyRate: data.hourlyRate || "",
          experience: data.experience || "",
          availability: Array.isArray(data.availability) ? data.availability : [],
          services: Array.isArray(data.services) ? data.services : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          hasTransportation: data.hasTransportation || false,
          hasReferences: data.hasReferences || false,
          isBackgroundChecked: data.isBackgroundChecked || false,
          profileImage: data.profileImage || ""
        }));
      } catch {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
      }
    };
    fetchProfile();
  }, [isAuthenticated, isWorker, navigate]);

  // Auto-save with debounce
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => autoSave(profileData), 1000));
    return () => debounceTimer && clearTimeout(debounceTimer);
  }, [profileData]);

const autoSave = async (updatedData: typeof profileData) => {
  try {
    const token = getAccessToken();
    
    // Explicitly mapping frontend keys to backend database keys
    const payload = {
      phone: updatedData.phone,
      address: updatedData.address,
      city: updatedData.city,
      state: updatedData.state,
      zip_code: updatedData.zipCode, // Translated
      country: updatedData.country,
      bio: updatedData.bio,
      hourly_rate: updatedData.hourlyRate, // Translated
      experience: updatedData.experience,
      services: updatedData.services,
      availability: updatedData.availability,
      languages: updatedData.languages,
      has_transportation: updatedData.hasTransportation, // Translated
      has_references: updatedData.hasReferences, // Translated
      is_background_checked: updatedData.isBackgroundChecked // Translated
    };

    await axios.put("http://localhost:8000/api/worker/profile/", payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });
  } catch (error) {
    console.error("Auto-save failed:", error);
  }
};
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
    const previewUrl = URL.createObjectURL(file);
    setProfileData(prev => ({ ...prev, profileImage: previewUrl }));

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      const token = getAccessToken();
      const response = await axios.put("http://localhost:8000/api/worker/profile/upload-image/", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setProfileData(prev => ({ ...prev, profileImage: response.data.profileImage }));
      toast({ title: "Image Uploaded", description: "Profile image updated"});
    } catch {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive"});
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  const token = getAccessToken();
  const formData = new FormData();

  // Mapping fields for the Multipart form
  formData.append("phone", profileData.phone);
  formData.append("bio", profileData.bio);
  formData.append("hourly_rate", profileData.hourlyRate);
  formData.append("zip_code", profileData.zipCode);
  
  // JSON fields must be stringified when sent via FormData
  formData.append("services", JSON.stringify(profileData.services));
  formData.append("availability", JSON.stringify(profileData.availability));
  formData.append("languages", JSON.stringify(profileData.languages));

  if (imageInputRef.current?.files?.[0]) {
    formData.append("profile_image", imageInputRef.current.files[0]);
  }

  try {
    await axios.put("http://localhost:8000/api/worker/profile/", formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type here; browser does it for FormData
      },
    });
    toast({ title: "Success", description: "Profile updated successfully!" });
  } catch (error) {
    console.error("Save failed:", error);
    toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/worker/dashboard" className="flex items-center text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Link>
              <span className="text-gray-600">Worker Profile</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info & Profile Pic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><User className="h-5 w-5 mr-2"/> Personal Information</CardTitle>
              <CardDescription>Your basic personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.profileImage || "/placeholder-avatar.jpg"} className="rounded-full object-cover"/>
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2"/> Upload Photo
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    A professional photo increases your chances of getting hired
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" value={profileData.firstName} onChange={handleInputChange} className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={profileData.lastName} onChange={handleInputChange} className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={profileData.email} onChange={handleInputChange} className="mt-1" disabled/>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={profileData.phone} onChange={handleInputChange} className="mt-1" placeholder="+91 9876543210"/>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address & Country */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><MapPin className="h-5 w-5 mr-2"/> Address</CardTitle>
              <CardDescription>Your location helps employers find workers in their area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" name="address" value={profileData.address} onChange={handleInputChange} className="mt-1" placeholder="123 Main Street"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={profileData.city} onChange={handleInputChange} className="mt-1" placeholder="Mumbai"/>
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select onValueChange={(value) => handleSelectChange("state", value)} value={profileData.state}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select state">{stateOptions.find(s => s.value === profileData.state)?.label || ""}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {stateOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input id="zipCode" name="zipCode" value={profileData.zipCode} onChange={handleInputChange} className="mt-1" placeholder="400001"/>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={(value) => handleSelectChange("country", value)} value={profileData.country}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country">{profileData.country}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Star className="h-5 w-5 mr-2"/> Professional Information</CardTitle>
              <CardDescription>Tell employers about your experience and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">About You</Label>
                <Textarea id="bio" name="bio" value={profileData.bio} onChange={handleInputChange} className="mt-1" rows={4} placeholder="Tell employers about yourself, your experience, and what makes you unique..."/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                    <Input id="hourlyRate" name="hourlyRate" type="number" value={profileData.hourlyRate} onChange={handleInputChange} className="pl-10" placeholder="20"/>
                  </div>
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select onValueChange={(value) => handleSelectChange("experience", value)} value={profileData.experience}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select experience">{profileData.experience}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">More than 10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select all the services you can provide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {serviceOptions.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox id={`service-${service}`} checked={profileData.services.includes(service)} onCheckedChange={() => handleCheckboxChange("services", service)}/>
                    <Label htmlFor={`service-${service}`} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2"/> Availability</CardTitle>
              <CardDescription>When are you available to work?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availabilityOptions.map(slot => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox id={`availability-${slot}`} checked={profileData.availability.includes(slot)} onCheckedChange={() => handleCheckboxChange("availability", slot)}/>
                    <Label htmlFor={`availability-${slot}`} className="text-sm">{slot}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages Spoken</CardTitle>
              <CardDescription>Select the languages you can communicate in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {languageOptions.map(lang => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox id={`lang-${lang}`} checked={profileData.languages.includes(lang)} onCheckedChange={() => handleCheckboxChange("languages", lang)}/>
                    <Label htmlFor={`lang-${lang}`} className="text-sm">{lang}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Info</CardTitle>
              <CardDescription>Optional details that increase your chances of being hired</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="transport" checked={profileData.hasTransportation} onCheckedChange={(v) => handleToggle("hasTransportation", v as boolean)}/>
                <Label htmlFor="transport" className="text-sm">Has Transportation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="references" checked={profileData.hasReferences} onCheckedChange={(v) => handleToggle("hasReferences", v as boolean)}/>
                <Label htmlFor="references" className="text-sm">Has References</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="background" checked={profileData.isBackgroundChecked} onCheckedChange={(v) => handleToggle("isBackgroundChecked", v as boolean)}/>
                <Label htmlFor="background" className="text-sm">Background Checked</Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2"/> {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfile;
