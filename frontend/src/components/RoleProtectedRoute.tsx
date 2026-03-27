import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'doctor' | 'patient';
}

export const RoleProtectedRoute = ({ children, allowedRole }: RoleProtectedRouteProps) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Check role from publicMetadata
  const userRole = user.publicMetadata?.role as string | undefined;

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
