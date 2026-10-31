import type { HTMLAttributes } from "react";
import { Badge } from "./Badge";

export type Status =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "new"
  | "in_progress"
  | "resolved"
  | "closed";
type StatusBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  status: Status | string;
  label?: string;
};

const STATUS: Record<
  string,
  {
    variant:
      "pending" | "confirmed" | "rejected" | "cancelled" | "completed" | "info";
    label: string;
    icon: "pending" | "check" | "cross" | "minus" | "progress";
  }
> = {
  pending: { variant: "pending", label: "Pending", icon: "pending" },
  confirmed: { variant: "confirmed", label: "Confirmed", icon: "check" },
  rejected: { variant: "rejected", label: "Rejected", icon: "cross" },
  cancelled: { variant: "cancelled", label: "Cancelled", icon: "minus" },
  completed: { variant: "completed", label: "Completed", icon: "check" },
  new: { variant: "pending", label: "New", icon: "pending" },
  in_progress: { variant: "info", label: "In progress", icon: "progress" },
  resolved: { variant: "confirmed", label: "Resolved", icon: "check" },
  closed: { variant: "cancelled", label: "Closed", icon: "minus" },
};

export function StatusBadge({
  status,
  label,
  className = "",
  ...props
}: StatusBadgeProps) {
  const detail = STATUS[status.toLowerCase()] ?? {
    variant: "cancelled" as const,
    label: status.replaceAll("_", " "),
    icon: "minus" as const,
  };
  const paths = {
    pending: "M12 7v5l3 2",
    check: "m8 12 2.5 2.5L16 9",
    cross: "m9 9 6 6m0-6-6 6",
    minus: "M8 12h8",
    progress: "M12 7v5l3 2",
  };
  return (
    <Badge variant={detail.variant} className={className} {...props}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mr-1 size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d={paths[detail.icon]} />
      </svg>
      {label ?? detail.label}
    </Badge>
  );
}
