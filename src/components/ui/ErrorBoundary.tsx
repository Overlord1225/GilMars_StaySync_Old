import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode; fallback?: ReactNode };

type ErrorBoundaryState = { hasError: boolean; error: Error | null };

/**
 * Class-based error boundary. React only supports `componentDidCatch` /
 * `getDerivedStateFromError` on class components, so a functional component
 * cannot catch errors thrown while rendering its children.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

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
        <p className="mt-2 text-sm text-danger-700">{error?.message ?? "An unexpected error occurred."}</p>
      </div>
    );
  }
}