import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-mist">
      <a
        href="#main-content"
        className="sr-only z-modal rounded-control bg-surface p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
