import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
): ComponentType<P> {
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
