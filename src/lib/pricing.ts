import { formatCurrency } from "./format";
import type { Unit } from "./types";

type Rates = Pick<
  Unit,
  "price_per_night" | "price_3_guests" | "price_4_guests" | "extra_guest_fee"
>;

// Nightly rate for a guest count. price_per_night covers 1-2 guests; missing
// tiers fall back to it; guests beyond 4 pay extra_guest_fee each.
export function nightlyRate(unit: Rates, guests: number): number {
  const base = unit.price_per_night;
  if (guests <= 2) return base;
  if (guests === 3) return unit.price_3_guests ?? base;
  const four = unit.price_4_guests ?? base;
  return four + (unit.extra_guest_fee ?? 0) * (guests - 4);
}

// "1–2 guests ₱X · 3 guests ₱Y · …" or null when the unit has a single rate.
export function guestTierSummary(unit: Rates): string | null {
  if (!hasGuestTiers(unit)) return null;
  const parts = [`1–2 guests ${formatCurrency(unit.price_per_night)}`];
  if (unit.price_3_guests != null)
    parts.push(`3 guests ${formatCurrency(unit.price_3_guests)}`);
  if (unit.price_4_guests != null)
    parts.push(`4 guests ${formatCurrency(unit.price_4_guests)}`);
  if (unit.extra_guest_fee != null)
    parts.push(`+${formatCurrency(unit.extra_guest_fee)} per extra guest`);
  return parts.join(" · ");
}

export function hasGuestTiers(unit: Rates): boolean {
  return unit.price_3_guests != null || unit.price_4_guests != null;
}
