import type { Inquiry, Reservation, Unit } from "@/lib/types";

type Status = Reservation["status"];
type Category = NonNullable<Inquiry["category"]>;

export const STATUSES: Status[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
];
export const CATEGORIES: Category[] = [
  "booking_request",
  "availability_inquiry",
  "general_question",
  "complaint",
];

// Last `count` YYYY-MM keys ending at today's month, oldest first. String math only.
function lastMonths(today: string, count: number): string[] {
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.unshift(`${year}-${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return keys;
}

export function reservationsByMonth(
  reservations: Reservation[],
  today: string,
  months = 6,
) {
  const rows = lastMonths(today, months).map((month) => ({
    month,
    ...(Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
      Status,
      number
    >),
  }));
  for (const r of reservations) {
    const row = rows.find((x) => x.month === r.check_in.slice(0, 7));
    if (row) row[r.status] += 1;
  }
  return rows;
}

export function statusSplit(reservations: Reservation[]) {
  return STATUSES.map((status) => ({
    status,
    count: reservations.filter((r) => r.status === status).length,
  })).filter((row) => row.count > 0);
}

// Null category counts as general_question, same as the categorization tie-break.
export function inquiriesByCategory(inquiries: Inquiry[]) {
  return CATEGORIES.map((category) => ({
    category,
    count: inquiries.filter(
      (i) => (i.category ?? "general_question") === category,
    ).length,
  }));
}

export function confirmedByUnit(reservations: Reservation[], units: Unit[]) {
  return units.map((unit) => ({
    unit: unit.name,
    count: reservations.filter(
      (r) =>
        r.unit_id === unit.id &&
        (r.status === "confirmed" || r.status === "completed"),
    ).length,
  }));
}
