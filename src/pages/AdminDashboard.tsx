import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getAllInquiries,
  getAllProfiles,
  getAllUnits,
  getStaffReservations,
} from "@/lib/db";
import { todayManila } from "@/lib/dates";
import { formatStayDate } from "@/lib/format";
import type { Inquiry, Profile, Reservation, Unit } from "@/lib/types";

export default function AdminDashboard() {
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
  }, []);
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
      />
    );

  const today = todayManila();
  const month = today.slice(0, 7);
  const pending = reservations.filter((row) => row.status === "pending");
  const newInquiries = inquiries.filter((row) => row.status === "new");
  const arrivals = reservations.filter(
    (row) => row.status === "confirmed" && row.check_in === today,
  );
  const departures = reservations.filter(
    (row) => row.status === "confirmed" && row.check_out === today,
  );
  const todayArrivals = arrivals.length;
  const todayDepartures = departures.length;
  const guestNames = new Map(
    profiles.map((profile) => [profile.id, profile.full_name || profile.email]),
  );
  const guestName = (row: Reservation) =>
    row.guest_id
      ? (guestNames.get(row.guest_id) ?? "Guest")
      : (row.manual_guest_name ?? "Airbnb guest");
  const confirmedMonth = reservations.filter(
    (row) => row.status === "confirmed" && row.check_in.startsWith(month),
  ).length;
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]));
  const attention = [
    ...newInquiries
      .filter((row) => row.category === "complaint")
      .map((row) => ({ kind: "inquiry" as const, row })),
    ...pending.map((row) => ({ kind: "reservation" as const, row })),
  ].slice(0, 8);

  return (
    <section className="space-y-6">
      <PageHeader title="Admin dashboard" />
      <Card as="section" padded={false} aria-label="Summary">
        <dl className="grid grid-cols-2 divide-rule sm:grid-cols-3 sm:divide-x xl:grid-cols-5">
          {[
            [
              "Pending reservations",
              pending.length,
              "/admin/reservations?status=pending",
            ],
            ["New inquiries", newInquiries.length, "/admin/inquiries"],
            ["Today's check-ins", todayArrivals, "/admin/calendar"],
            ["Today's check-outs", todayDepartures, "/admin/calendar"],
            ["Confirmed this month", confirmedMonth, "/admin/calendar"],
          ].map(([label, value, href]) => (
            <div
              key={label}
              className="relative p-4 transition-colors hover:bg-brand-light sm:p-5"
            >
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="mt-1">
                <Link
                  to={String(href)}
                  className="font-heading text-3xl font-semibold text-brand after:absolute after:inset-0"
                >
                  {value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card as="section" aria-labelledby="today-heading">
        <h2
          id="today-heading"
          className="mb-4 font-heading text-xl text-brand-dark"
        >
          Today
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
      <Card as="section" aria-labelledby="attention-heading">
        <div className="mb-4">
          <h2
            id="attention-heading"
            className="font-heading text-xl text-brand-dark"
          >
            Needs attention
          </h2>
          <p className="text-sm text-ink-muted">
            Complaints first, then pending reservation requests.
          </p>
        </div>
        {attention.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing needs attention right now.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {attention.map(({ kind, row }) =>
              kind === "reservation" ? (
                <li
                  key={`r-${row.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      to={`/admin/reservations?id=${row.id}`}
                      className="font-medium text-brand underline"
                    >
                      Reservation request ·{" "}
                      {unitNames.get(row.unit_id) ?? "Stay"}
                    </Link>{" "}
                    <p className="text-sm text-ink-muted">
                      {formatStayDate(row.check_in)} to{" "}
                      {formatStayDate(row.check_out)} · submitted{" "}
                      {formatStayDate((row.created_at ?? "").slice(0, 10))}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ) : (
                <li
                  key={`i-${row.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      to="/admin/inquiries"
                      className="font-medium text-brand underline"
                    >
                      Complaint · {row.subject || "Guest message"}
                    </Link>
                    <p className="line-clamp-1 text-sm text-ink-muted">
                      {row.message}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ),
            )}
          </ul>
        )}
      </Card>
    </section>
  );
}
