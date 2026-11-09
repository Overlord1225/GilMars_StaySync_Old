import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Head } from "@/components/ui/Head";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getAllInquiries,
  getAllProfiles,
  getStaffReservations,
} from "@/lib/db";
import { formatStayDate } from "@/lib/format";
import type { Inquiry, Profile, Reservation } from "@/lib/types";

const MAX_RESULTS = 10;

export default function AdminSearch() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [data, setData] = useState<{
    reservations: Reservation[];
    inquiries: Inquiry[];
    profiles: Profile[];
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getStaffReservations(), getAllInquiries(), getAllProfiles()])
      .then(([reservations, inquiries, profiles]) => {
        if (active) setData({ reservations, inquiries, profiles });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const names = useMemo(
    () =>
      new Map(
        (data?.profiles ?? []).map((profile) => [
          profile.id,
          profile.full_name || profile.email,
        ]),
      ),
    [data],
  );

  const needle = query.trim().toLowerCase();
  const has = (...values: (string | null | undefined)[]) =>
    values.some((value) => value?.toLowerCase().includes(needle));

  const results =
    data && needle.length >= 2
      ? {
          reservations: data.reservations
            .filter((row) =>
              has(
                row.id,
                row.manual_guest_name,
                row.payment_reference,
                row.guest_id ? names.get(row.guest_id) : null,
              ),
            )
            .slice(0, MAX_RESULTS),
          inquiries: data.inquiries
            .filter((row) =>
              has(row.subject, row.message, names.get(row.guest_id)),
            )
            .slice(0, MAX_RESULTS),
          guests: data.profiles
            .filter((profile) => has(profile.full_name, profile.email))
            .slice(0, MAX_RESULTS),
        }
      : null;

  return (
    <section className="space-y-6">
      <Head title="Search" />
      <PageHeader
        title="Search"
        description="Find a guest, reservation or inquiry by name, email, payment reference, reservation ID or message text."
      />
      {error ? (
        <EmptyState
          headingLevel={2}
          role="alert"
          title="Search data did not load"
          description="Check your staff access and refresh the page."
        />
      ) : !data ? (
        <Skeleton className="h-24 w-full" label="Loading search data" />
      ) : (
        <>
          <Input
            id="admin-search"
            label="Search"
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            hint="Type at least 2 characters. Each group shows up to 10 matches."
          />
          {results && (
            <div className="space-y-4" aria-live="polite">
              <Card as="section" aria-labelledby="search-res">
                <h2
                  id="search-res"
                  className="mb-2 font-heading text-lg text-brand-dark"
                >
                  Reservations ({results.reservations.length})
                </h2>
                <ul className="divide-y divide-rule text-sm">
                  {results.reservations.map((row) => (
                    <li key={row.id} className="py-2">
                      <Link
                        className="font-medium text-brand underline"
                        to={`/admin/reservations?id=${row.id}`}
                      >
                        {row.guest_id
                          ? (names.get(row.guest_id) ?? "Guest")
                          : (row.manual_guest_name ?? "Airbnb guest")}
                      </Link>
                      <span className="text-ink-muted">
                        {" "}
                        · {formatStayDate(row.check_in)} to{" "}
                        {formatStayDate(row.check_out)} · {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card as="section" aria-labelledby="search-inq">
                <h2
                  id="search-inq"
                  className="mb-2 font-heading text-lg text-brand-dark"
                >
                  Inquiries ({results.inquiries.length})
                </h2>
                <ul className="divide-y divide-rule text-sm">
                  {results.inquiries.map((row) => (
                    <li key={row.id} className="py-2">
                      <Link
                        className="font-medium text-brand underline"
                        to={`/admin/inquiries?id=${row.id}`}
                      >
                        {row.subject || "Guest message"}
                      </Link>
                      <span className="text-ink-muted">
                        {" "}
                        · {names.get(row.guest_id) ?? "Guest"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card as="section" aria-labelledby="search-guests">
                <h2
                  id="search-guests"
                  className="mb-2 font-heading text-lg text-brand-dark"
                >
                  Accounts ({results.guests.length})
                </h2>
                <ul className="divide-y divide-rule text-sm">
                  {results.guests.map((profile) => (
                    <li key={profile.id} className="py-2">
                      <Link
                        className="font-medium text-brand underline"
                        to="/admin/guests"
                      >
                        {profile.full_name || profile.email}
                      </Link>
                      <span className="text-ink-muted">
                        {" "}
                        · {profile.email} · {profile.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </>
      )}
    </section>
  );
}
