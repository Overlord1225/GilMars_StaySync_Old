import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { getActiveUnits, getBookingRules } from "../lib/db";
import { addDays, todayManila } from "../lib/dates";
import { formatCurrency } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StayImage } from "../components/public/StayImage";
import type { Unit } from "../lib/types";

export default function UnitsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [minimumDate, setMinimumDate] = useState(addDays(todayManila(), 1));
  const [guests, setGuests] = useState(Number(searchParams.get("guests")) || 1);
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") ?? "");

  useEffect(() => {
    let mounted = true;
    Promise.all([getActiveUnits(), getBookingRules()])
      .then(([unitRows, rules]) => {
        if (!mounted) return;
        setUnits(unitRows);
        setMinimumDate(
          addDays(todayManila(), Math.max(1, rules.min_advance_days ?? 1)),
        );
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? "We couldn’t load the stays. Please try again."
              : "Something went wrong while loading the stays.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [retry]);

  const matchingUnits = useMemo(
    () => units.filter((unit) => unit.capacity >= guests),
    [units, guests],
  );
  const dateQuery = new URLSearchParams();
  if (checkIn) dateQuery.set("check_in", checkIn);
  if (checkOut) dateQuery.set("check_out", checkOut);
  if (guests > 1) dateQuery.set("guests", String(guests));
  const queryString = dateQuery.size ? `?${dateQuery.toString()}` : "";
  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setRetry((value) => value + 1);
  };

  return (
    <div className="min-h-[70vh] bg-cream px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Find your stay"
          description="Five welcoming spaces, each with its own amenities and room to settle in."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stays" }]}
          actions={
            user ? (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(user.role === "guest" ? "/my-bookings" : "/admin")
                }
              >
                {user.role === "guest" ? "My reservations" : "Admin dashboard"}
              </Button>
            ) : undefined
          }
        />

        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr] lg:items-end">
            <label className="space-y-1.5 text-sm font-medium text-text">
              Check-in date
              <input
                type="date"
                min={minimumDate}
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-text">
              Check-out date
              <input
                type="date"
                min={checkIn ? addDays(checkIn, 1) : minimumDate}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-text">
              Guests
              <select
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
                className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (count) => (
                    <option value={count} key={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Your dates will carry into the stay you choose. Availability is
            confirmed before you send a request; check-out is exclusive and
            isn’t counted as a night.
          </p>
        </Card>

        {error ? (
          <EmptyState
            title="The stays didn’t load"
            description={error}
            action={
              <Button variant="outline" onClick={retryLoad}>
                Try again
              </Button>
            }
          />
        ) : loading ? (
          <div
            aria-label="Loading stays"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-card border border-border bg-surface"
              >
                <Skeleton
                  className="aspect-4/3 w-full rounded-none"
                  label="Loading stay photo"
                />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-6 w-2/3" label="Loading stay name" />
                  <Skeleton className="h-4 w-1/2" label="Loading capacity" />
                  <Skeleton
                    className="h-10 w-full"
                    label="Loading stay details"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : !units.length ? (
          <EmptyState
            title="No stays are available"
            description="There aren’t any active stays to browse right now."
            action={
              <Button variant="outline" onClick={retryLoad}>
                Check again
              </Button>
            }
          />
        ) : matchingUnits.length === 0 ? (
          <EmptyState
            title="No stay fits that group size"
            description="Try fewer guests and see which spaces could work for your group."
            action={
              <Button variant="outline" onClick={() => setGuests(1)}>
                Show every stay
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <p aria-live="polite" className="text-sm text-text-muted">
              Showing {matchingUnits.length}{" "}
              {matchingUnits.length === 1 ? "stay" : "stays"} for up to {guests}{" "}
              {guests === 1 ? "guest" : "guests"}.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matchingUnits.map((unit) => (
                <article
                  key={unit.id}
                  className="overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-ui hover:shadow-raised motion-reduce:transition-none"
                >
                  <Link
                    to={`/units/${unit.id}${queryString}`}
                    aria-label={`View ${unit.name}, sleeps up to ${unit.capacity}`}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <div className="aspect-4/3 overflow-hidden bg-brand-light">
                      <StayImage
                        src={unit.image_urls[0]}
                        alt={unit.name}
                        className="size-full transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
                      />
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-heading text-xl font-semibold text-brand-dark">
                          <Link
                            to={`/units/${unit.id}${queryString}`}
                            className="rounded-sm hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            {unit.name}
                          </Link>
                        </h2>
                        <p className="mt-1 text-sm text-text-muted">
                          Up to {unit.capacity}{" "}
                          {unit.capacity === 1 ? "guest" : "guests"}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-brand">
                        {formatCurrency(unit.price_per_night)}
                        <span className="block font-normal text-text-muted">
                          per night
                        </span>
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-text-muted">
                      {unit.description || "A comfortable space for your stay."}
                    </p>
                    <ul
                      aria-label="Amenities"
                      className="mt-3 flex min-h-7 flex-wrap gap-2"
                    >
                      {unit.amenities.slice(0, 3).map((amenity) => (
                        <li
                          key={amenity}
                          className="rounded-full border border-border bg-cream px-2.5 py-1 text-xs text-text-muted"
                        >
                          {amenity}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/units/${unit.id}${queryString}`}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-control bg-brand px-4 font-medium text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      Check dates
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
