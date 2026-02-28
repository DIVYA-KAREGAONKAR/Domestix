import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api"; // ✅ Port 8002 connection
import { Building2, Phone, MapPin, ArrowLeft } from "lucide-react";

const EmployerProfile = () => {
 const { user, logout } = useAuth();
 const navigate = useNavigate();
 const [isSaving, setIsSaving] = useState(false);
 const [profile, setProfile] = useState({
 company_name: "",
 phone: "",
 address: ""
 });

 // 1. Fetch existing profile data
 useEffect(() => {
 const fetchProfile = async () => {
 try {
 const response = await api.get("/employer/profile/");
 setProfile(response.data);
 } catch (err) {
 console.error("Failed to load employer profile");
 }
 };
 fetchProfile();
 }, []);

 // 2. Save logic
 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSaving(true);
 try {
 // ✅ Matches EmployerProfile model fields exactly
 await api.put("/employer/profile/", profile); 
 toast({ title: "Profile Updated", description: "Company details saved." });
 } catch (err) {
 toast({ title: "Error", description: "Save failed", variant: "destructive" });
 } finally {
 setIsSaving(false);
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

 return (
 <div className="min-h-screen bg-app-bg py-10 px-4">
 <div className="max-w-2xl mx-auto space-y-6">
 <Link to="/employer/dashboard" className="flex items-center text-primary"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
 <Card>
 <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
 <CardContent>
 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <Label><Building2 className="inline h-4 w-4 mr-1"/> Company Name</Label>
 <Input value={profile.company_name} onChange={(e) => setProfile({...profile, company_name: e.target.value})} />
 </div>
 <div>
 <Label><Phone className="inline h-4 w-4 mr-1"/> Phone Number</Label>
 <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
 </div>
 <div>
 <Label><MapPin className="inline h-4 w-4 mr-1"/> Office Address</Label>
 <Input value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
 </div>
 <Button type="submit" className="w-full btn-primary" disabled={isSaving}>
 {isSaving ? "Saving..." : "Save Profile"}
 </Button>
 <Button type="button" variant="destructive" className="w-full" onClick={() => void handleDeactivateAccount()}>
 Deactivate Account
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 </div>
 );
};

export default EmployerProfile;
