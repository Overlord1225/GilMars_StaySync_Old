/**
 * Date helpers that work with plain 'YYYY-MM-DD' strings to avoid JS Date
 * timezone shifts. All calendar comparisons use Asia/Manila.
 */

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

/**
 * Today's date in Asia/Manila as 'YYYY-MM-DD'.
 */
export function todayManila(): string {
  const now = new Date();
  const manilaTime = new Date(now.getTime() + MANILA_OFFSET_MS);
  return manilaTime.toISOString().slice(0, 10);
}

/**
 * Add days to a 'YYYY-MM-DD' string (calendar-day safe).
 */
export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Number of nights between two 'YYYY-MM-DD' dates (check_out - check_in).
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const da = new Date(checkIn + 'T00:00:00Z').getTime();
  const db = new Date(checkOut + 'T00:00:00Z').getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Is checkOut after checkIn?
 */
export function isValidRange(checkIn: string, checkOut: string): boolean {
  return checkIn < checkOut;
}

/**
 * Is the given date strictly before today (Manila)?
 */
export function isBeforeToday(date: string): boolean {
  return date < todayManila();
}

/**
 * Is the given date today or earlier (Manila)?
 */
export function isPastDate(date: string): boolean {
  return date < todayManila();
}

/**
 * Format 'YYYY-MM-DD' to a human-readable string.
 */
export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Alias of nightsBetween kept for call-site compatibility.
 */
export function diffDays(a: string, b: string): number {
  return nightsBetween(a, b);
}

/**
 * Half-open interval overlap: [aIn, aOut) overlaps [bIn, bOut).
 */
export function isOverlapping(
  aCheckIn: string,
  aCheckOut: string,
  bCheckIn: string,
  bCheckOut: string
): boolean {
  return aCheckIn < bCheckOut && aCheckOut > bCheckIn;
}
