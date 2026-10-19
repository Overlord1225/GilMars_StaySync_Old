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
