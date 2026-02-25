// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import React from "react";

const ProtectedRoute: React.FC<{ allowedRole: "worker" | "employer"; children?: React.ReactNode }> = ({ allowedRole, children }) => {
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
    return <Navigate to={`/${allowedRole}/login`} replace />;
  }

  // ✅ AUTO-CORRECTION: If an employer tries to access worker routes, send them home
  if (user?.role !== allowedRole) {
    console.warn(`Role mismatch: Redirecting ${user?.role} to their dashboard`);
    return <Navigate to={`/${user?.role}/dashboard`} replace />;
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
            
            {/* Auth Routes */}
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route path="/worker/register" element={<WorkerRegister />} />
            <Route path="/employer/login" element={<EmployerLogin />} />
            <Route path="/employer/register" element={<EmployerRegister />} />

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

            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;