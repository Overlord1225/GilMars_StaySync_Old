import { useEffect, useRef, useState, useCallback } from "react";
import { buildStayIcs } from "../lib/ics";
import { CLEANING_DEPOSIT, SECURITY_DEPOSIT } from "../lib/policies";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  getReservationsByGuest,
  cancelReservation,
  getActiveUnits,
  getBookingRules,
  getUnitStayInfo,
} from "../lib/db";
import { nightsBetween, todayManila } from "../lib/dates";
import { formatCurrency, formatStayDate } from "../lib/format";
import { nightlyRate } from "../lib/pricing";
import { PaymentReferenceForm } from "../components/public/PaymentReferenceForm";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/useToast";
import {
  useReservationsRealtime,
  applyRealtimeChange,
} from "../hooks/useRealtime";
import type { Reservation, Unit } from "../lib/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

function nextStep(status: Reservation["status"]): string {
  switch (status) {
    case "pending":
      return "Staff will verify your down payment and confirm.";
    case "confirmed":
      return "Confirmed. Staff will share arrival details.";
    case "rejected":
      return "Not approved. Try other dates or another stay.";
    case "cancelled":
      return "Cancelled. Send a new request to book again.";
    case "completed":
      return "Stay complete.";
  }
}

export default function MyReservations() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [expiryHours, setExpiryHours] = useState<number>();

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    // The pay-by line is a nicety: without the rule it is simply left out.
    void getBookingRules()
      .then((rules) => {
        if (mounted) setExpiryHours(rules.pending_expiry_hours);
      })
      .catch(() => undefined);
    // Unit names and rates are a nicety: a failed lookup falls back to a generic label.
    void getActiveUnits()
      .then((units) => {
        if (mounted)
          setUnitsById(Object.fromEntries(units.map((u) => [u.id, u])));
      })
      .catch(() => undefined);
    getReservationsByGuest(user.id)
      .then((data) => {
        if (mounted) setReservations(data);
      })
      .catch(() => {
        if (mounted)
          setError("We couldn’t load your reservations. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, retry]);

  // RLS returns only units where this guest has a confirmed stay.
  const [stayInfo, setStayInfo] = useState<Map<string, string>>(new Map());
  const hasConfirmed = reservations.some((row) => row.status === "confirmed");
  useEffect(() => {
    if (!user || !hasConfirmed) return;
    let mounted = true;
    getUnitStayInfo()
      .then((info) => {
        if (mounted) setStayInfo(info);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [user, hasConfirmed]);

  const handleReservationChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Reservation>) => {
      if (!user) return;
      const changed =
        payload.eventType === "DELETE" ? payload.old : payload.new;
      if (!changed || changed.guest_id !== user.id) return;
      setReservations((rows) => applyRealtimeChange(rows, payload));
    },
    [user],
  );

  useReservationsRealtime(handleReservationChange, {
    filter: user ? `guest_id=eq.${user.id}` : undefined,
  });

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setRetry((value) => value + 1);
  };
  async function confirmCancel() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      await cancelReservation(cancelTarget.id);
      setReservations((rows) =>
        rows.map((row) =>
          row.id === cancelTarget.id ? { ...row, status: "cancelled" } : row,
        ),
      );
      showToast("Reservation request cancelled.", "success");
      setCancelTarget(null);
    } catch {
      showToast("We couldn’t cancel that request. Please try again.", "error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Reservations didn’t load"
        description={error}
        action={
          <Button variant="outline" onClick={retryLoad}>
            Try again
          </Button>
        }
      />
    );
  if (!reservations.length)
    return (
      <div className="space-y-6">
        <PageHeader title="My reservations" />
        <EmptyState
          headingLevel={2}
          title="No reservations yet"
          description="Your stay requests will appear here after you send one."
          action={
            <Link className={buttonClass("primary")} to="/units">
              Browse stays
            </Link>
          }
        />
      </div>
    );

  const today = todayManila();
  const isUpcoming = (row: Reservation) =>
    (row.status === "pending" || row.status === "confirmed") &&
    row.check_out > today;
  const upcoming = reservations
    .filter(isUpcoming)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const past = reservations
    .filter((row) => !isUpcoming(row))
    .sort((a, b) => b.check_in.localeCompare(a.check_in));

  function renderSection(id: string, heading: string, rows: Reservation[]) {
    if (!rows.length) return null;
    return (
      <section aria-labelledby={id} className="space-y-3">
        <h2 id={id} className="font-heading text-xl text-brand-dark">
          {heading}
        </h2>
        <Card padded={false}>
          <ul className="divide-y divide-rule">
            {rows.map((row) => (
              <ReservationItem
                key={row.id}
                row={row}
                unitName={unitsById[row.unit_id]?.name ?? "GilMars stay"}
                unit={unitsById[row.unit_id]}
                stayInfo={
                  row.status === "confirmed"
                    ? stayInfo.get(row.unit_id)
                    : undefined
                }
                expiryHours={expiryHours}
                onCancel={() => setCancelTarget(row)}
                onReferenceSaved={(method, reference) =>
                  setReservations((all) =>
                    all.map((item) =>
                      item.id === row.id
                        ? {
                            ...item,
                            payment_method: method,
                            payment_reference: reference,
                          }
                        : item,
                    ),
                  )
                }
              />
            ))}
          </ul>
        </Card>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="My reservations"
        actions={
          <Link className={buttonClass("outline")} to="/units">
            Browse stays
          </Link>
        }
      />
      {renderSection("upcoming-heading", "Upcoming", upcoming)}
      {renderSection("past-heading", "Past and closed", past)}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
        loading={cancelling}
        title="Cancel this request?"
        consequence="This will cancel your pending reservation request. You’ll need to send a new request if you still want these dates."
        confirmLabel="Cancel reservation request"
        cancelLabel="Keep request"
      />
    </div>
  );
}

// Unpaid requests expire when no payment reference arrives in time.
function referenceDeadline(
  row: Reservation,
  expiryHours?: number,
): string | null {
  if (
    !expiryHours ||
    !row.created_at ||
    row.status !== "pending" ||
    row.paid_at ||
    row.payment_reference
  )
    return null;
  const deadline = new Date(
    new Date(row.created_at).getTime() + expiryHours * 3_600_000,
  );
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(deadline);
}

function paymentLine(row: Reservation, deadline: string | null): string | null {
  if (row.status !== "pending" && row.status !== "confirmed") return null;
  if (row.paid_at) return "Down payment verified.";
  if (row.payment_reference)
    return `Reference sent (${row.payment_reference}). Staff will verify it.`;
  return deadline
    ? `Down payment not paid yet. Send your payment reference by ${deadline} (Manila time) or the request expires.`
    : "Down payment not paid yet.";
}

function ReservationItem({
  row,
  unitName,
  unit,
  stayInfo,
  expiryHours,
  onCancel,
  onReferenceSaved,
}: {
  row: Reservation;
  unitName: string;
  unit?: Unit;
  stayInfo?: string;
  expiryHours?: number;
  onCancel: () => void;
  onReferenceSaved: (method: "GCash" | "Bank transfer", ref: string) => void;
}) {
  const nights = nightsBetween(row.check_in, row.check_out);
  const payment = paymentLine(row, referenceDeadline(row, expiryHours));
  const canSendReference = row.status === "pending" && !row.paid_at;
  const itemRef = useRef<HTMLLIElement>(null);

  function printConfirmation() {
    const item = itemRef.current;
    if (!item) return;
    item.classList.add("print-target");
    window.addEventListener(
      "afterprint",
      () => item.classList.remove("print-target"),
      { once: true },
    );
    window.print();
  }

  function downloadIcs() {
    const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
    const url = URL.createObjectURL(
      new Blob(
        [
          buildStayIcs({
            id: row.id,
            unitName,
            checkIn: row.check_in,
            checkOut: row.check_out,
            stamp,
          }),
        ],
        { type: "text/calendar" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `stay-${row.check_in}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li ref={itemRef} className="space-y-3 p-4 sm:p-5">
      <p className="hidden text-sm text-ink print:block">
        GilMars StaySync booking confirmation · Reference {row.id}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg text-brand-dark">{unitName}</h3>
          <p className="text-sm tabular-nums text-ink">
            <time dateTime={row.check_in}>{formatStayDate(row.check_in)}</time>
            <span aria-hidden="true"> → </span>
            <span className="sr-only"> to </span>
            <time dateTime={row.check_out}>
              {formatStayDate(row.check_out)}
            </time>
            {" · "}
            {nights} {nights === 1 ? "night" : "nights"} · {row.num_guests}{" "}
            {row.num_guests === 1 ? "guest" : "guests"}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      {unit && (
        <p className="text-sm tabular-nums text-ink">
          {formatCurrency(nightlyRate(unit, row.num_guests))} / night × {nights}{" "}
          {nights === 1 ? "night" : "nights"} ={" "}
          <span className="font-medium">
            {formatCurrency(nights * nightlyRate(unit, row.num_guests))}
          </span>
        </p>
      )}
      <p className="text-sm text-ink-muted">{nextStep(row.status)}</p>
      {stayInfo && (
        <div className="rounded-control border border-rule p-3 text-sm">
          <h4 className="font-medium text-brand-dark">Arrival details</h4>
          <p className="mt-1 whitespace-pre-line text-ink">{stayInfo}</p>
          <p className="mt-2 text-ink-muted">
            At check-in you also pay a {formatCurrency(SECURITY_DEPOSIT)}{" "}
            security deposit and a {formatCurrency(CLEANING_DEPOSIT)} cleaning
            deposit.
          </p>
        </div>
      )}
      {payment && <p className="text-sm text-ink">{payment}</p>}
      <div className="no-print flex flex-wrap items-center gap-x-4">
        <Link
          to={`/units/${row.unit_id}`}
          className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline"
        >
          {row.status === "completed" ? "Book again" : "View stay"}
        </Link>
        {row.status === "pending" && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel request
          </Button>
        )}
        {row.status === "confirmed" && (
          <>
            <Button type="button" variant="outline" onClick={printConfirmation}>
              Print confirmation
            </Button>
            <Button type="button" variant="outline" onClick={downloadIcs}>
              Add to calendar
            </Button>
          </>
        )}
      </div>
      {canSendReference && (
        <details
          open={!row.payment_reference}
          className="no-print rounded-control border border-rule p-3"
        >
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-brand">
            {row.payment_reference
              ? "Send an updated payment reference"
              : "Send payment reference"}
          </summary>
          <div className="pt-2">
            <PaymentReferenceForm
              reservationId={row.id}
              onSaved={onReferenceSaved}
            />
          </div>
        </details>
      )}
    </li>
  );
}
