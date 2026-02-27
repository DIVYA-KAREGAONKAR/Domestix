// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppRole, roleDashboardPath, roleLoginPath } from "./lib/roles";
import React from "react";

const ProtectedRoute: React.FC<{ allowedRole: AppRole; children?: React.ReactNode }> = ({ allowedRole, children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("Access Check:", { 
    pathRole: allowedRole, 
    userRole: user?.role, 
    authenticated: isAuthenticated 
  });

  if (!isAuthenticated) {
    return <Navigate to={roleLoginPath(allowedRole)} replace />;
  }

  // ✅ AUTO-CORRECTION: If an employer tries to access worker routes, send them home
  if (user?.role !== allowedRole) {
    console.warn(`Role mismatch: Redirecting ${user?.role} to their dashboard`);
    return <Navigate to={roleDashboardPath(user?.role || "worker")} replace />;
  }

  return <>{children}</>;
};

// Page Imports
import Index from "./pages/Index";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerRegister from "./pages/WorkerRegister";
import EmployerLogin from "./pages/EmployerLogin";
import EmployerRegister from "./pages/EmployerRegister";
import WorkerDashboard from "./pages/WorkerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import WorkerProfile from "./pages/WorkerProfile";
import PostJob from "./pages/PostJob";
import NotFound from "./pages/NotFound";
import AgencyDashboard from "./pages/AgencyDashboard";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import SupportProviderDashboard from "./pages/SupportProviderDashboard";
import AgencyLogin from "./pages/AgencyLogin";
import GovernmentLogin from "./pages/GovernmentLogin";
import SupportProviderLogin from "./pages/SupportProviderLogin";
import AgencyRegister from "./pages/AgencyRegister";
import GovernmentRegister from "./pages/GovernmentRegister";
import SupportProviderRegister from "./pages/SupportProviderRegister";
import BrowseWorkers from "./pages/BrowseWorkers";
import BrowseJobs from "./pages/BrowseJobs";
import SupportServices from "./pages/SupportServices";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse-workers" element={<BrowseWorkers />} />
            <Route path="/browse-jobs" element={<BrowseJobs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Auth Routes */}
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route path="/worker/register" element={<WorkerRegister />} />
            <Route path="/employer/login" element={<EmployerLogin />} />
            <Route path="/employer/register" element={<EmployerRegister />} />
            <Route path="/agency/login" element={<AgencyLogin />} />
            <Route path="/agency/register" element={<AgencyRegister />} />
            <Route path="/government/login" element={<GovernmentLogin />} />
            <Route path="/government/register" element={<GovernmentRegister />} />
            <Route path="/support-provider/login" element={<SupportProviderLogin />} />
            <Route path="/support-provider/register" element={<SupportProviderRegister />} />

            {/* Worker Area */}
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute allowedRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/profile"
              element={
                <ProtectedRoute allowedRole="worker">
                  <WorkerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/support-services"
              element={
                <ProtectedRoute allowedRole="worker">
                  <SupportServices />
                </ProtectedRoute>
              }
            />

            {/* Employer Area */}
            <Route
              path="/employer/dashboard"
              element={
                <ProtectedRoute allowedRole="employer">
                  <EmployerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employer/post-job"
              element={
                <ProtectedRoute allowedRole="employer">
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employer/support-services"
              element={
                <ProtectedRoute allowedRole="employer">
                  <SupportServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agency/dashboard"
              element={
                <ProtectedRoute allowedRole="agency">
                  <AgencyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/government/dashboard"
              element={
                <ProtectedRoute allowedRole="government">
                  <GovernmentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support-provider/dashboard"
              element={
                <ProtectedRoute allowedRole="support_provider">
                  <SupportProviderDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
