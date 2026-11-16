import { formatCurrency } from "./format";
import type { Unit } from "./types";

type Rates = Pick<
  Unit,
  "price_per_night" | "price_3_guests" | "price_4_guests" | "extra_guest_fee"
>;

type DayTourRates = Pick<
  Unit,
  | "day_tour_price"
  | "day_tour_price_3_guests"
  | "day_tour_price_4_guests"
  | "day_tour_extra_guest_fee"
>;

export type StayType = "overnight" | "day_tour";

// Nightly rate for a guest count. price_per_night covers 1-2 guests; missing
// tiers fall back to it; guests beyond 4 pay extra_guest_fee each.
export function nightlyRate(unit: Rates, guests: number): number {
  const base = unit.price_per_night;
  if (guests <= 2) return base;
  if (guests === 3) return unit.price_3_guests ?? base;
  const four = unit.price_4_guests ?? base;
  return four + (unit.extra_guest_fee ?? 0) * (guests - 4);
}

// A unit offers day tours when it has a base day-tour price.
export function offersDayTour(unit: DayTourRates): boolean {
  return unit.day_tour_price != null;
}

// Day-tour price for a guest count, with the same tiers as the overnight rate.
// Returns 0 when the unit does not offer day tours.
export function dayTourRate(unit: DayTourRates, guests: number): number {
  const base = unit.day_tour_price;
  if (base == null) return 0;
  if (guests <= 2) return base;
  if (guests === 3) return unit.day_tour_price_3_guests ?? base;
  const four = unit.day_tour_price_4_guests ?? base;
  return four + (unit.day_tour_extra_guest_fee ?? 0) * (guests - 4);
}

// Rate used for one unit of stay: the nightly rate, or the flat day-tour price.
export function stayRate(
  unit: Rates & DayTourRates,
  guests: number,
  stayType: string | null | undefined,
): number {
  return isDayTour(stayType)
    ? dayTourRate(unit, guests)
    : nightlyRate(unit, guests);
}

export function isDayTour(stayType: string | null | undefined): boolean {
  return stayType === "day_tour";
}

// Total price of a reservation. A day tour is a single flat price; an overnight
// stay is the nightly rate times the number of nights.
export function stayTotal(
  unit: Rates & DayTourRates,
  guests: number,
  stayType: string | null | undefined,
  nights: number,
): number {
  return isDayTour(stayType)
    ? dayTourRate(unit, guests)
    : nights * nightlyRate(unit, guests);
}

// "1–2 guests ₱X · 3 guests ₱Y · …" or null when the unit has a single rate.
/** One line per guest-count price tier, for stacked display. */
export function guestTierLines(unit: Rates): string[] {
  if (!hasGuestTiers(unit)) return [];
  const parts = [`1–2 guests ${formatCurrency(unit.price_per_night)}`];
  if (unit.price_3_guests != null)
    parts.push(`3 guests ${formatCurrency(unit.price_3_guests)}`);
  if (unit.price_4_guests != null)
    parts.push(`4 guests ${formatCurrency(unit.price_4_guests)}`);
  if (unit.extra_guest_fee != null)
    parts.push(`+${formatCurrency(unit.extra_guest_fee)} per extra guest`);
  return parts;
}

/** One line per day-tour price tier; empty when the unit has no day tours. */
export function dayTourTierLines(unit: DayTourRates): string[] {
  if (unit.day_tour_price == null) return [];
  const parts = [`1–2 guests ${formatCurrency(unit.day_tour_price)}`];
  if (unit.day_tour_price_3_guests != null)
    parts.push(`3 guests ${formatCurrency(unit.day_tour_price_3_guests)}`);
  if (unit.day_tour_price_4_guests != null)
    parts.push(`4 guests ${formatCurrency(unit.day_tour_price_4_guests)}`);
  if (unit.day_tour_extra_guest_fee != null)
    parts.push(
      `+${formatCurrency(unit.day_tour_extra_guest_fee)} per extra guest`,
    );
  return parts;
}

export function guestTierSummary(unit: Rates): string | null {
  const lines = guestTierLines(unit);
  return lines.length ? lines.join(" · ") : null;
}

export function hasGuestTiers(unit: Rates): boolean {
  return unit.price_3_guests != null || unit.price_4_guests != null;
}
