import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRole: 'doctor' | 'patient' | 'any';
}

export function RoleProtectedRoute({ children, allowedRole }: RoleProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setRedirect(allowedRole === 'doctor' ? '/doctor/signup' : (allowedRole === 'patient' ? '/patient/signup' : '/'));
      } else if (allowedRole !== 'any' && user.role !== allowedRole) {
        alert(`Access Denied: You are logged in as a ${user.role}, but the page '${location.pathname}' requires ${allowedRole} access. Redirecting...`);
        setRedirect('/');
      }
    }
  }, [user, loading, allowedRole, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (redirect) {
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  // Fallback while useEffect calculates redirect
  if (!user || (allowedRole !== 'any' && user.role !== allowedRole)) return null;

  return <>{children}</>;
}
