import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BadgeCheck, Globe2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { loginUser } from "@/services/authService";
import { normalizeRole } from "@/lib/roles";
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const WorkerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const cleanEmail = normalizeEmail(email);
      const data = await loginUser(cleanEmail, password);
      const userRole = normalizeRole(data?.user?.role);

      if (userRole !== "worker") {
        setError("This account is registered as an employer. Please use Employer Login.");
        return;
      }

      login(data.access, { ...data.user, role: userRole });
      toast({ title: "Login Successful", description: "Welcome back." });
      navigate("/worker/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center py-10">
      <div className="page-wrap grid gap-6 lg:grid-cols-5">
        <div className="glass-card hidden p-8 lg:col-span-2 lg:block">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Worker Portal</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900">Access better opportunities with a professional workflow</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Keep your profile updated with skills, availability, and documents to improve shortlist visibility.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Verified profile trust signals</div>
            <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /> International-ready profile details</div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card className="glass-card mx-auto w-full max-w-lg border-slate-200">
            <CardHeader className="space-y-2">
              <Link to="/" className="text-sm text-slate-500 hover:text-primary">Back to Home</Link>
              <CardTitle className="text-2xl font-semibold">Worker Login</CardTitle>
              <CardDescription>Sign in to manage your profile and job applications.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                </div>
                <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-4 text-sm text-slate-600">
                <p>
                  New worker? <Link to="/worker/register" className="font-medium text-primary hover:underline">Create account</Link>
                </p>
                <p className="mt-1">
                  Employer account? <Link to="/employer/login" className="font-medium text-accent hover:underline">Employer Login</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;
