import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/buttonStyles";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/useToast";
import {
  confirmReservation,
  rejectReservation,
  getAllInquiries,
  getAllProfiles,
  getAllUnits,
  getStaffReservations,
} from "@/lib/db";
import { todayManila } from "@/lib/dates";
import { categoryLabels } from "@/lib/inquiryLabels";
import { formatCurrency, formatStayDate } from "@/lib/format";
import { monthBounds, monthMetrics } from "@/lib/metrics";
import { nightlyRate } from "@/lib/pricing";
import type { Inquiry, Profile, Reservation, Unit } from "@/lib/types";

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      getStaffReservations(),
      getAllInquiries(),
      getAllUnits(),
      getAllProfiles(),
    ])
      .then(([bookingRows, inquiryRows, unitRows, profileRows]) => {
        if (!active) return;
        setReservations(bookingRows);
        setInquiries(inquiryRows);
        setUnits(unitRows);
        setProfiles(profileRows);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  async function act(
    row: Reservation,
    action: () => Promise<void>,
    success: string,
  ) {
    setBusyId(row.id);
    try {
      await action();
      showToast(success, "success");
      setRefresh((value) => value + 1);
    } catch {
      showToast(
        "The reservation could not be updated. Open it in Reservations to check the details.",
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }
  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Dashboard data did not load"
        description="Check your staff access and try again."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setError(false);
              setLoading(true);
              setRefresh((value) => value + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );

  const today = todayManila();
  const pending = reservations.filter((row) => row.status === "pending");
  const openInquiries = inquiries.filter((row) => row.status !== "resolved");
  const confirmed = reservations.filter((row) => row.status === "confirmed");
  const guestStays = confirmed.filter((row) => row.source !== "block");
  const arrivals = guestStays.filter((row) => row.check_in === today);
  const departures = guestStays.filter((row) => row.check_out === today);
  // Half-open stay: check-out day is free again.
  const currentStay = (unitId: string) =>
    confirmed.find(
      (row) =>
        row.unit_id === unitId &&
        row.check_in <= today &&
        row.check_out > today,
    );
  const nextStay = (unitId: string) =>
    confirmed
      .filter((row) => row.unit_id === unitId && row.check_in > today)
      .sort((a, b) => a.check_in.localeCompare(b.check_in))[0];
  const activeUnits = units.filter((unit) => unit.is_active);
  const occupied = activeUnits.filter((unit) => currentStay(unit.id)).length;
  const guestNames = new Map(
    profiles.map((profile) => [profile.id, profile.full_name || profile.email]),
  );
  const guestName = (row: Reservation) =>
    row.guest_id
      ? (guestNames.get(row.guest_id) ?? "Guest")
      : (row.manual_guest_name ?? "Airbnb guest");
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]));
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const month = monthBounds(today);
  const monthRows = monthMetrics(
    reservations,
    activeUnits.map((unit) => unit.id),
    month.start,
    month.end,
    (row) => {
      const unit = unitsById.get(row.unit_id);
      return unit ? nightlyRate(unit, row.num_guests) : 0;
    },
  );
  const categories = (
    [
      "booking_request",
      "availability_inquiry",
      "general_question",
      "complaint",
    ] as const
  ).map((category) => ({
    category,
    rows: openInquiries.filter(
      (row) => (row.category ?? "general_question") === category,
    ),
  }));

  return (
    <section className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        actions={
          <>
            <Link
              to="/admin/reservations?add=airbnb"
              className={buttonClass("secondary")}
            >
              Add Airbnb booking
            </Link>
            <Link
              to="/admin/reservations?status=pending"
              className={buttonClass("primary")}
            >
              Review pending requests
            </Link>
          </>
        }
      />
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        {[
          [
            "Today’s occupancy",
            `${occupied} / ${activeUnits.length}`,
            "units occupied",
            "/admin/calendar",
          ],
          [
            "Pending requests",
            String(pending.length),
            "awaiting a decision",
            "/admin/reservations?status=pending",
          ],
          [
            "Open inquiries",
            String(openInquiries.length),
            "not yet resolved",
            "/admin/inquiries",
          ],
        ].map(([label, value, note, href]) => (
          <Card
            key={label}
            className="relative p-5 transition-colors duration-ui ease-ui hover:bg-brand-light/40"
          >
            <p className="font-sans text-sm text-ink-muted">{label}</p>
            <p className="mt-1">
              <Link
                to={String(href)}
                aria-label={`${label}: ${value} ${note}`}
                className="font-heading text-3xl font-semibold tabular-nums text-brand after:absolute after:inset-0"
              >
                {value}
              </Link>
            </p>
            <p className="text-sm text-ink-muted">{note}</p>
          </Card>
        ))}
      </section>
      <Card as="section" padded={false} aria-labelledby="pending-heading">
        <h2
          id="pending-heading"
          className="p-5 font-heading text-xl text-brand-dark"
        >
          Pending requests
        </h2>
        {pending.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-muted">
            No pending requests right now.
          </p>
        ) : (
          <div className="px-2 pb-3 sm:px-3">
            <Table
              caption="Pending reservation requests"
              rows={pending}
              getRowKey={(row) => row.id}
              columns={[
                {
                  key: "guest",
                  header: "Guest and dates",
                  render: (row) => (
                    <span>
                      <span className="block font-medium text-brand-dark">
                        {guestName(row)}
                      </span>
                      <span className="text-ink-muted">
                        {formatStayDate(row.check_in)} to{" "}
                        {formatStayDate(row.check_out)}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "stay",
                  header: "Stay",
                  render: (row) => unitNames.get(row.unit_id) ?? "Stay",
                },
                {
                  key: "payment",
                  header: "Down payment",
                  render: (row) =>
                    row.source === "airbnb" ? (
                      <Badge variant="info">Via Airbnb</Badge>
                    ) : row.paid_at ? (
                      <Badge variant="confirmed">Verified</Badge>
                    ) : (
                      <Badge variant="pending">Awaiting payment</Badge>
                    ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => {
                    const needsPayment =
                      row.source === "staysync" && !row.paid_at;
                    return (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            disabled={busyId === row.id || needsPayment}
                            aria-describedby={
                              needsPayment ? `lock-${row.id}` : undefined
                            }
                            loading={busyId === row.id}
                            onClick={() =>
                              void act(
                                row,
                                () => confirmReservation(row.id),
                                "Reservation confirmed.",
                              )
                            }
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="danger"
                            disabled={busyId === row.id}
                            onClick={() => {
                              setRejectNote("");
                              setRejectTarget(row);
                            }}
                          >
                            Reject
                          </Button>
                          <Link
                            to={`/admin/reservations?id=${row.id}`}
                            className="inline-flex min-h-11 items-center px-2 font-medium text-brand underline"
                          >
                            View
                          </Link>
                        </div>
                        {needsPayment && (
                          <p
                            id={`lock-${row.id}`}
                            className="mt-1 text-sm text-ink-muted"
                          >
                            Record the down payment to unlock Confirm.
                          </p>
                        )}
                      </div>
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          as="section"
          aria-labelledby="today-heading"
          className="lg:col-span-2"
        >
          <h2
            id="today-heading"
            className="mb-4 font-heading text-xl text-brand-dark"
          >
            Today’s check-ins and check-outs
          </h2>
          {arrivals.length + departures.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No check-ins or check-outs today.
            </p>
          ) : (
            <ul className="divide-y divide-rule">
              {[
                ...arrivals.map((row) => ({ label: "Check-in", row })),
                ...departures.map((row) => ({ label: "Check-out", row })),
              ].map(({ label, row }) => (
                <li
                  key={`${label}-${row.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <p className="font-medium text-ink">
                    {guestName(row)}
                    <span className="font-normal text-ink-muted">
                      {" "}
                      · {unitNames.get(row.unit_id) ?? "Stay"}
                    </span>
                  </p>
                  <span className="text-sm text-ink-muted">{label}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card as="section" aria-labelledby="units-heading">
          <h2
            id="units-heading"
            className="mb-4 font-heading text-xl text-brand-dark"
          >
            Unit status
          </h2>
          <ul className="space-y-4">
            {activeUnits.map((unit) => {
              const stay = currentStay(unit.id);
              const next = nextStay(unit.id);
              return (
                <li key={unit.id}>
                  <p className="font-medium text-ink">{unit.name}</p>
                  <p className="text-sm text-ink-muted">
                    {stay
                      ? `Occupied by ${guestName(stay)} until ${formatStayDate(stay.check_out)}`
                      : "Vacant today"}
                  </p>
                  {next && (
                    <p className="text-sm text-ink-muted">
                      Next: {guestName(next)}, {formatStayDate(next.check_in)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card as="section" aria-labelledby="month-heading">
        <h2
          id="month-heading"
          className="mb-1 font-heading text-xl text-brand-dark"
        >
          This month
        </h2>
        <p className="mb-4 text-sm text-ink-muted">
          Confirmed and completed stays. Blocked nights are left out of
          occupancy. Revenue is an estimate from nightly rates for direct
          bookings, not money received.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {monthRows.map((entry) => (
            <li key={entry.unitId}>
              <p className="font-medium text-ink">
                {unitNames.get(entry.unitId) ?? "Stay"}
              </p>
              <p className="font-heading text-2xl tabular-nums text-brand">
                {entry.occupancyPct}% occupied
              </p>
              <p className="text-sm text-ink-muted">
                {entry.directNights} direct · {entry.airbnbNights} Airbnb ·{" "}
                {entry.blockedNights} blocked nights
              </p>
              <p className="text-sm text-ink-muted">
                Est. direct revenue {formatCurrency(entry.directRevenue)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <Card as="section" aria-labelledby="inquiries-heading">
        <h2
          id="inquiries-heading"
          className="mb-4 font-heading text-xl text-brand-dark"
        >
          Inquiries by category
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {categories.map(({ category, rows }) => (
            <li key={category} className="border-t border-rule pt-4">
              <p className="font-medium text-ink">
                {categoryLabels[category]} ({rows.length})
              </p>
              {rows.length === 0 ? (
                <p className="text-sm text-ink-muted">Nothing open.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {rows.slice(0, 3).map((row) => (
                    <li key={row.id}>
                      <Link
                        to={`/admin/inquiries?id=${row.id}`}
                        className="font-medium text-brand underline"
                      >
                        {row.subject || "Guest message"}
                      </Link>
                      <p className="line-clamp-1 text-sm text-ink-muted">
                        {row.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          const target = rejectTarget;
          setRejectTarget(null);
          if (target)
            void act(
              target,
              () => rejectReservation(target.id, rejectNote.trim()),
              "Reservation rejected.",
            );
        }}
        title="Reject this request?"
        consequence="The guest will see the request as rejected. This cannot be undone."
        confirmLabel="Reject request"
        cancelLabel="Keep pending"
      >
        <Textarea
          id="reject-note"
          label="Note for the record (optional)"
          rows={3}
          value={rejectNote}
          onChange={(event) => setRejectNote(event.target.value)}
        />
      </ConfirmDialog>
    </section>
  );
}
