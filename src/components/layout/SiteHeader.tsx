import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { headerLinks } from "@/components/layout/siteNav";
import { useSignOut } from "@/components/layout/useSignOut";
import { BrandMark } from "@/components/ui/BrandMark";

const desktopClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-3 text-sm font-medium transition-colors hover:bg-brand-light hover:text-brand ${isActive ? "bg-brand-light text-brand-dark" : "text-text-muted"}`;

const menuClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-control px-3 py-2.5 font-medium transition-colors ${isActive ? "bg-brand-light text-brand-dark" : "text-text-muted hover:bg-brand-light hover:text-brand"}`;

export function SiteHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { signingOut, handleSignOut } = useSignOut();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const role = user?.is_active && user.role ? user.role : null;
  const links = headerLinks(role);

  // Close the mobile menu after navigating.
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  const signOutButton = (
    <Button variant="outline" loading={signingOut} onClick={handleSignOut}>
      Sign out
    </Button>
  );

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="GilMars StaySync home"
          className="flex min-h-11 items-center gap-2 rounded-control"
        >
          <BrandMark className="h-9 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold text-brand-dark">
              GilMars
            </span>
            <span className="text-xs font-medium text-text-muted">
              StaySync
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end className={desktopClass}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {role ? (
            signOutButton
          ) : (
            <>
              <NavLink
                to="/login"
                className={`${desktopClass} hidden md:inline-flex`}
              >
                Sign in
              </NavLink>
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Create account
              </Link>
            </>
          )}
          <details ref={menuRef} className="relative md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-control px-3 py-2 font-medium text-brand [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-12 z-dropdown min-w-56 rounded-card border border-border bg-surface p-2 shadow-raised"
            >
              <ul className="flex flex-col gap-1">
                {[
                  ...links,
                  ...(role ? [] : [{ label: "Sign in", to: "/login" }]),
                ].map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end className={menuClass}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
