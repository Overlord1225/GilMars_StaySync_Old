import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { canAccessRole, roleHome, type ProtectedRole } from './roleRedirect'

export function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4" aria-live="polite" aria-busy="true">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm" aria-hidden="true">
        <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
      <span className="sr-only">Loading your account</span>
    </main>
  )
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles: ProtectedRole[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!user.is_active || !user.role) {
    return <Navigate to="/login" replace state={{ message: 'Your account is inactive or still being provisioned.' }} />
  }
  if (!canAccessRole(user.role, allowedRoles)) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <Outlet />
}
