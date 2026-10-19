import type { UserRole } from '@/lib/types'

export type ProtectedRole = UserRole | 'staff' | 'any'

export function roleHome(role: UserRole): string {
  return role === 'guest' ? '/' : '/admin'
}

export function canAccessRole(role: UserRole, allowedRoles: ProtectedRole[]): boolean {
  return allowedRoles.includes('any') || allowedRoles.includes(role) ||
    (allowedRoles.includes('staff') && (role === 'admin' || role === 'super_admin'))
}

export function roleRedirect(role: UserRole, requestedPath?: string): string {
  if (!requestedPath || requestedPath === '/login' || requestedPath === '/register') {
    return roleHome(role)
  }
  if (requestedPath.startsWith('/super/')) {
    return role === 'super_admin' ? requestedPath : roleHome(role)
  }
  if (requestedPath === '/super') {
    return role === 'super_admin' ? requestedPath : roleHome(role)
  }
  if (requestedPath.startsWith('/admin')) {
    return role === 'guest' ? '/' : requestedPath
  }
  return requestedPath
}
