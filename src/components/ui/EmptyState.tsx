import type { HTMLAttributes } from 'react';

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action, className = '', ...props }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-slate-500 ${className}`.trim()}
      {...props}
    >
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && <p className="text-sm mb-4 max-w-xs text-center">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}