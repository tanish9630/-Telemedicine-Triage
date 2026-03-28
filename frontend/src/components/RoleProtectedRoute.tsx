import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRole: 'doctor' | 'patient' | 'any';
}

export function RoleProtectedRoute({ children, allowedRole }: RoleProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still hydrating — show spinner, never redirect yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all — send to correct signup
  if (!user) {
    const dest = allowedRole === 'doctor' ? '/doctor/signup' : (allowedRole === 'patient' ? '/patient/signup' : '/');
    return <Navigate to={dest} state={{ from: location }} replace />;
  }

  // Logged in but wrong role — silently redirect to their own dashboard, no alert
  if (allowedRole !== 'any' && user.role !== allowedRole) {
    const dest = user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}
