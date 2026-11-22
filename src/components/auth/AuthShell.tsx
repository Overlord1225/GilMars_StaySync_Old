import type { ReactNode } from "react";
import { StayImage } from "@/components/public/StayImage";
import poolPhoto from "@/assets/pool.webp";

export function AuthShell({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-paper">
      <div className="absolute inset-0">
        <StayImage src={poolPhoto} alt="" className="size-full rounded-none" />
      </div>
      <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section
          id="auth-panel"
          className={`w-full max-w-md rounded-panel border border-edge-warm bg-mango-light/90 p-6 shadow-raised sm:p-8 ${className}`}
          aria-labelledby="auth-title"
        >
          <header className="mb-8">
            <h1
              id="auth-title"
              className="text-4xl leading-tight text-brand-dark"
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {description}
              </p>
            )}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
