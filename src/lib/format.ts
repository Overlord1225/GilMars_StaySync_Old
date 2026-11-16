/** Shared guest-facing formats. Date values are calendar dates, not instants. */
export function formatCurrency(amount: number): string {
  return `PHP ${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatStayDate(value: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

/** Deadline for a pending request: created_at plus the expiry window, shown in Manila time. */
export function formatExpiryDeadline(createdAt: string, hours: number): string {
  const deadline = new Date(new Date(createdAt).getTime() + hours * 3_600_000);
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(deadline);
}
