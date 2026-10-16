import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
};

export function Button({ className = '', variant = 'primary', disabled, ...props }: ButtonProps) {
  const base =
    'rounded-lg px-4 py-2.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-brand text-white focus:ring-brand hover:bg-brand-dark',
    outline: 'border border-slate-300 bg-white text-slate-900 focus:ring-brand hover:bg-cream',
    ghost: 'text-slate-600 focus:ring-brand hover:bg-slate-100',
    danger: 'bg-red-600 text-white focus:ring-red-600 hover:bg-red-700',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`.trim()}
      disabled={disabled}
      {...props}
    />
  );
}