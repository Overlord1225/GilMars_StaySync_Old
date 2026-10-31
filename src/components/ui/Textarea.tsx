import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  className = "",
  id,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={
          [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined
        }
        className={`min-h-28 w-full resize-y rounded-control border bg-surface px-3.5 py-2.5 text-text placeholder:text-text-muted transition-colors duration-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:bg-cream disabled:text-text-muted ${error ? "border-danger-700" : "border-border"} ${className}`.trim()}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
