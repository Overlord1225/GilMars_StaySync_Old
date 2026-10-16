export function isOverlapping(
  aCheckIn: string,
  aCheckOut: string,
  bCheckIn: string,
  bCheckOut: string
): boolean {
  return aCheckIn < bCheckOut && aCheckOut > bCheckIn;
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isPastDate(date: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(date + 'T00:00:00Z') < today;
}

export function isToday(date: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(date + 'T00:00:00Z').getTime() === today.getTime();
}

export function isValidRange(checkIn: string, checkOut: string): boolean {
  return checkIn < checkOut;
}