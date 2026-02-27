import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole, roleLoginPath } from "@/lib/roles";

interface ProtectedRouteProps {
  allowedRole: AppRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={roleLoginPath(allowedRole)} replace />;
  }

  if (user?.role !== allowedRole) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
