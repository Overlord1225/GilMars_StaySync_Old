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
import { nightsBetween, todayManila } from "@/lib/dates";
import { longDate, monthLabel, type CalendarDay } from "@/lib/calendar";
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
      : "bg-brand-light border-brand/20 text-brand-dark"
    : pending
      ? "border-warning-300 text-status-pending bg-transparent"
      : "bg-slate-50 border-slate-200 text-slate-600";
  const icon =
    confirmed || reservation.status === "completed"
      ? "m8 12 2.5 2.5L16 9"
      : "M12 7v5l3 2";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onView();
      }}
      aria-label={`View reservation for ${reservation.guestDisplayName}, ${reservation.checkIn} to ${reservation.checkOut}`}
      className={`flex flex-wrap items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d={icon} />
      </svg>
      {reservation.guestDisplayName}
      <span className="text-[10px] leading-none opacity-70">
        · {reservation.source === "staysync" ? "StaySync" : "Airbnb"}
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
      className="p-2 border border-border text-center align-middle min-h-25 sm:min-h-35"
    >
      <div className="flex flex-col h-full">
        <span
          className={`mb-2 block text-left text-sm font-medium ${day.monthOffset === 0 ? "text-text" : "text-text-muted/50"}`}
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
            <p className="text-[10px] leading-none text-text-muted">
              Check-out:{" "}
              {outgoingOnly
                .map((reservation) => reservation.guestDisplayName)
                .join(", ")}
            </p>
          )}
          {day.monthOffset === 0 &&
            day.reservations.length === 0 &&
            outgoingOnly.length === 0 && (
              <p className="text-[10px] leading-none text-text-muted/60">
                Open
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
  onClose,
}: {
  reservation: CalendarDay["reservations"][number];
  unitName: string;
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
          <dt className="text-sm text-text-muted">Guest</dt>
          <dd className="text-sm font-medium">
            {reservation.guestDisplayName}
          </dd>
          <dt className="text-sm text-text-muted">Stay</dt>
          <dd className="text-sm">{unitName}</dd>
          <dt className="text-sm text-text-muted">Dates</dt>
          <dd className="text-sm">
            {formatStayDate(reservation.checkIn)} →{" "}
            {formatStayDate(reservation.checkOut)} · {nights} night
            {nights === 1 ? "" : "s"}
          </dd>
          <dt className="text-sm text-text-muted">Guests</dt>
          <dd className="text-sm">{reservation.numGuests}</dd>
          <dt className="text-sm text-text-muted">Source</dt>
          <dd className="text-sm">
            {reservation.source === "staysync" ? "StaySync" : "Airbnb"}
          </dd>
          <dt className="text-sm text-text-muted">Status</dt>
          <dd className="text-sm">
            <StatusBadge status={reservation.status} />
          </dd>
        </dl>
        {reservation.source === "staysync" && (
          <div className="rounded-control border border-border bg-cream p-3">
            <p className="mb-1 text-sm text-text-muted">Deposit</p>
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
              <p className="text-sm text-text-muted">
                Deposit not yet recorded.
              </p>
            )}
          </div>
        )}
        <p className="text-sm">
          <span className="font-medium text-text-muted">Open in list</span>{" "}
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
    void getAllUnits().then((rows) => {
      setUnits(rows);
      if (!unitId && rows.length > 0) setUnitId(rows[0]!.id);
    });
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

  if (loading) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Calendar"
          description="View nightly occupancy by stay."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Calendar" },
          ]}
        />
        <div className="space-y-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Calendar"
          description="View nightly occupancy by stay."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Calendar" },
          ]}
        />
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
      <PageHeader
        title="Calendar"
        description="View nightly occupancy by stay."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Calendar" },
        ]}
      />
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
            <span className="text-sm font-semibold text-text">
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

      {!unitId ? (
        <EmptyState
          title="Select a stay"
          description="Choose a stay from the selector to view its calendar."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Card padded={false} className="overflow-hidden">
              <table
                role="grid"
                aria-label={`${monthLabel(year, month)} occupancy grid`}
                className="w-full border-collapse text-center"
              >
                <thead>
                  <tr>
                    {WEEKDAYS.map((weekday) => (
                      <th
                        key={weekday}
                        scope="col"
                        className="border-b border-border bg-surface text-[10px] font-medium text-text-muted uppercase px-2 py-3"
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
          <div className="md:hidden space-y-3">
            {activeDays.length === 0 ? (
              <EmptyState
                title="No stays this month"
                description="No confirmed, pending, or completed stays fall in the selected month."
              />
            ) : (
              activeDays.map((day) => {
                const outgoingOnly = day.checkOuts.filter(
                  (checkout) =>
                    !day.checkIns.some((checkin) => checkin.id === checkout.id),
                );
                return (
                  <Card key={day.date} className="p-4">
                    <h3 className="text-sm font-semibold text-brand-dark">
                      {longDate(day.date)}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {day.reservations.map((reservation) => (
                        <Button
                          key={reservation.id}
                          variant="outline"
                          className="w-full text-left sm:w-auto text-sm"
                          onClick={() => setOpenId(reservation.id)}
                        >
                          <span className="font-medium text-text">
                            {reservation.guestDisplayName}
                          </span>
                          <span className="block text-[11px] text-text-muted">
                            {formatStayDate(reservation.checkIn)} →{" "}
                            {formatStayDate(reservation.checkOut)} ·
                            {reservation.source === "staysync"
                              ? "StaySync"
                              : "Airbnb"}{" "}
                            ·
                            <StatusBadge
                              status={reservation.status}
                              className="mt-0.5 inline-block"
                            />
                          </span>
                        </Button>
                      ))}
                      {outgoingOnly.length > 0 && (
                        <p className="text-[11px] text-text-muted">
                          Check-out:{" "}
                          {outgoingOnly
                            .map((reservation) => reservation.guestDisplayName)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {openId && reservation && unit && (
        <ReservationModal
          reservation={reservation}
          unitName={unit.name}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
