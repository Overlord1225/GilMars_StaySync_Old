import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { useDismissDetails } from "@/components/layout/useDismissDetails";
import { useSignOut } from "@/components/layout/useSignOut";
import { BrandMark } from "@/components/ui/BrandMark";
import { Modal } from "@/components/ui/Modal";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { useAdminShortcuts } from "@/hooks/useAdminShortcuts";

type NavGroup = {
  label: string | null;
  collapsible?: boolean;
  links: readonly (readonly [string, string])[];
};

// Daily work stays visible; rarely changed setup is folded into one group.
const adminGroups: readonly NavGroup[] = [
  {
    label: null,
    links: [
      ["Dashboard", "/admin"],
      ["Reservations", "/admin/reservations"],
      ["Calendar", "/admin/calendar"],
      ["Inquiries", "/admin/inquiries"],
      ["Guests", "/admin/guests"],
      ["Search", "/admin/search"],
    ],
  },
  {
    label: "Setup",
    collapsible: true,
    links: [
      ["Units", "/admin/units"],
      ["Booking rules", "/admin/booking-rules"],
      ["Keywords", "/admin/keywords"],
      ["Accuracy test", "/admin/accuracy"],
    ],
  },
];

// `g` then the key goes to the page. Keep in step with the nav above.
const adminShortcuts = {
  d: "/admin",
  r: "/admin/reservations",
  c: "/admin/calendar",
  i: "/admin/inquiries",
  g: "/admin/guests",
  s: "/admin/search",
};
const superShortcuts = { d: "/super", a: "/super/accounts", l: "/super/audit" };

const superGroups: readonly NavGroup[] = [
  {
    label: null,
    links: [
      ["Dashboard", "/super"],
      ["Accounts", "/super/accounts"],
      ["Audit log", "/super/audit"],
    ],
  },
];

export function AdminLayout() {
  const { user } = useAuth();
  const { signingOut, handleSignOut } = useSignOut();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDismissDetails([menuRef]);
  const isSuper = user?.role === "super_admin";
  const home = isSuper ? "/super" : "/admin";
  const groups = isSuper ? superGroups : adminGroups;
  const role = isSuper ? "Owner" : "Admin";
  const shortcuts = isSuper ? superShortcuts : adminShortcuts;
  const { helpOpen, setHelpOpen } = useAdminShortcuts(shortcuts);
  // Close the mobile menu after navigating.
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative block rounded-control px-3 py-2.5 font-medium lg:py-2 transition-colors duration-ui ease-ui ${isActive ? "bg-brand-light text-brand-dark before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-mango" : "text-ink-muted hover:bg-brand-light hover:text-brand"}`;
  const links = (group: NavGroup) =>
    group.links.map(([label, to]) => (
      <NavLink key={to} to={to} end={to === home} className={navClass}>
        {label}
      </NavLink>
    ));
  const navItems = (
    <>
      {groups.map((group, i) =>
        group.collapsible ? (
          <details
            // Remount so the group opens when navigating into it.
            key={`${group.label}-${group.links.some(([, to]) => pathname.startsWith(to))}`}
            open={group.links.some(([, to]) => pathname.startsWith(to))}
            className="group mt-2 border-t border-rule pt-2"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-control px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-brand [&::-webkit-details-marker]:hidden">
              {group.label}
              <span aria-hidden="true" className="group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="mt-1 flex flex-col gap-0.5">{links(group)}</div>
          </details>
        ) : (
          <div key={i} className="flex flex-col gap-0.5">
            {links(group)}
          </div>
        ),
      )}
    </>
  );
  const utilityClass =
    "flex min-h-11 items-center rounded-control px-3 text-sm text-ink-muted transition-colors duration-ui ease-ui hover:bg-brand-light hover:text-brand";
  const utilityLinks = (
    <div className="mt-3 flex flex-col gap-0.5 border-t border-rule pt-3">
      <NavLink to={`${home}/account`} className={utilityClass}>
        My account
      </NavLink>
      <ThemeSwitch className="mt-1 hidden self-start lg:inline-flex" />
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#admin-content"
        className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-sticky flex min-h-16 items-center justify-between border-b border-rule bg-surface px-4 py-2 lg:hidden">
        <Link
          to={home}
          className="flex items-center gap-2 whitespace-nowrap font-heading text-lg font-semibold text-brand-dark"
        >
          <BrandMark className="h-8 w-auto" />
          StaySync{" "}
          <span className="hidden font-sans text-sm font-medium text-ink-muted min-[400px]:inline">
            {role}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <details ref={menuRef} className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden rounded-control px-3 py-2 font-medium text-brand">
              Menu
            </summary>
            <nav
              aria-label="Admin navigation"
              className="absolute right-0 top-12 z-dropdown flex min-w-56 flex-col gap-1 rounded-card border border-rule bg-surface p-2 shadow-raised"
            >
              {navItems}
              {utilityLinks}
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
        <aside className="hidden border-r border-rule bg-surface p-4 lg:block">
          <Link
            to={home}
            className="mb-3 flex items-center gap-2 px-3 py-2 font-heading text-lg font-semibold text-brand-dark"
          >
            <BrandMark className="h-8 w-auto" />
            <span className="flex flex-col leading-tight">
              StaySync
              <span className="font-sans text-sm font-medium text-ink-muted">
                {role}
              </span>
            </span>
          </Link>
          <nav
            aria-label="Admin navigation"
            className="sticky top-3 flex flex-col gap-0.5"
          >
            {navItems}
            {utilityLinks}
            <Button
              variant="outline"
              className="mt-3"
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
          <div key={pathname} className="page-in">
            <Outlet />
          </div>
        </main>
      </div>
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Keyboard shortcuts"
      >
        <p className="text-sm text-ink-muted">
          Press <kbd>g</kbd>, then a key, to jump to a page. Press <kbd>?</kbd>{" "}
          to open or close this list.
        </p>
        {!isSuper && (
          <p className="mt-3 text-sm text-ink-muted">
            On Reservations: <kbd>j</kbd> / <kbd>k</kbd> pick a row,{" "}
            <kbd>c</kbd> confirms it, <kbd>p</kbd> jumps to its payment
            reference.
          </p>
        )}
        <dl className="mt-3 grid grid-cols-[3rem_1fr] gap-y-1 text-sm">
          {Object.entries(shortcuts).map(([key, to]) => (
            <div key={key} className="contents">
              <dt>
                <kbd>g</kbd> <kbd>{key}</kbd>
              </dt>
              <dd>{to}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </div>
  );
}
