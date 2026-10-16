import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../lib/types';

type Role = UserRole | 'any';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: Role[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.is_active) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, message: 'Your account is inactive. Please contact support.' }}
      />
    );
  }

  const hasRole =
    allowedRoles.includes('any') ||
    (user.role !== null && allowedRoles.includes(user.role));

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}