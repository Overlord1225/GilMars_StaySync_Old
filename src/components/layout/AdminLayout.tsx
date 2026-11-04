import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { useSignOut } from "@/components/layout/useSignOut";
import { BrandMark } from "@/components/ui/BrandMark";

const adminGroups = [
  { label: null, links: [["Dashboard", "/admin"]] },
  {
    label: "Operations",
    links: [
      ["Reservations", "/admin/reservations"],
      ["Calendar", "/admin/calendar"],
      ["Inquiries", "/admin/inquiries"],
    ],
  },
  {
    label: "Setup",
    links: [
      ["Units", "/admin/units"],
      ["Keywords", "/admin/keywords"],
      ["Booking rules", "/admin/booking-rules"],
    ],
  },
  {
    label: "People and tools",
    links: [
      ["Guests", "/admin/guests"],
      ["Accuracy test", "/tests/accuracy"],
    ],
  },
] as const;

const superGroups = [
  {
    label: null,
    links: [
      ["Dashboard", "/super"],
      ["Accounts", "/super/accounts"],
      ["Audit log", "/super/audit"],
    ],
  },
] as const;

export function AdminLayout() {
  const { user } = useAuth();
  const { signingOut, handleSignOut } = useSignOut();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const isSuper = user?.role === "super_admin";
  const home = isSuper ? "/super" : "/admin";
  const groups = isSuper ? superGroups : adminGroups;
  const role = isSuper ? "Owner" : "Admin";
  // Close the mobile menu after navigating.
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative block rounded-control px-3 py-2.5 font-medium lg:py-2 transition-colors duration-ui ease-ui ${isActive ? "bg-brand-light text-brand-dark before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-mango" : "text-text-muted hover:bg-brand-light hover:text-brand"}`;
  const navItems = (
    <>
      {groups.map((group, i) => (
        <div key={group.label ?? i} className="flex flex-col gap-1">
          {group.label && (
            <p className="mt-2 px-3 text-2xs font-semibold uppercase tracking-eyebrow text-text-muted">
              {group.label}
            </p>
          )}
          {group.links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === home} className={navClass}>
              {label}
            </NavLink>
          ))}
        </div>
      ))}
      <NavLink to={`${home}/account`} className={navClass}>
        My account
      </NavLink>
      <NavLink to="/help" className={navClass}>
        Help
      </NavLink>
      <NavLink to="/" end className={navClass}>
        View public site
      </NavLink>
    </>
  );

  return (
    <div className="min-h-dvh bg-mist">
      <a
        href="#admin-content"
        className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-sticky flex min-h-16 items-center justify-between border-b border-border bg-surface px-4 py-2 lg:hidden">
        <Link
          to={home}
          className="flex items-center gap-2 whitespace-nowrap font-heading text-lg font-semibold text-brand-dark"
        >
          <BrandMark className="h-8 w-auto" />
          StaySync{" "}
          <span className="font-sans text-sm font-medium text-text-muted">
            {role}
          </span>
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
            loading={signingOut}
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-surface p-4 lg:block">
          <Link
            to={home}
            className="mb-3 flex items-center gap-2 px-3 py-2 font-heading text-lg font-semibold text-brand-dark"
          >
            <BrandMark className="h-8 w-auto" />
            <span className="flex flex-col leading-tight">
              StaySync
              <span className="font-sans text-sm font-medium text-text-muted">
                {role}
              </span>
            </span>
          </Link>
          <nav
            aria-label="Admin navigation"
            className="sticky top-3 flex flex-col gap-0.5"
          >
            {navItems}
            <Button
              variant="outline"
              className="mt-4"
              loading={signingOut}
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </nav>
        </aside>
        <main
          id="admin-content"
          className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 [&_h1]:text-3xl sm:[&_h1]:text-4xl"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
