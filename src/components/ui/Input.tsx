import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={props.id}
        className={`w-full rounded-lg border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`.trim()}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}