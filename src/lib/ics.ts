const compact = (date: string) => date.replaceAll("-", "");

const escapeText = (text: string) =>
  text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\r?\n/g, "\\n");

/**
 * One all-day event for a stay. DTEND is exclusive in iCalendar, which matches
 * the half-open [check_in, check_out) stay rule, so check_out is used as is.
 */
export function buildStayIcs(input: {
  id: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  stamp: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GilMars StaySync//EN",
    "BEGIN:VEVENT",
    `UID:${input.id}@staysync`,
    `DTSTAMP:${input.stamp}`,
    `DTSTART;VALUE=DATE:${compact(input.checkIn)}`,
    `DTEND;VALUE=DATE:${compact(input.checkOut)}`,
    `SUMMARY:${escapeText(`Stay at ${input.unitName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
