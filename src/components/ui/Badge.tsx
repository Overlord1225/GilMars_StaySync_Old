import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'info';
};

export function Badge({ children, className = '', variant = 'default' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-brand/10 text-brand border border-brand/20',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        variants[variant]
      } ${className}`.trim()}
    >
      {children}
    </span>
  );
}