import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Select({
  label,
  hint,
  error,
  className = "",
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={
          [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined
        }
        className={`min-h-11 w-full rounded-control border bg-surface px-3.5 py-2.5 text-ink transition-colors duration-ui disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-muted aria-[invalid=true]:border-danger-700 ${error ? "border-danger-700" : "border-rule-strong"} ${className}`.trim()}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
