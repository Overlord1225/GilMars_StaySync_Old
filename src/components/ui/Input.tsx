import type { InputHTMLAttributes, ReactNode } from "react";
import { FieldError, RequiredMark } from "./FieldError";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
};

export function Input({
  label,
  hint,
  error,
  trailing,
  id,
  className = "",
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
          {props.required && <RequiredMark />}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={
            [describedBy, hintId, errorId].filter(Boolean).join(" ") ||
            undefined
          }
          className={`min-h-11 w-full pointer-coarse:min-h-12 rounded-control border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-muted transition-colors duration-ui disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-muted aria-[invalid=true]:border-danger-700 ${
            error ? "border-danger-700" : "border-rule-strong"
          } ${trailing ? "pr-12" : ""} ${className}`.trim()}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
