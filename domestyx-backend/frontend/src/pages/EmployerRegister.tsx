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

const EmployerRegister = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "", 
    phone: "",
    company_name: "",
    employer_type: "",
    address: "",
    job_location: "",
    preferred_language: "",
    agreeToTerms: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === "email") {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
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
      setOtpVerified(false);
      setOtpCode("");
      setOtpTarget(target);
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
      setOtpVerified(true);
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
    setError("");

    // Frontend validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }
    const cleanEmail = normalizeEmail(formData.email);
    const currentOtpTarget = otpChannel === "email" ? cleanEmail : formData.phone.trim();
    if (!otpVerified || otpTarget !== currentOtpTarget) {
      setError(`Please verify your ${otpChannel} OTP before creating the account.`);
      return;
    }

    setIsLoading(true);

    try {
      // ✅ 1. Register the user
      // Note: we map 'confirmPassword' to 'password2' to match your Django Serializer
      await registerUser({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: cleanEmail,
        password: formData.password,
        password2: formData.confirmPassword,
        role: "employer",
        phone: formData.phone,
        company_name: formData.company_name,
        employer_type: formData.employer_type,
        address: formData.address,
        job_location: formData.job_location,
        preferred_language: formData.preferred_language,
        terms_accepted: true,
        privacy_accepted: true,
      });

      // ✅ 2. Automatically login after successful registration
      const authData = await loginUser(cleanEmail, formData.password);
      
      // ✅ 3. Update Auth Context
      const userRole = normalizeRole(authData?.user?.role);
      login(authData.access, { ...authData.user, role: userRole });
      
      toast({
        title: "Registration Successful",
        description: "Welcome to DomestyX!",
      });

      navigate(roleDashboardPath(userRole), { replace: true });
    } catch (err: any) {
      console.error("Registration failed:", err.response?.data);
      
      // ✅ 4. Extract specific error messages from Django (e.g., email exists, weak password)
      const serverErrors = err.response?.data;
      if (serverErrors) {
        // Get the first error message from the object
        const firstKey = Object.keys(serverErrors)[0];
        const msg = Array.isArray(serverErrors[firstKey]) ? serverErrors[firstKey][0] : serverErrors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">DomestyX</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900">Employer Registration</h2>
          <p className="mt-2 text-slate-600">Create a trusted hiring account for workforce needs</p>
        </div>

        <Card className="glass-card border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>
              Join our community of trusted employers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                />
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
                    disabled={!otpSent || otpVerified}
                  />
                  <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp || (otpChannel === "email" ? !formData.email : !formData.phone)}>
                    {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                  <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otpSent || otpVerified}>
                    {isVerifyingOtp ? "Verifying..." : otpVerified ? "Verified" : "Verify"}
                  </Button>
                </div>
                {otpVerified && <p className="text-xs text-green-600">{otpChannel === "email" ? "Email" : "Phone"} OTP verified.</p>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employer_type">Employer Type</Label>
                  <Input
                    id="employer_type"
                    name="employer_type"
                    type="text"
                    value={formData.employer_type}
                    onChange={handleInputChange}
                    placeholder="individual / business / company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+971..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Employer address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_location">Job Location</Label>
                  <Input
                    id="job_location"
                    name="job_location"
                    type="text"
                    value={formData.job_location}
                    onChange={handleInputChange}
                    placeholder="City / Region"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Input
                    id="preferred_language"
                    name="preferred_language"
                    type="text"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                    placeholder="English / Arabic / Hindi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="agreeToTerms" className="text-xs text-slate-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Register as Employer"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center space-y-2">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/employer/login" className="text-primary hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Are you looking for work?{" "}
                <Link to="/worker/register" className="text-slate-700 hover:underline font-medium">
                  Register as a Worker
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerRegister;
