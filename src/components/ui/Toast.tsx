import type { HTMLAttributes } from 'react';

type ToastProps = HTMLAttributes<HTMLDivElement> & {
  message: string;
  variant?: 'success' | 'error' | 'info';
};

export function Toast({ message, variant = 'info', className = '', ...props }: ToastProps) {
  const variants: Record<string, string> = {
    success: 'bg-brand/10 text-brand border border-brand/20',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
        variants[variant]
      } ${className}`.trim()}
      {...props}
    >
      {message}
    </div>
  );
}