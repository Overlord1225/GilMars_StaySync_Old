import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { UserRole } from '../../lib/types';

type RoleRouteProps = {
  children: React.ReactNode;
  role: UserRole;
  fallback?: string;
};

export function RoleRoute({ children, role, fallback }: RoleRouteProps) {
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

  if (user.role !== role) {
    const to = fallback || (role === 'admin' || role === 'super_admin' ? '/admin' : '/');
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
