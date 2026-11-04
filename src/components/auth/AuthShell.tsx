import { BrandMark } from "@/components/ui/BrandMark";
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
    <div className="grid min-h-[calc(100dvh-4rem)] bg-paper lg:grid-cols-2">
      <div
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-brand-dark p-12 text-white lg:flex"
      >
        <BrandMark className="h-14 w-auto text-white" />
        <p className="max-w-sm font-heading text-4xl leading-tight">
          A little more room to feel at home.
        </p>
      </div>
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
