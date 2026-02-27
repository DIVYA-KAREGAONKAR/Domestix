import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { loginUser } from "@/services/authService";
import { normalizeRole } from "@/lib/roles";

const AgencyLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      const role = normalizeRole(data?.user?.role);
      if (role !== "agency") {
        setError("This account is not registered as an agency.");
        return;
      }
      login(data.access, { ...data.user, role });
      toast({ title: "Login Successful", description: "Welcome back." });
      navigate("/agency/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center py-10">
      <div className="page-wrap">
        <Card className="glass-card mx-auto w-full max-w-lg border-slate-200">
          <CardHeader>
            <Link to="/" className="text-sm text-slate-500 hover:text-primary">Back to Home</Link>
            <CardTitle className="text-2xl font-semibold">Agency Login</CardTitle>
            <CardDescription>Access worker submission and agency workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full btn-primary" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign in"}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-600">
              No account yet? <Link to="/agency/register" className="text-primary">Create agency account</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyLogin;
