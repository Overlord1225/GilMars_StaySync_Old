import type { ReactNode } from "react";

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
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-mist px-4 py-8 sm:px-6 sm:py-12">
      <section
        id="auth-panel"
        className={`w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-soft sm:p-10 ${className}`}
        aria-labelledby="auth-title"
      >
        <header className="mb-7">
          <h1
            id="auth-title"
            className="font-heading text-3xl font-semibold leading-tight text-brand-dark"
          >
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {description}
            </p>
          )}
        </header>
        {children}
      </section>
    </div>
  );
}
