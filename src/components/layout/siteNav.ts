import type { UserRole } from "@/lib/types";

export type NavLinkItem = { label: string; to: string };

const explore: NavLinkItem[] = [
  { label: "Stays", to: "/units" },
  { label: "Help", to: "/help" },
];

// Links shown for the signed-in role (or signed out when role is null).
export function accountLinks(role: UserRole | null): NavLinkItem[] {
  if (role === "guest") {
    return [
      { label: "My reservations", to: "/my-bookings" },
      { label: "My inquiries", to: "/my-inquiries" },
      { label: "Ask a question", to: "/inquire" },
      { label: "Account", to: "/account" },
    ];
  }
  if (role === "admin") {
    return [
      { label: "Workspace", to: "/admin" },
      { label: "Account", to: "/admin/account" },
    ];
  }
  if (role === "super_admin") {
    return [
      { label: "Owner dashboard", to: "/super" },
      { label: "Account", to: "/super/account" },
    ];
  }
  return [
    { label: "Sign in", to: "/login" },
    { label: "Create account", to: "/register" },
  ];
}

export function headerLinks(role: UserRole | null): NavLinkItem[] {
  return [...explore, ...(role ? accountLinks(role) : [])];
}

export { explore as exploreLinks };
