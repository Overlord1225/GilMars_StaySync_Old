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
  }
> = {
  pending: { variant: "pending", label: "Pending" },
  confirmed: { variant: "confirmed", label: "Confirmed" },
  rejected: { variant: "rejected", label: "Rejected" },
  cancelled: { variant: "cancelled", label: "Cancelled" },
  completed: { variant: "completed", label: "Completed" },
  new: { variant: "pending", label: "New" },
  in_progress: { variant: "info", label: "In progress" },
  resolved: { variant: "confirmed", label: "Resolved" },
  closed: { variant: "cancelled", label: "Closed" },
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
  return (
    <Badge variant={detail.variant} className={className} {...props}>
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
      {label ?? detail.label}
    </Badge>
  );
}
