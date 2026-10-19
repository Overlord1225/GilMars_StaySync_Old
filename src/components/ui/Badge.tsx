import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "info"
    | "pending"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "completed";
};

export function Badge({
  children,
  className = "",
  variant = "default",
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-cream text-text-muted border-border",
    success: "bg-success-50 text-success-700 border-success-200",
    warning: "bg-warning-50 text-warning-800 border-warning-200",
    info: "bg-brand-light text-brand-dark border-brand/20",
    pending: "bg-warning-50 text-status-pending border-warning-300",
    confirmed: "bg-success-50 text-status-confirmed border-success-300",
    rejected: "bg-danger-50 text-status-rejected border-danger-300",
    cancelled: "bg-status-cancelled-bg text-status-cancelled border-status-cancelled-border",
    completed: "bg-brand-light text-status-completed border-brand/20",
  };

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        variants[variant]
      } ${className}`.trim()}
    >
      {children}
    </span>
  );
}
