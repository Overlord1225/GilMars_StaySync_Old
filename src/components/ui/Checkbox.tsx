import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
};

export function Checkbox({
  label,
  hint,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: CheckboxProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={
            [describedBy, hintId, errorId].filter(Boolean).join(" ") ||
            undefined
          }
          className={`size-5 shrink-0 rounded border-border text-brand accent-brand focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
          {...props}
        />
        <span>{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="pl-8 text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="pl-8 text-sm font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
