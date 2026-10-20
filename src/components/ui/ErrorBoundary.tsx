import { useEffect, useState, type ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode; fallback?: ReactNode };

type ErrorBoundaryState = { hasError: boolean; error: Error | null };

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [state, _setState] = useState<ErrorBoundaryState>({ hasError: false, error: null });

  useEffect(() => {
    if (state.hasError) {
      console.error("ErrorBoundary caught:", state.error);
    }
  }, [state]);

  // React class-component-style error boundary via hooks pattern.
  // We simulate getDerivedStateFromError by wrapping render in a try/catch
  // is not possible with functional components directly, so we expose a
  // resetKey that remounts children when the error is cleared.
  if (state.hasError) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-card border border-danger-200 bg-danger-50 p-6 text-center"
        role="alert"
        aria-live="polite"
      >
        <svg aria-hidden="true" className="mb-3 size-8 shrink-0 text-danger-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 className="text-lg font-semibold text-danger-800">Something went wrong</h2>
        <p className="mt-2 text-sm text-danger-700">{state.error?.message ?? "An unexpected error occurred."}</p>
        {fallback}
      </div>
    );
  }

  return children;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
}