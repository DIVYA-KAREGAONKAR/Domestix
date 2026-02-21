
// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useAuth } from "@/contexts/AuthContext";
// import { toast } from "@/hooks/use-toast";

// const EmployerRegister = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     phone: "",
//     company: "",
//     agreeToTerms: false
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
  
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");

//     // Validation
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       setIsLoading(false);
//       return;
//     }

//     if (!formData.agreeToTerms) {
//       setError("Please agree to the terms and conditions");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       // TODO: Replace with actual API call
//       const response = await fetch('/api/auth/register/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           first_name: formData.firstName,
//           last_name: formData.lastName,
//           email: formData.email,
//           password: formData.password,
//           phone: formData.phone,
//           company: formData.company,
//           is_worker: false,
//           is_employer: true
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         login(data.access, data.user);
//         toast({
//           title: "Registration Successful",
//           description: "Welcome to DomestyX! Start posting jobs now.",
//         });
//         navigate('/employer/dashboard');
//       } else {
//         const errorData = await response.json();
//         setError(errorData.message || 'Registration failed');
//       }
//     } catch (err) {
//       console.log('Registration attempt:', formData);
//       // For demo purposes, simulate successful registration
//       login('demo-token', {
//         id: 2,
//         email: formData.email,
//         first_name: formData.firstName,
//         last_name: formData.lastName,
//         is_worker: false,
//         is_employer: true
//       });
//       toast({
//         title: "Demo Registration Successful",
//         description: "Welcome to DomestyX! Start posting jobs now.",
//       });
//       navigate('/employer/dashboard');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-app-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <Link to="/" className="inline-block">
//             <h1 className="text-3xl font-bold text-primary">DomestyX</h1>
//           </Link>
//           <h2 className="mt-6 text-2xl font-bold text-app-text">Client Registration</h2>
//           <p className="mt-2 text-gray-600">Create your Client account</p>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>Create your account</CardTitle>
//             <CardDescription>
//               Join our platform to find skilled domestic workers
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {error && (
//                 <Alert variant="destructive">
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="firstName">First Name</Label>
//                   <Input
//                     id="firstName"
//                     name="firstName"
//                     type="text"
//                     required
//                     value={formData.firstName}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     placeholder="Jane"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="lastName">Last Name</Label>
//                   <Input
//                     id="lastName"
//                     name="lastName"
//                     type="text"
//                     required
//                     value={formData.lastName}
//                     onChange={handleInputChange}
//                     className="mt-1"
//                     placeholder="Smith"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="email">Email address</Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   required
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   placeholder="employer@example.com"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="phone">Phone Number</Label>
//                 <Input
//                   id="phone"
//                   name="phone"
//                   type="tel"
//                   required
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   placeholder="+1 (555) 123-4567"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="company">Company/Household Name (Optional)</Label>
//                 <Input
//                   id="company"
//                   name="company"
//                   type="text"
//                   value={formData.company}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   placeholder="Smith Family"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="password">Password</Label>
//                 <Input
//                   id="password"
//                   name="password"
//                   type="password"
//                   required
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   placeholder="Enter your password"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="confirmPassword">Confirm Password</Label>
//                 <Input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   required
//                   value={formData.confirmPassword}
//                   onChange={handleInputChange}
//                   className="mt-1"
//                   placeholder="Confirm your password"
//                 />
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="agreeToTerms"
//                   checked={formData.agreeToTerms}
//                   onCheckedChange={(checked) => 
//                     setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
//                   }
//                 />
//                 <Label htmlFor="agreeToTerms" className="text-sm">
//                   I agree to the{" "}
//                   <Link to="/terms" className="text-primary hover:underline">
//                     Terms and Conditions
//                   </Link>
//                 </Label>
//               </div>

//               <Button
//                 type="submit"
//                 className="w-full btn-primary"
//                 disabled={isLoading}
//               >
//                 {isLoading ? "Creating Account..." : "Create Account"}
//               </Button>
//             </form>

//             <div className="mt-6 text-center">
//               <p className="text-sm text-gray-600">
//                 Already have an account?{" "}
//                 <Link
//                   to="/employer/login"
//                   className="text-primary hover:text-primary/80 font-medium"
//                 >
//                   Sign in
//                 </Link>
//               </p>
//               <p className="mt-2 text-sm text-gray-600">
//                 Are you a worker?{" "}
//                 <Link
//                   to="/worker/register"
//                   className="text-accent hover:text-accent/80 font-medium"
//                 >
//                   Worker Registration
//                 </Link>
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default EmployerRegister;
// frontend/src/pages/EmployerRegister.tsx
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

const EmployerRegister = () => {
  const [formData, setFormData] = useState({
    // Changed to snake_case to match Django serializer and WorkerRegister for consistency
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "", // This maps to password2 on backend
    phone: "",
    company: "", // Keep for frontend input, but won't be sent to Django backend CustomUser directly
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // src/pages/EmployerRegister.tsx

// WorkerRegister.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }
  try {
    await registerUser({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      password2: formData.confirmPassword,
      role: "employer",
    });
    const data = await loginUser(formData.email, formData.password);
    login(data.access, data.user);
    navigate("/employer/dashboard");
  } catch (err: any) {
    setError("Registration failed.");
  }
};


  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">DomestyX</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-app-text">Client Registration</h2>
          <p className="mt-2 text-gray-600">Create your Client account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Join our platform to find skilled domestic workers
            </CardDescription>
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
                  <Label htmlFor="first_name">First Name</Label> {/* Now snake_case */}
                  <Input
                    id="first_name"
                    name="first_name" // Now snake_case
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label> {/* Now snake_case */}
                  <Input
                    id="last_name"
                    name="last_name" // Now snake_case
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="employer@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="company">Company/Household Name (Optional)</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Smith Family"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="agreeToTerms" className="text-sm">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/employer/login"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign in
                </Link>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Are you a worker?{" "}
                <Link
                  to="/worker/register"
                  className="text-accent hover:text-accent/80 font-medium"
                >
                  Worker Registration
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