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
    <div className="grid min-h-[calc(100dvh-4rem)] bg-paper">
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section
          id="auth-panel"
          className={`w-full max-w-md ${className}`}
          aria-labelledby="auth-title"
        >
          <header className="mb-7">
            <h1
              id="auth-title"
              className="font-heading text-4xl leading-tight text-brand-dark"
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
