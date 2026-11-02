import type { UserRole } from "@/lib/types";

export type ProtectedRole = UserRole | "staff" | "any";

export function roleHome(role: UserRole): string {
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
  if (/^\/(super|tests)(\/|$)/.test(requestedPath)) {
    return role === "super_admin" ? requestedPath : roleHome(role);
  }
  if (/^\/account(\/|$)/.test(requestedPath)) {
    return role === "guest" ? requestedPath : "/admin/account";
  }
  if (
    /^\/(my-bookings|my-inquiries|inquire|reservations)(\/|$)/.test(
      requestedPath,
    )
  ) {
    return role === "guest" ? requestedPath : roleHome(role);
  }
  if (requestedPath.startsWith("/admin")) {
    return role === "guest" ? roleHome(role) : requestedPath;
  }
  return requestedPath;
}
