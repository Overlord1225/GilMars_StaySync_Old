import { addDays, nightsBetween } from "./dates";
import type { Reservation } from "./types";

export type MetricRow = Pick<
  Reservation,
  "unit_id" | "check_in" | "check_out" | "status" | "source" | "num_guests"
>;

export type UnitMonth = {
  unitId: string;
  directNights: number;
  airbnbNights: number;
  blockedNights: number;
  /** Booked nights over nights not blocked, 0-100. */
  occupancyPct: number;
  /** Estimated from nightly rates; direct (StaySync) stays only. */
  directRevenue: number;
};

/** Nights of [checkIn, checkOut) that fall inside [monthStart, monthEnd). */
function nightsInMonth(
  row: MetricRow,
  monthStart: string,
  monthEnd: string,
): number {
  const start = row.check_in > monthStart ? row.check_in : monthStart;
  const end = row.check_out < monthEnd ? row.check_out : monthEnd;
  return Math.max(0, nightsBetween(start, end));
}

/**
 * Per-unit nights for one month. Only confirmed and completed stays count.
 * monthEnd is exclusive (the first day of the next month).
 */
export function monthMetrics(
  rows: MetricRow[],
  unitIds: string[],
  monthStart: string,
  monthEnd: string,
  rateFor: (row: MetricRow) => number,
): UnitMonth[] {
  const days = nightsBetween(monthStart, monthEnd);
  return unitIds.map((unitId) => {
    let directNights = 0;
    let airbnbNights = 0;
    let blockedNights = 0;
    let directRevenue = 0;
    for (const row of rows) {
      if (row.unit_id !== unitId) continue;
      if (row.status !== "confirmed" && row.status !== "completed") continue;
      const nights = nightsInMonth(row, monthStart, monthEnd);
      if (row.source === "block") blockedNights += nights;
      else if (row.source === "airbnb") airbnbNights += nights;
      else {
        directNights += nights;
        directRevenue += nights * rateFor(row);
      }
    }
    const available = days - blockedNights;
    const booked = directNights + airbnbNights;
    return {
      unitId,
      directNights,
      airbnbNights,
      blockedNights,
      occupancyPct: available > 0 ? Math.round((booked / available) * 100) : 0,
      directRevenue,
    };
  });
}

/** First day of the month containing `date`, and the first day of the next. */
export function monthBounds(date: string): { start: string; end: string } {
  const start = `${date.slice(0, 7)}-01`;
  const nextProbe = addDays(start, 32);
  return { start, end: `${nextProbe.slice(0, 7)}-01` };
}
