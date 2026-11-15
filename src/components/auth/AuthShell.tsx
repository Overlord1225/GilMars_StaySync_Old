import type { ReactNode } from "react";
import { StayImage } from "@/components/public/StayImage";
import poolPhoto from "@/assets/pool.jpg";

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
    <div className="grid min-h-[calc(100dvh-4rem)] bg-paper lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="hidden p-6 lg:block lg:p-8">
        <div className="h-[calc(100dvh-10rem)] min-h-96 lg:sticky lg:top-24">
          <StayImage
            src={poolPhoto}
            alt=""
            className="size-full rounded-image shadow-raised"
          />
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-12">
        <section
          id="auth-panel"
          className={`w-full max-w-md ${className}`}
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
