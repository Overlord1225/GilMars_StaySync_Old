import { useId, useState, type KeyboardEvent } from "react";
import { addDays, nightsBetween } from "../../lib/dates";
import { formatStayDate } from "../../lib/format";

type Range = { check_in: string; check_out: string };
type Props = {
  checkIn: string;
  checkOut: string;
  minDate: string;
  minAdvanceDays: number;
  blockedRanges?: Range[];
  onChange: (checkIn: string, checkOut: string) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fromDate = (value: string) => new Date(`${value}T00:00:00Z`);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const monthStart = (value: string) => `${value.slice(0, 7)}-01`;
const shiftMonth = (value: string, amount: number) => {
  const date = fromDate(monthStart(value));
  date.setUTCMonth(date.getUTCMonth() + amount);
  return dateKey(date);
};
const monthTitle = (value: string) => new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(fromDate(value));

export function DateRangePicker({ checkIn, checkOut, minDate, minAdvanceDays, blockedRanges = [], onChange }: Props) {
  const id = useId();
  const [visibleMonth, setVisibleMonth] = useState(monthStart(checkIn || minDate || "2026-01-01"));
  const [activeDate, setActiveDate] = useState(checkIn || minDate);
  const [announcement, setAnnouncement] = useState("");

  const isBooked = (day: string) => blockedRanges.some((range) => day >= range.check_in && day < range.check_out);
  const isRangeBlocked = (start: string, end: string) => blockedRanges.some((range) => start < range.check_out && end > range.check_in);
  const selectingCheckout = Boolean(checkIn && !checkOut);
  const nightCount = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  function chooseDate(day: string) {
    if (day < minDate || isBooked(day) && !selectingCheckout) return;
    if (!checkIn || checkOut || day <= checkIn) {
      onChange(day, "");
      setActiveDate(day);
      setAnnouncement(`Check-in selected: ${formatStayDate(day)}. Choose a check-out date.`);
      return;
    }
    if (isRangeBlocked(checkIn, day)) {
      setAnnouncement("Those dates include booked nights. Please choose another check-out date.");
      return;
    }
    onChange(checkIn, day);
    setActiveDate(day);
    setAnnouncement(`${nightsBetween(checkIn, day)} nights selected, from ${formatStayDate(checkIn)} to ${formatStayDate(day)}. Check-out is not an included night.`);
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const shifts: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in shifts) {
      event.preventDefault();
      const direction = shifts[event.key] ?? 0;
      let next = addDays(day, direction);
      for (let attempts = 0; attempts < 730; attempts += 1) {
        if (next < minDate) { next = minDate; break; }
        const unavailable = selectingCheckout
          ? next > checkIn && isRangeBlocked(checkIn, next)
          : isBooked(next);
        if (!unavailable) break;
        next = addDays(next, direction);
      }
      setActiveDate(next);
      if (next.slice(0, 7) !== visibleMonth.slice(0, 7)) setVisibleMonth(monthStart(next));
      requestAnimationFrame(() => document.getElementById(`${id}-day-${next}`)?.focus());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseDate(day);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (checkIn || checkOut) {
        onChange("", "");
        setAnnouncement("Date selection cleared.");
      }
    }
  }

  function renderMonth(value: string, second = false) {
    const first = fromDate(monthStart(value));
    const mondayOffset = (first.getUTCDay() + 6) % 7;
    const start = addDays(dateKey(first), -mondayOffset);
    return <section key={value} aria-label={monthTitle(value)} className={second ? "hidden md:block" : "min-w-0"}>
      <h3 className="mb-3 text-center text-sm font-semibold text-brand-dark">{monthTitle(value)}</h3>
      <div aria-label={monthTitle(value)} className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => <div key={weekday} aria-hidden="true" className="py-1 text-center text-[0.7rem] font-medium text-text-muted">{weekday}</div>)}
        {Array.from({ length: 42 }, (_, index) => {
          const day = addDays(start, index);
          const inMonth = day.slice(0, 7) === value.slice(0, 7);
          const startDay = day === checkIn;
          const endDay = day === checkOut;
          const bookedRangeDay = isBooked(day);
          const booked = bookedRangeDay && !endDay;
          const inRange = Boolean(checkIn && checkOut && day > checkIn && day < checkOut);
          const blockedByRange = selectingCheckout && day > checkIn && isRangeBlocked(checkIn, day);
          const disabled = day < minDate || bookedRangeDay && !selectingCheckout && !endDay || blockedByRange;
          const label = endDay ? `${formatStayDate(day)}, check-out, exclusive` : blockedByRange ? `${formatStayDate(day)}, unavailable because the date range overlaps booked nights` : booked ? `${formatStayDate(day)}, booked` : `${formatStayDate(day)}${startDay ? ", check-in" : ""}${inRange ? ", in selected stay" : ""}${disabled && day < minDate ? ", advance booking required" : ""}`;
          return <div key={day}>
            <button id={`${id}-day-${day}`} type="button" tabIndex={activeDate === day ? 0 : -1} disabled={disabled || !inMonth} aria-label={label} aria-pressed={startDay || endDay || undefined} title={booked ? "Booked date" : blockedByRange ? "This date range overlaps booked nights" : day < minDate ? "Advance booking is required" : undefined} onClick={() => chooseDate(day)} onFocus={() => setActiveDate(day)} onKeyDown={(event) => handleDayKeyDown(event, day)} className={`relative flex min-h-11 w-full flex-col items-center justify-center rounded-control border text-xs transition-colors duration-ui focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${!inMonth ? "invisible" : ""} ${startDay || endDay ? "border-brand bg-brand text-white" : inRange ? "border-brand/15 bg-brand-light text-brand-dark" : booked || blockedByRange ? "border-warning-300 bg-warning-50 font-semibold text-warning-900 before:absolute before:inset-x-1 before:top-1/2 before:border-t before:border-dashed before:border-warning-700" : "border-transparent text-text hover:border-sand hover:bg-sand-light"} disabled:cursor-not-allowed disabled:opacity-45`}>
              {new Date(`${day}T00:00:00Z`).getUTCDate()}
              {(startDay || endDay) && <span aria-hidden="true" className="text-[0.55rem] font-bold uppercase leading-none">{startDay ? "In" : "Out"}</span>}
              {booked && inMonth && <span aria-hidden="true" className="sr-only">Booked</span>}
            </button>
          </div>;
        })}
      </div>
    </section>;
  }

  const secondMonth = shiftMonth(visibleMonth, 1);
  return <section aria-label="Choose stay dates" className="space-y-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-text">Select your dates</p>
      <div className="flex gap-1">
        <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} disabled={shiftMonth(visibleMonth, -1) < monthStart(minDate)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg></button>
        <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border text-brand hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 18 6-6-6-6" /></svg></button>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{renderMonth(visibleMonth)}{renderMonth(secondMonth, true)}</div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-text-muted" aria-label="Calendar legend">
      <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded border border-brand bg-brand" />Selected date</span>
      <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="relative size-4 rounded border border-warning-300 bg-warning-50 before:absolute before:left-0.5 before:right-0.5 before:top-1/2 before:border-t before:border-dashed before:border-warning-700" />Booked or blocked date</span>
      <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded border border-border bg-cream opacity-50" />Too soon to book</span>
    </div>
    <p className="text-xs leading-5 text-text-muted">Advance booking only. Book at least {minAdvanceDays} {minAdvanceDays === 1 ? "day" : "days"} ahead{minDate ? ` (earliest: ${formatStayDate(minDate)})` : ""}. Booked and overlapping dates are disabled and marked with a dashed line. Check-out is exclusive; you leave that morning.</p>
    <p aria-live="polite" className="min-h-5 text-sm font-medium text-brand-dark">{nightCount > 0 ? `${nightCount} ${nightCount === 1 ? "night" : "nights"}: ${formatStayDate(checkIn)} to ${formatStayDate(checkOut)} (check-out not included)` : checkIn ? `Check-in: ${formatStayDate(checkIn)}. Now choose check-out.` : "Choose a check-in date, then a check-out date."}</p>
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </section>;
}
