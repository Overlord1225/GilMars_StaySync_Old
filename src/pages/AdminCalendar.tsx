import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCalendarMonth } from "@/api/calendar";
import { formatCurrency, formatStayDate } from "@/lib/format";
import { nightlyRate } from "@/lib/pricing";
import { nightsBetween, todayManila } from "@/lib/dates";
import {
  longDate,
  monthLabel,
  sourceLabel,
  type CalendarDay,
} from "@/lib/calendar";
import { getAllUnits } from "@/lib/db";
import type { Unit } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellAriaLabel(day: CalendarDay): string {
  const parts = [longDate(day.date)];
  if (day.occupied) {
    parts.push(
      `Occupied by ${day.reservations.map((reservation) => reservation.guestDisplayName).join(", ")}.`,
    );
  } else {
    parts.push("No stays.");
  }
  if (day.checkOuts.length) {
    parts.push(
      `Check-out: ${day.checkOuts.map((reservation) => reservation.guestDisplayName).join(", ")}.`,
    );
  }
  if (day.checkIns.length) {
    parts.push(
      `Check-in: ${day.checkIns.map((reservation) => reservation.guestDisplayName).join(", ")}.`,
    );
  }
  return parts.join(" ");
}

function OccupancyPill({
  reservation,
  onView,
}: {
  reservation: CalendarDay["reservations"][number];
  onView: () => void;
}) {
  const confirmed = reservation.status === "confirmed";
  const pending = reservation.status === "pending";
  const styles = confirmed
    ? reservation.source === "staysync"
      ? "bg-success-50 border-success-300 text-status-confirmed"
      : reservation.source === "block"
        ? "bg-status-cancelled-bg border-status-cancelled-border text-status-cancelled"
        : "bg-brand-light border-brand/20 text-brand-dark"
    : pending
      ? "border-warning-300 text-status-pending bg-transparent"
      : "bg-status-cancelled-bg border-status-cancelled-border text-status-cancelled";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onView();
      }}
      aria-label={`View reservation for ${reservation.guestDisplayName}, ${reservation.checkIn} to ${reservation.checkOut}`}
      className={`flex w-full min-w-0 items-center rounded-control border px-2 py-1 text-left text-xs font-medium ${styles}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate">{reservation.guestDisplayName}</span>
        <span className="block text-2xs leading-tight opacity-70">
          {sourceLabel(reservation.source)}
        </span>
      </span>
    </button>
  );
}

function DayCell({
  day,
  onView,
}: {
  day: CalendarDay;
  onView: (reservationId: string) => void;
}) {
  const outgoingOnly = day.checkOuts.filter(
    (checkout) => !day.checkIns.some((checkin) => checkin.id === checkout.id),
  );
  return (
    <td
      role="gridcell"
      aria-label={cellAriaLabel(day)}
      aria-current={day.date === todayManila() ? "date" : undefined}
      className={`p-2 border border-rule text-center align-middle min-h-25 sm:min-h-35 ${day.date === todayManila() ? "bg-brand-light" : ""}`}
    >
      <div className="flex flex-col h-full">
        <span
          className={`mb-2 block text-left text-sm font-medium ${day.monthOffset === 0 ? "text-ink" : "text-ink-muted/50"}`}
        >
          {day.day}
        </span>
        <div className="flex flex-col gap-1.5 text-left grow">
          {day.reservations.map((reservation) => (
            <OccupancyPill
              key={reservation.id}
              reservation={reservation}
              onView={() => onView(reservation.id)}
            />
          ))}
          {outgoingOnly.length > 0 && day.checkIns.length === 0 && (
            <p className="text-2xs leading-none text-ink-muted">
              Check-out:{" "}
              {outgoingOnly
                .map((reservation) => reservation.guestDisplayName)
                .join(", ")}
            </p>
          )}
        </div>
      </div>
    </td>
  );
}

function ReservationModal({
  reservation,
  unitName,
  unit,
  onClose,
}: {
  reservation: CalendarDay["reservations"][number];
  unitName: string;
  unit?: Unit;
  onClose: () => void;
}) {
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const depositDue =
    reservation.source === "staysync" && reservation.depositAmount != null;
  const paid = reservation.paidAt != null;
  return (
    <Modal open onClose={onClose} title="Reservation details">
      <div className="space-y-4">
        <dl className="grid gap-2 sm:gap-3 sm:grid-cols-[14rem_1fr]">
          <dt className="text-sm text-ink-muted">Guest</dt>
          <dd className="text-sm font-medium">
            {reservation.guestDisplayName}
          </dd>
          <dt className="text-sm text-ink-muted">Stay</dt>
          <dd className="text-sm">{unitName}</dd>
          <dt className="text-sm text-ink-muted">Dates</dt>
          <dd className="text-sm">
            {formatStayDate(reservation.checkIn)} to{" "}
            {formatStayDate(reservation.checkOut)} · {nights} night
            {nights === 1 ? "" : "s"}
          </dd>
          <dt className="text-sm text-ink-muted">Guests</dt>
          <dd className="text-sm">{reservation.numGuests}</dd>
          {unit && reservation.source === "staysync" && (
            <>
              <dt className="text-sm text-ink-muted">Rate</dt>
              <dd className="text-sm">
                {formatCurrency(nightlyRate(unit, reservation.numGuests))} /
                night ·{" "}
                {formatCurrency(
                  nights * nightlyRate(unit, reservation.numGuests),
                )}{" "}
                total
              </dd>
            </>
          )}
          <dt className="text-sm text-ink-muted">Source</dt>
          <dd className="text-sm">{sourceLabel(reservation.source)}</dd>
          <dt className="text-sm text-ink-muted">Status</dt>
          <dd className="text-sm">
            <StatusBadge status={reservation.status} />
          </dd>
        </dl>
        {reservation.source === "staysync" && (
          <div>
            <p className="mb-1 text-sm text-ink-muted">Down payment</p>
            {depositDue ? (
              <p className="text-sm">
                {formatCurrency(reservation.depositAmount ?? 0)} ·{" "}
                {reservation.paymentMethod ?? "—"} ·
                {reservation.paymentReference ?? "—"} ·
                {paid
                  ? `Paid ${formatStayDate(String(reservation.paidAt).slice(0, 10))}`
                  : "Not yet paid"}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Down payment not yet recorded.
              </p>
            )}
          </div>
        )}
        <p className="text-sm">
          <span className="font-medium text-ink-muted">Open in list</span>{" "}
          <Link
            to={{
              pathname: "/admin/reservations",
              search: `?id=${reservation.id}`,
            }}
            className="underline text-brand hover:text-brand-dark"
          >
            View reservation
          </Link>
        </p>
      </div>
    </Modal>
  );
}

export default function AdminCalendar() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState<string>("");
  const [unitsError, setUnitsError] = useState(false);
  const today = todayManila();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [openId, setOpenId] = useState<string | null>(null);
  const {
    unit,
    days,
    reservations,
    loading,
    error,
    nextMonth,
    prevMonth,
    refetch,
  } = useCalendarMonth({
    unitId,
    year,
    month,
  });

  useEffect(() => {
    void getAllUnits()
      .then((rows) => {
        setUnits(rows);
        if (!unitId && rows.length > 0) setUnitId(rows[0]!.id);
      })
      .catch(() => setUnitsError(true));
  }, [unitId]);

  useEffect(() => {
    if (unitId) void refetch();
  }, [unitId, refetch]);

  const weeks = useMemo(() => {
    const chunks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    return chunks;
  }, [days]);

  const activeDays = days.filter(
    (day) =>
      day.monthOffset === 0 && (day.occupied || day.checkOuts.length > 0),
  );
  const reservation = reservations.find((item) => item.id === openId);

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader title="Calendar" />
        <EmptyState
          title="Calendar did not load"
          description={error}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Calendar" />
      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <Select
          id="calendar-unit"
          label="Stay"
          value={unitId}
          disabled={units.length === 0}
          onChange={(event) => setUnitId(event.target.value)}
        >
          <option value="">Select a stay</option>
          {units.map((unitRow) => (
            <option key={unitRow.id} value={unitRow.id}>
              {unitRow.name}
            </option>
          ))}
        </Select>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              aria-label="Previous month"
              onClick={() => {
                const { year: prevYear, month: prevMonthValue } = prevMonth();
                setYear(prevYear);
                setMonth(prevMonthValue);
              }}
            >
              ‹
            </Button>
            <span className="text-sm font-semibold text-ink">
              {monthLabel(year, month)}
            </span>
            <Button
              variant="outline"
              aria-label="Next month"
              onClick={() => {
                const { year: nextYear, month: nextMonthValue } = nextMonth();
                setYear(nextYear);
                setMonth(nextMonthValue);
              }}
            >
              ›
            </Button>
          </div>
          <Button
            variant="outline"
            aria-label="Go to today"
            onClick={() => {
              setYear(Number(today.slice(0, 4)));
              setMonth(Number(today.slice(5, 7)));
            }}
          >
            Today
          </Button>
        </div>
      </div>

      <ul
        aria-label="Legend"
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted"
      >
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-success-300 bg-success-50" />
          StaySync, confirmed
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-brand/20 bg-brand-light" />
          Airbnb
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-warning-300" />
          Pending
        </li>
      </ul>

      {unitsError ? (
        <EmptyState
          title="Stays did not load"
          description="Refresh the page to try again."
        />
      ) : !unitId ? (
        <EmptyState title="Select a stay" />
      ) : loading ? (
        <Skeleton className="h-96 w-full rounded-card" label="Loading month" />
      ) : (
        <>
          <ul
            aria-label="Colour key"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted"
          >
            {[
              ["StaySync, confirmed", "bg-success-50 border-success-300"],
              ["Airbnb, confirmed", "bg-brand-light border-brand/20"],
              [
                "Blocked",
                "bg-status-cancelled-bg border-status-cancelled-border",
              ],
              ["Pending request", "border-warning-300 bg-transparent"],
            ].map(([label, swatch]) => (
              <li key={label} className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-4 rounded border ${swatch}`}
                />
                {label}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Card padded={false} className="overflow-hidden">
              <table
                role="grid"
                aria-label={`${monthLabel(year, month)} occupancy grid`}
                className="w-full table-fixed border-collapse text-center"
              >
                <thead>
                  <tr>
                    {WEEKDAYS.map((weekday) => (
                      <th
                        key={weekday}
                        scope="col"
                        className="border-b border-rule bg-surface text-2xs font-medium text-ink-muted px-2 py-3"
                      >
                        {weekday}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      {week.map((day) => (
                        <DayCell key={day.date} day={day} onView={setOpenId} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <div className="md:hidden">
            {activeDays.length === 0 ? (
              <EmptyState title="No stays this month" />
            ) : (
              <Card as="section" padded={false} aria-label="Stays by day">
                <ul className="divide-y divide-rule">
                  {activeDays.map((day) => {
                    const outgoingOnly = day.checkOuts.filter(
                      (checkout) =>
                        !day.checkIns.some(
                          (checkin) => checkin.id === checkout.id,
                        ),
                    );
                    return (
                      <li key={day.date} className="p-4">
                        <h3 className="text-sm text-brand-dark">
                          {longDate(day.date)}
                        </h3>
                        {day.reservations.map((reservation) => (
                          <button
                            key={reservation.id}
                            type="button"
                            className="mt-1 block min-h-11 w-full text-left text-sm"
                            onClick={() => setOpenId(reservation.id)}
                          >
                            <span className="font-medium text-ink">
                              {reservation.guestDisplayName}
                            </span>
                            <span className="block text-xs text-ink-muted">
                              {formatStayDate(reservation.checkIn)} to{" "}
                              {formatStayDate(reservation.checkOut)} ·{" "}
                              {sourceLabel(reservation.source)} ·
                              <StatusBadge status={reservation.status} />
                            </span>
                          </button>
                        ))}
                        {outgoingOnly.length > 0 && (
                          <p className="mt-1 text-xs text-ink-muted">
                            Check-out:{" "}
                            {outgoingOnly
                              .map(
                                (reservation) => reservation.guestDisplayName,
                              )
                              .join(", ")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </div>
        </>
      )}

      {openId && reservation && unit && (
        <ReservationModal
          reservation={reservation}
          unitName={unit.name}
          unit={unit}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
