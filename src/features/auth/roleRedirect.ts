import type { UserRole } from "@/lib/types";

export type ProtectedRole = UserRole | "staff" | "any";

export function roleHome(role: UserRole): string {
  if (role === "super_admin") return "/super";
  return role === "guest" ? "/my-bookings" : "/admin";
}

export function canAccessRole(
  role: UserRole,
  allowedRoles: ProtectedRole[],
): boolean {
  return (
    allowedRoles.includes("any") ||
    allowedRoles.includes(role) ||
    (allowedRoles.includes("staff") &&
      (role === "admin" || role === "super_admin"))
  );
}

export function roleRedirect(role: UserRole, requestedPath?: string): string {
  if (
    !requestedPath ||
    requestedPath === "/login" ||
    requestedPath === "/register"
  ) {
    return roleHome(role);
  }
  if (/^\/super(\/|$)/.test(requestedPath)) {
    return role === "super_admin" ? requestedPath : roleHome(role);
  }
  if (/^\/tests(\/|$)/.test(requestedPath)) {
    return role === "admin" ? requestedPath : roleHome(role);
  }
  if (/^\/account(\/|$)/.test(requestedPath)) {
    if (role === "guest") return requestedPath;
    return role === "super_admin" ? "/super/account" : "/admin/account";
  }
  if (
    /^\/(my-bookings|my-inquiries|inquire|reservations)(\/|$)/.test(
      requestedPath,
    )
  ) {
    return role === "guest" ? requestedPath : roleHome(role);
  }
  if (requestedPath.startsWith("/admin")) {
    return role === "admin" ? requestedPath : roleHome(role);
  }
  return requestedPath;
}
