import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function AuthShell({ title, description, children, className = "" }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream px-4 py-8 sm:px-6 sm:py-12">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-panel border border-border bg-surface shadow-raised lg:grid-cols-[0.85fr_1fr]">
      <aside aria-label="About GilMars StaySync" className="relative hidden min-h-full flex-col justify-between overflow-hidden bg-brand-dark p-10 text-white lg:flex">
        <span aria-hidden="true" className="absolute -right-20 -top-20 size-72 rounded-full border border-white/15" />
        <span aria-hidden="true" className="absolute -bottom-24 -left-16 size-64 rounded-full border border-sand/50" />
        <Link to="/" aria-label="GilMars StaySync home" className="relative inline-flex w-fit items-center gap-3 rounded-control focus-visible:ring-2 focus-visible:ring-white">
          <img src={logo} alt="" width="48" height="40" className="h-10 w-auto object-contain brightness-0 invert" />
          <span className="flex flex-col leading-tight"><span className="font-heading text-xl font-semibold">GilMars</span><span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/70">StaySync</span></span>
        </Link>
        <div className="relative max-w-sm py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-light">A welcoming stay in the Philippines</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold leading-tight">Feel at home, wherever your plans take you.</h2>
          <p className="mt-4 leading-7 text-white/75">Explore thoughtful spaces, request your dates, and keep every part of your stay in one place.</p>
        </div>
        <p className="relative text-sm text-white/65">Your next GilMars stay starts here.</p>
      </aside>
      <section id="auth-panel" className={`relative w-full p-6 sm:p-10 lg:p-12 ${className}`} aria-labelledby="auth-title">
        <span aria-hidden="true" className="absolute -right-5 -top-7 size-28 rounded-t-full border-[5px] border-sand-light lg:hidden" />
        <header className="relative mb-7">
          <Link to="/" aria-label="GilMars StaySync home" className="mb-5 inline-flex items-center gap-2 rounded-control focus-visible:ring-2 focus-visible:ring-brand lg:hidden">
            <img src={logo} alt="" width="48" height="40" className="h-10 w-auto object-contain" />
            <span className="flex flex-col leading-tight"><span className="font-heading text-lg font-semibold text-brand-dark">GilMars</span><span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-text-muted">StaySync</span></span>
          </Link>
          <h1 id="auth-title" className="font-heading text-3xl font-semibold leading-tight text-brand-dark">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        </header>
        {children}
      </section>
    </div>
  </div>;
}
