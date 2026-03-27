import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRole: 'doctor' | 'patient';
}

export function RoleProtectedRoute({ children, allowedRole }: RoleProtectedRouteProps) {
  const { user, loading } = useAuth();

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

  if (!user) {
    // Redirect to the correct auth page based on which dashboard they tried to access
    return <Navigate to={allowedRole === 'doctor' ? '/doctor/signup' : '/patient/signup'} replace />;
  }

  if (user.role !== allowedRole) {
    // Wrong role — redirect to landing page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
