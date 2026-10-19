import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../features/auth/useAuth";
import { Button } from "../ui/Button";
import { useToast } from "../ui/useToast";
import { RoleGuide } from "@/components/layout/RoleGuide";

const navClass = ({ isActive }: { isActive: boolean }) => `inline-flex min-h-11 shrink-0 items-center rounded-control px-3 text-sm font-medium transition-colors hover:bg-brand-light hover:text-brand ${isActive ? "bg-brand-light text-brand-dark" : "text-text-muted"}`;

export function GuestLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const guideAudience = user?.role === "super_admin" ? "super_admin" : user?.role === "admin" ? "admin" : "guest";
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOut(); navigate("/login"); }
    catch { showToast("We couldn’t sign you out. Please try again.", "error"); }
    finally { setSigningOut(false); }
  }

  return <div className="flex min-h-screen flex-col bg-cream">
    <a href="#guest-content" className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-brand">Skip to content</a>
    <header className="sticky top-0 z-sticky border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" aria-label="GilMars StaySync home" className="inline-flex min-h-11 items-center gap-2 rounded-control focus-visible:ring-2 focus-visible:ring-brand"><span aria-hidden="true" className="inline-flex size-8 items-end justify-center rounded-t-full border-2 border-brand pb-1"><span className="h-1 w-4 bg-sand" /></span><span className="font-heading text-lg font-semibold text-brand-dark">GilMars <span className="font-sans text-sm font-medium tracking-wide text-text-muted">StaySync</span></span></Link>
        <nav aria-label="Guest navigation" className="flex w-full gap-1 overflow-x-auto pb-0.5 sm:w-auto sm:max-w-[70%]">
          <NavLink to="/units" className={navClass}>Stays</NavLink>
          <NavLink to="/help" className={navClass}>Help</NavLink>
          {user && <><NavLink to="/my-bookings" className={navClass}>My reservations</NavLink><NavLink to="/my-inquiries" className={navClass}>My inquiries</NavLink><NavLink to="/inquire" className={navClass}>Ask a question</NavLink><NavLink to="/account" className={navClass}>Account</NavLink><Button variant="outline" loading={signingOut} onClick={() => void handleSignOut()}>Sign out</Button></>}
        </nav>
      </div>
    </header>
    <main id="guest-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8"><RoleGuide audience={guideAudience} /><Outlet /></main>
    <footer className="flex flex-wrap items-center justify-center gap-x-3 border-t border-border bg-surface px-4 py-5 text-center text-xs text-text-muted"><span>GilMars StaySync · Advance booking only · PHP 1,500 deposit by GCash or bank transfer</span><Link to="/help" className="min-h-11 rounded-control px-2 py-3 font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand">Help and booking rules</Link></footer>
  </div>;
}
