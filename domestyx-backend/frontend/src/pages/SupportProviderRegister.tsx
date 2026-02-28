import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { registerUser, loginUser } from "@/services/authService";
import api from "@/services/api";
import { normalizeRole, roleDashboardPath } from "@/lib/roles";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const SupportProviderRegister = () => {
 const [formData, setFormData] = useState({
 first_name: "",
 last_name: "",
 email: "",
 phone: "",
 password: "",
 confirmPassword: "",
 support_company_name: "",
 support_service_categories: "",
 support_contact_information: "",
 agreeToTerms: false,
 });
 const [isLoading, setIsLoading] = useState(false);
 const [isSendingOtp, setIsSendingOtp] = useState(false);
 const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
 const [error, setError] = useState("");
 const [otpCode, setOtpCode] = useState("");
 const [otpSent, setOtpSent] = useState(false);
 const [otpVerified, setOtpVerified] = useState(false);
 const [otpVerifiedTargets, setOtpVerifiedTargets] = useState<{ email: string; phone: string }>({ email: "", phone: "" });
 const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
 const { login } = useAuth();
 const navigate = useNavigate();

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const { name, value } = e.target;
 setFormData((prev) => ({ ...prev, [name]: value }));
 if (name === "email" || name === "phone") {
 setOtpSent(false);
 setOtpVerified(false);
 setOtpCode("");
 if (name === "email") setOtpVerifiedTargets((prev) => ({ ...prev, email: "" }));
 if (name === "phone") setOtpVerifiedTargets((prev) => ({ ...prev, phone: "" }));
 }
 };

 const handleSendOtp = async () => {
 const target = otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim();
 if (!target) return setError(`Enter ${otpChannel} first to receive OTP.`);
 setError("");
 setIsSendingOtp(true);
 try {
 const response = await api.post("/otp/send/", { channel: otpChannel, target, purpose: "registration" });
 setOtpSent(true);
 setOtpVerified(false);
 setOtpCode("");
 toast({ title: "OTP sent", description: response.data?.otp ? `Use OTP: ${response.data.otp}` : `Check your ${otpChannel}/console for OTP.` });
 } catch (err: any) {
 setError(err?.response?.data?.error || "Failed to send OTP.");
 } finally {
 setIsSendingOtp(false);
 }
 };

 const handleVerifyOtp = async () => {
 if (!otpCode.trim()) return setError("Enter OTP code.");
 setError("");
 setIsVerifyingOtp(true);
 try {
 await api.post("/otp/verify/", {
 channel: otpChannel,
 target: otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim(),
 purpose: "registration",
 code: otpCode.trim(),
 });
 setOtpVerified(true);
 setOtpVerifiedTargets((prev) => ({ ...prev, [otpChannel]: otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim() }));
 toast({ title: "OTP verified", description: `${otpChannel === "email" ? "Email" : "Phone"} verified successfully.` });
 } catch (err: any) {
 setOtpVerified(false);
 setError(err?.response?.data?.error || "Invalid OTP.");
 } finally {
 setIsVerifyingOtp(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const cleanEmail = normalizeEmail(formData.email);
 if (formData.password !== formData.confirmPassword) return setError("Passwords do not match.");
 if (!formData.agreeToTerms) return setError("You must agree to the terms.");
 if (otpVerifiedTargets.email !== cleanEmail || otpVerifiedTargets.phone !== formData.phone.trim()) {
 return setError("Please verify both Email OTP and Phone OTP before creating the account.");
 }

 setError("");
 setIsLoading(true);
 try {
 await registerUser({
 first_name: formData.first_name,
 last_name: formData.last_name,
 email: cleanEmail,
 password: formData.password,
 password2: formData.confirmPassword,
 phone: formData.phone,
 role: "support_provider",
 support_company_name: formData.support_company_name,
 support_service_categories: formData.support_service_categories.split(",").map((s) => s.trim()).filter(Boolean),
 support_contact_information: formData.support_contact_information,
 terms_accepted: true,
 privacy_accepted: true,
 });
 const data = await loginUser(cleanEmail, formData.password);
 const role = normalizeRole(data?.user?.role);
 login(data.access, { ...data.user, role });
 toast({ title: "Registration Successful", description: "Support provider account created." });
 navigate(roleDashboardPath(role), { replace: true });
 } catch (err: any) {
 const serverErrors = err.response?.data;
 const firstKey = serverErrors ? Object.keys(serverErrors)[0] : null;
 const msg = firstKey ? (Array.isArray(serverErrors[firstKey]) ? serverErrors[firstKey][0] : serverErrors[firstKey]) : "Registration failed.";
 setError(msg);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 flex items-center py-10">
 <div className="max-w-7xl mx-auto px-4">
 <Card className="mx-auto w-full max-w-xl shadow-lg border-0 bg-white">
 <CardHeader>
 <CardTitle className="text-2xl">Support Provider Registration</CardTitle>
 <CardDescription>Create support service provider credentials.</CardDescription>
 </CardHeader>
 <CardContent>
 <form className="space-y-4" onSubmit={handleSubmit}>
 {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
 <div className="grid grid-cols-2 gap-3">
 <div><Label>First Name</Label><Input name="first_name" value={formData.first_name} onChange={handleInputChange} required /></div>
 <div><Label>Last Name</Label><Input name="last_name" value={formData.last_name} onChange={handleInputChange} required /></div>
 </div>
 <div><Label>Email</Label><Input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
 <div><Label>Phone (for phone OTP)</Label><Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+9715..." /></div>
 <div className="space-y-2 rounded-md border p-3">
 <div className="mb-2 flex gap-2">
 <Button type="button" size="sm" variant={otpChannel === "email" ? "default" : "outline"} onClick={() => setOtpChannel("email")}>Email OTP</Button>
 <Button type="button" size="sm" variant={otpChannel === "phone" ? "default" : "outline"} onClick={() => setOtpChannel("phone")}>Phone OTP</Button>
 </div>
 <div className="flex flex-col gap-2 sm:flex-row">
 <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter OTP" disabled={!otpSent || otpVerified} />
 <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp || (otpChannel === "email" ? !formData.email : !formData.phone)}>{isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}</Button>
 <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otpSent || otpVerified}>{isVerifyingOtp ? "Verifying..." : otpVerified ? "Verified" : "Verify"}</Button>
 </div>
 {otpVerified && <p className="text-xs text-green-600">{otpChannel === "email" ? "Email" : "Phone"} OTP verified.</p>}
 <p className="text-xs text-gray-600">Email verified: {otpVerifiedTargets.email ? "Yes" : "No"} | Phone verified: {otpVerifiedTargets.phone ? "Yes" : "No"}</p>
 </div>
 <div><Label>Company Name</Label><Input name="support_company_name" value={formData.support_company_name} onChange={handleInputChange} /></div>
 <div><Label>Service Categories (comma separated)</Label><Input name="support_service_categories" value={formData.support_service_categories} onChange={handleInputChange} placeholder="maintenance, training, legal" /></div>
 <div><Label>Contact Information</Label><Input name="support_contact_information" value={formData.support_contact_information} onChange={handleInputChange} /></div>
 <div><Label>Password</Label><Input type="password" name="password" value={formData.password} onChange={handleInputChange} required /></div>
 <div><Label>Confirm Password</Label><Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required /></div>
 <div className="flex items-center space-x-2">
 <Checkbox id="agreeToTerms" checked={formData.agreeToTerms} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToTerms: !!checked }))} />
 <Label htmlFor="agreeToTerms" className="text-sm">I agree to the <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></Label>
 </div>
 <Button className="w-full btn-primary" disabled={isLoading}>{isLoading ? "Creating..." : "Create Support Provider Account"}</Button>
 </form>
 <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link to="/support-provider/login" className="text-primary">Sign in</Link></p>
 </CardContent>
 </Card>
 </div>
 </div>
 );
};

export default SupportProviderRegister;
