import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function AuthShell({ title, description, children, className = "" }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream px-4 py-10 sm:py-14">
    <section className={`relative w-full max-w-md overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-soft sm:p-9 ${className}`}>
      <span aria-hidden="true" className="absolute -right-5 -top-7 size-28 rounded-t-full border-[5px] border-sand-light" />
      <header className="relative mb-7">
        <Link to="/" aria-label="GilMars StaySync home" className="mb-5 inline-flex items-center gap-2 rounded-control focus-visible:ring-2 focus-visible:ring-brand">
          <img src={logo} alt="" width="48" height="40" className="h-10 w-auto object-contain" />
          <span className="flex flex-col leading-tight"><span className="font-heading text-lg font-semibold text-brand-dark">GilMars</span><span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-text-muted">StaySync</span></span>
        </Link>
        <h1 className="font-heading text-3xl font-semibold leading-tight text-brand-dark">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
      </header>
      {children}
    </section>
  </div>;
}
