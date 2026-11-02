import { useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { RoleGuide } from "@/components/layout/RoleGuide";

const baseLinks = [
  ["Dashboard", "/admin"],
  ["Reservations", "/admin/reservations"],
  ["Calendar", "/admin/calendar"],
  ["Inquiries", "/admin/inquiries"],
  ["Units", "/admin/units"],
  ["Guests", "/admin/guests"],
] as const;

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const isSuper = user?.role === "super_admin";
  const links = isSuper
    ? [
        ...baseLinks,
        ["Keywords", "/super/keywords"] as const,
        ["Booking rules", "/super/booking-rules"] as const,
        ["Accuracy test", "/tests/accuracy"] as const,
      ]
    : baseLinks;
  // Close the mobile menu after navigating.
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-control px-3 py-2.5 font-medium transition-colors duration-ui ease-ui ${isActive ? "bg-brand-light text-brand-dark" : "text-text-muted hover:bg-brand-light hover:text-brand"}`;
  const navItems = (
    <>
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} end={to === "/admin"} className={navClass}>
          {label}
        </NavLink>
      ))}
      {isSuper && (
        <NavLink to="/super/accounts" className={navClass}>
          Admin accounts
        </NavLink>
      )}
      <NavLink to="/admin/account" className={navClass}>
        My account
      </NavLink>
      <NavLink to="/help" className={navClass}>
        Help
      </NavLink>
    </>
  );

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-mist">
      <a
        href="#admin-content"
        className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-sticky flex min-h-16 items-center justify-between border-b border-border bg-surface px-4 py-2 lg:hidden">
        <Link
          to="/admin"
          className="whitespace-nowrap font-heading text-lg font-semibold text-brand-dark"
        >
          StaySync Admin
        </Link>
        <div className="flex items-center gap-3">
          <details ref={menuRef} className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden rounded-control px-3 py-2 font-medium text-brand">
              Menu
            </summary>
            <nav
              aria-label="Admin navigation"
              className="absolute right-0 top-12 z-dropdown flex min-w-56 flex-col gap-1 rounded-card border border-border bg-surface p-2 shadow-raised"
            >
              {navItems}
            </nav>
          </details>
          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-surface p-4 lg:block">
          <Link
            to="/admin"
            className="mb-6 block px-3 py-3 font-heading text-lg font-semibold text-brand-dark"
          >
            StaySync Admin
          </Link>
          <nav
            aria-label="Admin navigation"
            className="sticky top-5 flex flex-col gap-1"
          >
            {navItems}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </Button>
          </nav>
        </aside>
        <main id="admin-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <RoleGuide audience={isSuper ? "super_admin" : "admin"} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
