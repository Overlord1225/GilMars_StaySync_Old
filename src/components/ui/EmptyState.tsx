import type { HTMLAttributes, ReactNode } from "react";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action, className = "", ...props }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-5 py-12 text-text-muted ${className}`.trim()}
      {...props}
    >
      <h3 className="mb-2 text-lg font-semibold text-brand-dark">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-center text-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
