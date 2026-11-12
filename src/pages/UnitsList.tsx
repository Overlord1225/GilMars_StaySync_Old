import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { roleHome } from "../features/auth/roleRedirect";
import { checkAvailability, getActiveUnits, getBookingRules } from "../lib/db";
import { addDays, todayManila } from "../lib/dates";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { UnitCard } from "../components/public/UnitCard";
import type { Unit } from "../lib/types";

export default function UnitsList() {
  const { user } = useAuth();
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

  // With a valid date range, ask the database which stays are free so the
  // list reflects the dates the guest typed.
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const rangeKey =
    checkIn && checkOut && checkIn >= minimumDate && checkOut > checkIn
      ? `${checkIn}:${checkOut}`
      : "";
  useEffect(() => {
    if (!rangeKey || !units.length) return;
    let mounted = true;
    const [start, end] = rangeKey.split(":") as [string, string];
    for (const unit of units) {
      checkAvailability(unit.id, start, end)
        .then((free) => {
          if (mounted)
            setAvailability((all) => ({
              ...all,
              [`${unit.id}:${rangeKey}`]: free,
            }));
        })
        .catch(() => undefined);
    }
    return () => {
      mounted = false;
    };
  }, [units, rangeKey]);

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
    <div className="min-h-[70vh] bg-paper px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Find your stay"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stays" }]}
          actions={
            user ? (
              <Link
                className={buttonClass("outline")}
                to={user.role ? roleHome(user.role) : "/"}
              >
                {user.role === "guest"
                  ? "My reservations"
                  : user.role === "super_admin"
                    ? "Owner dashboard"
                    : "Workspace"}
              </Link>
            ) : undefined
          }
        />

        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr] lg:items-end">
            <Input
              id="units-check-in"
              label="Check-in date"
              type="date"
              min={minimumDate}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
            />
            <Input
              id="units-check-out"
              label="Check-out date"
              type="date"
              min={checkIn ? addDays(checkIn, 1) : minimumDate}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
            <Select
              id="units-guests"
              label="Guests"
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map(
                (count) => (
                  <option value={count} key={count}>
                    {count} {count === 1 ? "guest" : "guests"}
                  </option>
                ),
              )}
            </Select>
          </div>
        </Card>

        {error ? (
          <EmptyState
            headingLevel={2}
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
            {[1, 2].map((item) => (
              <div key={item} className="space-y-3">
                <Skeleton
                  className="aspect-card w-full rounded-card"
                  label="Loading stay photo"
                />
                <div className="space-y-3">
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
            headingLevel={2}
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
            headingLevel={2}
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
            <p aria-live="polite" className="text-sm text-ink-muted">
              Showing {matchingUnits.length}{" "}
              {matchingUnits.length === 1 ? "stay" : "stays"} for up to {guests}{" "}
              {guests === 1 ? "guest" : "guests"}.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matchingUnits.map((unit) => (
                <UnitCard
                  key={unit.id}
                  as="article"
                  headingLevel={2}
                  unit={unit}
                  to={`/units/${unit.id}${queryString}`}
                >
                  {rangeKey &&
                    availability[`${unit.id}:${rangeKey}`] !== undefined && (
                      <p>
                        <Badge
                          variant={
                            availability[`${unit.id}:${rangeKey}`]
                              ? "confirmed"
                              : "rejected"
                          }
                        >
                          {availability[`${unit.id}:${rangeKey}`]
                            ? "Available for your dates"
                            : "Not available for your dates"}
                        </Badge>
                      </p>
                    )}
                  {unit.description && (
                    <p className="line-clamp-2 text-sm leading-5 text-ink-muted">
                      {unit.description}
                    </p>
                  )}
                </UnitCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
