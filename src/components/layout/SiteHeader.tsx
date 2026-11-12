import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/buttonStyles";
import {
  accountLinks,
  exploreLinks,
  headerLinks,
} from "@/components/layout/siteNav";
import { useDismissDetails } from "@/components/layout/useDismissDetails";
import { useSignOut } from "@/components/layout/useSignOut";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

const desktopClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-ui ease-ui ${isActive ? "bg-brand-light text-brand-dark" : "text-ink-muted hover:bg-brand-light hover:text-brand-dark"}`;

const menuClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-control px-3 py-2.5 font-medium transition-colors duration-ui ease-ui ${isActive ? "bg-brand-light text-brand-dark" : "text-ink-muted hover:bg-brand-light hover:text-brand-dark"}`;

const summaryClass =
  "flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border border-rule-strong px-4 py-2 text-sm font-semibold text-brand-dark transition-colors duration-ui ease-ui hover:border-brand hover:bg-brand-light [&::-webkit-details-marker]:hidden";

const chevron = (
  <svg
    aria-hidden="true"
    viewBox="0 0 12 12"
    className="size-3 fill-none stroke-current stroke-[1.5]"
  >
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
);

const panelClass =
  "absolute right-0 top-12 z-dropdown min-w-56 rounded-card border border-rule bg-surface p-2 shadow-raised";

export function SiteHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { signingOut, handleSignOut } = useSignOut();
  const mobileRef = useRef<HTMLDetailsElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const role = user?.is_active && user.role ? user.role : null;

  useDismissDetails([mobileRef, accountRef]);

  // Close menus after navigating.
  useEffect(() => {
    mobileRef.current?.removeAttribute("open");
    accountRef.current?.removeAttribute("open");
  }, [pathname]);

  const signOutButton = (
    <Button
      variant="outline"
      className="mt-1 w-full"
      loading={signingOut}
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );

  return (
    <header className="sticky top-0 z-sticky border-b border-rule bg-paper">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="GilMars StaySync home"
          className="flex min-h-11 items-center gap-2.5 rounded-control"
        >
          <BrandMark className="h-8 w-auto" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-xl font-medium text-brand-dark">
              GilMars
            </span>
            <span className="mt-1 text-2xs font-semibold uppercase tracking-eyebrow text-ink-muted">
              StaySync
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {exploreLinks.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end className={desktopClass}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitch />
          {role ? (
            <details ref={accountRef} className="relative hidden md:block">
              <summary className={summaryClass}>
                Account
                {chevron}
              </summary>
              <nav aria-label="Account navigation" className={panelClass}>
                <ul className="flex flex-col gap-1">
                  {accountLinks(role).map((l) => (
                    <li key={l.to}>
                      <NavLink to={l.to} end className={menuClass}>
                        {l.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                {signOutButton}
              </nav>
            </details>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`${desktopClass} hidden md:inline-flex`}
              >
                Sign in
              </NavLink>
              <span className="hidden sm:block">
                <Link to="/register" className={buttonClass("primary")}>
                  Create account
                </Link>
              </span>
            </>
          )}
          <details ref={mobileRef} className="relative md:hidden">
            <summary className={summaryClass}>
              Menu
              {chevron}
            </summary>
            <nav aria-label="Mobile navigation" className={panelClass}>
              <ul className="flex flex-col gap-1">
                {[
                  ...headerLinks(role),
                  ...(role
                    ? []
                    : [
                        { label: "Sign in", to: "/login" },
                        { label: "Create account", to: "/register" },
                      ]),
                ].map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end className={menuClass}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {role && signOutButton}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
