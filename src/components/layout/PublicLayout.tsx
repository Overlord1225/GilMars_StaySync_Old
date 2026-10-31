import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import logo from "@/assets/logo.png";

const navClass = ({ isActive }: { isActive: boolean }) => `inline-flex min-h-11 items-center rounded-control px-3 transition-colors hover:bg-brand-light hover:text-brand ${isActive ? "bg-brand-light text-brand-dark" : "text-text-muted"}`;

export function PublicLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const signedIn = Boolean(user?.is_active && user.role);
  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return <div className="flex min-h-screen flex-col bg-cream">
    <a href="#main-content" className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-brand">Skip to content</a>
    <header className="sticky top-0 z-sticky border-b border-border bg-surface">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-control focus-visible:ring-2 focus-visible:ring-brand">
          <img src={logo} alt="" width="48" height="40" className="h-10 w-auto" />
          <span className="flex flex-col leading-tight"><span className="font-heading text-lg font-semibold text-brand-dark">GilMars</span><span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-text-muted">StaySync</span></span>
        </Link>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-x-1 gap-y-1 text-sm font-medium sm:w-auto sm:justify-end">
          <NavLink to="/units" className={navClass}>Stays</NavLink>
          <NavLink to="/availability" className={navClass}>Availability</NavLink>
          <NavLink to="/help" className={navClass}>Help</NavLink>
          {signedIn ? <>
            <NavLink to="/account" className={navClass}>Account</NavLink>
            {(user?.role === "admin" || user?.role === "super_admin") && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
            <Button variant="outline" onClick={() => void handleSignOut()}>Sign out</Button>
          </> : <>
            <NavLink to="/login" className={navClass}>Sign in</NavLink>
            <Link to="/register" className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Create account</Link>
          </>}
        </div>
      </nav>
    </header>
    <main id="main-content" className="flex-1"><Outlet /></main>
    <footer className="border-t border-border bg-surface px-4 py-7 text-sm text-text-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p><span className="font-heading text-base font-semibold text-brand-dark">GilMars StaySync</span><span className="mt-1 block">A comfortable stay, planned with care.</span></p>
        <p className="max-w-xl leading-6">Booking notes: advance requests only, fixed PHP 1,500 deposit by GCash or bank transfer, and rescheduling is considered only in emergencies. Your dates are held after deposit verification and admin confirmation.</p>
        <Link to="/help" className="min-h-11 rounded-control px-2 py-2 font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand">Help and booking rules</Link>
      </div>
    </footer>
  </div>;
}
