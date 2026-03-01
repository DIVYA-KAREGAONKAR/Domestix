import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { registerUser, loginUser } from "@/services/authService";
import api from "@/services/api";
import { normalizeRole, roleDashboardPath } from "@/lib/roles";
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const WorkerRegister = () => {
 const [formData, setFormData] = useState({
 first_name: "",
 last_name: "",
 email: "",
 password: "",
 confirmPassword: "", 
 phone: "",
 nationality: "",
 preferred_language: "",
 agreeToTerms: false,
 role: "worker", 
 });

 const [isLoading, setIsLoading] = useState(false);
 const [isSendingOtp, setIsSendingOtp] = useState(false);
 const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
 const [error, setError] = useState("");
 const [otpCode, setOtpCode] = useState("");
 const [otpSent, setOtpSent] = useState(false);
 const [otpVerifiedTargets, setOtpVerifiedTargets] = useState<{ email: string; phone: string }>({ email: "", phone: "" });
 const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
 const currentOtpTarget = otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim();
 const isCurrentChannelVerified = currentOtpTarget !== "" && (otpChannel === "email" ? otpVerifiedTargets.email === currentOtpTarget : otpVerifiedTargets.phone === currentOtpTarget);
 const { login } = useAuth();
 const navigate = useNavigate();

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const { name, value } = e.target;
 setFormData((prev) => ({ ...prev, [name]: value }));
 if (name === "email") {
 setOtpSent(false);
 setOtpCode("");
 setOtpVerifiedTargets((prev) => ({ ...prev, email: "" }));
 }
 if (name === "phone") {
 setOtpSent(false);
 setOtpCode("");
 setOtpVerifiedTargets((prev) => ({ ...prev, phone: "" }));
 }
 };

 const handleSendOtp = async () => {
 const target = otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim();
 if (!target) {
 setError(`Enter ${otpChannel} first to receive OTP.`);
 return;
 }
 setError("");
 setIsSendingOtp(true);
 try {
 const response = await api.post("/otp/send/", {
 channel: otpChannel,
 target,
 purpose: "registration",
 });
 setOtpSent(true);
 setOtpCode("");
 toast({
 title: "OTP sent",
 description: response.data?.otp
 ? `Use OTP: ${response.data.otp}`
 : `Check your ${otpChannel}/console for OTP.`,
 });
 } catch (err: any) {
 setError(err?.response?.data?.error || "Failed to send OTP.");
 } finally {
 setIsSendingOtp(false);
 }
 };

 const handleVerifyOtp = async () => {
 if (!otpCode.trim()) {
 setError("Enter OTP code.");
 return;
 }
 setError("");
 setIsVerifyingOtp(true);
 const target = otpChannel === "email" ? normalizeEmail(formData.email) : formData.phone.trim();
 try {
 await api.post("/otp/verify/", {
 channel: otpChannel,
 target,
 purpose: "registration",
 code: otpCode.trim(),
 });
 setOtpVerifiedTargets((prev) => ({ ...prev, [otpChannel]: target }));
 toast({ title: "OTP verified", description: `${otpChannel === "email" ? "Email" : "Phone"} verified successfully.` });
 } catch (err: any) {
 setError(err?.response?.data?.error || "Invalid OTP.");
 } finally {
 setIsVerifyingOtp(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 
 setError("");
 setIsLoading(true);

 // 1. Client-side Validations
 if (formData.password !== formData.confirmPassword) {
 setError("Passwords do not match. Please re-type them.");
 setIsLoading(false);
 return;
 }

 if (!formData.agreeToTerms) {
 setError("You must agree to the Terms and Conditions to continue.");
 setIsLoading(false);
 return;
 }
 const cleanEmail = normalizeEmail(formData.email);
 const cleanPhone = formData.phone.trim();
 if (otpVerifiedTargets.email !== cleanEmail || otpVerifiedTargets.phone !== cleanPhone) {
 setError("Please verify both Email OTP and Phone OTP before creating the account.");
 setIsLoading(false);
 return;
 }

 try {
 // 2. Register user on Aiven MySQL
 await registerUser({
 first_name: formData.first_name,
 last_name: formData.last_name,
 email: cleanEmail,
 password: formData.password,
 password2: formData.confirmPassword,
 role: formData.role,
 phone: cleanPhone,
 nationality: formData.nationality,
 preferred_language: formData.preferred_language,
 terms_accepted: true,
 privacy_accepted: true,
 });

 // 3. Log in automatically to get JWT tokens
 const data = await loginUser(cleanEmail, formData.password);

 const userRole = normalizeRole(data?.user?.role);
 const normalizedUser = { ...data.user, role: userRole };

 login(data.access, normalizedUser);

 // 4. Success feedback
 toast({
 title: "Account Created!",
 description: `Welcome, ${formData.first_name}! Taking you to your dashboard...`,
 });

 navigate(roleDashboardPath(userRole), { replace: true });

 } catch (err: any) {
 // 5. Dynamic Error Handling
 const serverErrors = err?.response?.data;
 
 let userFriendlyMsg = "Something went wrong. Please try again.";

 if (serverErrors?.email) {
 userFriendlyMsg = "This email is already registered. Try logging in instead.";
 } else if (serverErrors?.password) {
 userFriendlyMsg = "Password is too weak or does not meet requirements.";
 } else if (err?.message === "Network Error") {
 userFriendlyMsg = "Cannot connect to the server. Please check your internet.";
 } else if (serverErrors?.detail) {
 userFriendlyMsg = serverErrors.detail;
 }

 setError(userFriendlyMsg);
 toast({
 variant: "destructive",
 title: "Registration Failed",
 description: userFriendlyMsg,
 });
 
 } finally {
 setIsLoading(false); 
 }
 };

 return (
 <div className="min-h-screen bg-app-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-md w-full space-y-8">
 <div className="text-center">
 <Link to="/" className="inline-block">
 <h1 className="text-3xl font-bold text-primary">DomestyX</h1>
 </Link>
 <h2 className="mt-6 text-2xl font-bold text-app-text">Worker Registration</h2>
 <p className="mt-2 text-gray-600">Create your worker account</p>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Create your account</CardTitle>
 <CardDescription>Join our community of skilled domestic workers</CardDescription>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 {error && (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="first_name">First Name</Label>
 <Input id="first_name" name="first_name" required value={formData.first_name} onChange={handleInputChange} placeholder="John" />
 </div>
 <div>
 <Label htmlFor="last_name">Last Name</Label>
 <Input id="last_name" name="last_name" required value={formData.last_name} onChange={handleInputChange} placeholder="Doe" />
 </div>
 </div>

 <div>
 <Label htmlFor="email">Email address</Label>
 <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="worker@example.com" />
 </div>

 <div>
 <Label htmlFor="phone">Phone Number</Label>
 <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 123-4567" />
 </div>

 <div className="space-y-2 rounded-md border p-3">
 <div className="mb-2 flex gap-2">
 <Button type="button" size="sm" variant={otpChannel === "email" ? "default" : "outline"} onClick={() => setOtpChannel("email")}>Email OTP</Button>
 <Button type="button" size="sm" variant={otpChannel === "phone" ? "default" : "outline"} onClick={() => setOtpChannel("phone")}>Phone OTP</Button>
 </div>
 <div className="flex flex-col gap-2 sm:flex-row">
 <Input
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value)}
 placeholder="Enter OTP"
 disabled={!otpSent || isCurrentChannelVerified}
 />
 <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp || (otpChannel === "email" ? !formData.email : !formData.phone)}>
 {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
 </Button>
 <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otpSent || isCurrentChannelVerified}>
 {isVerifyingOtp ? "Verifying..." : isCurrentChannelVerified ? "Verified" : "Verify"}
 </Button>
 </div>
 {isCurrentChannelVerified && <p className="text-xs text-green-600">{otpChannel === "email" ? "Email" : "Phone"} OTP verified.</p>}
 <p className="text-xs text-gray-600">Email verified: {otpVerifiedTargets.email ? "Yes" : "No"} | Phone verified: {otpVerifiedTargets.phone ? "Yes" : "No"}</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="nationality">Nationality</Label>
 <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="Indian, Nepali, Filipino" />
 </div>
 <div>
 <Label htmlFor="preferred_language">Preferred Language</Label>
 <Input id="preferred_language" name="preferred_language" value={formData.preferred_language} onChange={handleInputChange} placeholder="English" />
 </div>
 </div>

 <div>
 <Label htmlFor="password">Password</Label>
 <Input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} placeholder="Enter your password" />
 </div>

 <div>
 <Label htmlFor="confirmPassword">Confirm Password</Label>
 <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm your password" />
 </div>

 <div className="flex items-center space-x-2">
 <Checkbox id="agreeToTerms" checked={formData.agreeToTerms} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToTerms: !!checked }))} />
 <Label htmlFor="agreeToTerms" className="text-sm">
 I agree to the <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
 </Label>
 </div>

 <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
 {isLoading ? "Creating Account..." : "Create Account"}
 </Button>
 </form>

 <div className="mt-6 text-center">
 <p className="text-sm text-gray-600">
 Already have an account? <Link to="/worker/login" className="text-primary hover:text-primary/80 font-medium">Sign in</Link>
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
};

export default WorkerRegister;
