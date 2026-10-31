import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './useAuth'
import { AuthLoading } from './ProtectedRoute'
import { canAccessRole, roleHome, type ProtectedRole } from './roleRedirect'

export function RoleRoute({ children, role, fallback }: {
  children: ReactNode
  role: ProtectedRole
  fallback?: string
}) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!user.is_active || !user.role) return <Navigate to="/login" replace />
  if (!canAccessRole(user.role, [role])) {
    return <Navigate to={fallback ?? roleHome(user.role)} replace />
  }
  return <>{children}</>
}
