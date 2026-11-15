import type { HTMLAttributes } from "react";
import { CircleCheck, CircleX, Info } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

type ToastProps = HTMLAttributes<HTMLDivElement> & {
  message: string;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
};

export function Toast({
  message,
  variant = "info",
  action,
  className = "",
  ...props
}: ToastProps) {
  const variants: Record<ToastVariant, string> = {
    success: "bg-success-50 text-success-700 border-success-200",
    error: "bg-danger-50 text-danger-700 border-danger-200",
    info: "bg-brand-light text-brand-dark border-brand/20",
  };
  const Icon = { success: CircleCheck, error: CircleX, info: Info }[variant];

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`flex min-h-12 items-center gap-3 rounded-card border bg-surface px-4 py-3 text-sm shadow-raised ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.5} />
      <span className="grow">{message}</span>
      {action && (
        <button
          type="button"
          className="min-h-11 shrink-0 px-2 font-semibold underline"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
