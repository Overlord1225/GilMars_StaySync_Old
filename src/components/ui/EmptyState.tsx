import type { HTMLAttributes, ReactNode } from "react";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Use 2 when it follows the page h1 directly; 1 when it is the only content. */
  headingLevel?: 1 | 2 | 3;
};

export function EmptyState({
  title,
  description,
  action,
  headingLevel = 3,
  className = "",
  ...props
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-5 py-12 text-text-muted ${className}`.trim()}
      {...props}
    >
      <Heading className="mb-2 text-lg font-semibold text-brand-dark">
        {title}
      </Heading>
      {description && (
        <p className="mb-4 max-w-sm text-center text-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
