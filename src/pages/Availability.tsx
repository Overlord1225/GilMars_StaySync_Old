import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getActiveUnits,
  getBookingRules,
  getBlockedDateRanges,
  checkAvailability as queryAvailability,
} from "../lib/db";
import { addDays, todayManila, nightsBetween } from "../lib/dates";
import { formatCurrency, formatStayDate } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { Select } from "../components/ui/Select";
import { DateRangePicker } from "../components/public/DateRangePicker";
import type { Unit } from "../lib/types";
import { useAuth } from "@/features/auth/useAuth";

export default function Availability() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "super_admin";
  const [searchParams] = useSearchParams();
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(
    searchParams.get("unit") ?? "",
  );
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") ?? "");
  const [guests, setGuests] = useState(1);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [blockedData, setBlockedData] = useState<{
    unitId: string;
    ranges: { check_in: string; check_out: string }[];
  } | null>(null);
  const [minDate, setMinDate] = useState(addDays(todayManila(), 1));
  const [minAdvance, setMinAdvance] = useState(1);
  const [depositAmount, setDepositAmount] = useState(1500);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [blockedError, setBlockedError] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedRetry, setBlockedRetry] = useState(0);

  useEffect(() => {
    let mounted = true;
    Promise.all([getActiveUnits(), getBookingRules()])
      .then(([unitRows, rules]) => {
        if (!mounted) return;
        setUnits(unitRows);
        const advanceDays = Math.max(1, rules.min_advance_days ?? 1);
        setMinAdvance(advanceDays);
        setDepositAmount(rules.deposit_amount);
        setMinDate(addDays(todayManila(), advanceDays));
      })
      .catch(() => {
        if (mounted)
          setLoadError(
            "We couldn’t load stays and booking rules. Please try again.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!selectedUnit) {
      // oxlint-disable-next-line react/set-state-in-effect -- reset when no unit is selected
      setBlockedData(null);
      setBlockedError(false);
      setBlockedLoading(false);
      return;
    }
    let mounted = true;
    setBlockedError(false);
    setBlockedLoading(true);
    getBlockedDateRanges(selectedUnit)
      .then((ranges) => {
        if (mounted) {
          setBlockedData({ unitId: selectedUnit, ranges });
          setBlockedError(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setBlockedData({ unitId: selectedUnit, ranges: [] });
          setBlockedError(true);
        }
      })
      .finally(() => {
        if (mounted) setBlockedLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedUnit, blockedRetry]);

  const unit = units?.find((item) => item.id === selectedUnit);
  const blockedRanges =
    blockedData?.unitId === selectedUnit ? blockedData.ranges : [];
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const price = unit && nights > 0 ? unit.price_per_night * nights : 0;
  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    setRetry((value) => value + 1);
  };

  function changeDates(start: string, end: string) {
    setCheckIn(start);
    setCheckOut(end);
    setAvailable(null);
    setCheckError(null);
  }

  async function checkAvailability() {
    if (!selectedUnit || !unit || !checkIn || !checkOut) return;
    if (guests > unit.capacity) {
      setCheckError(
        `This stay fits up to ${unit.capacity} ${unit.capacity === 1 ? "guest" : "guests"}.`,
      );
      return;
    }
    setChecking(true);
    setCheckError(null);
    setAvailable(null);
    try {
      setAvailable(await queryAvailability(selectedUnit, checkIn, checkOut));
    } catch {
      setCheckError("We couldn’t check those dates. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  if (loadError)
    return (
      <div className="px-4 py-16">
        <EmptyState
          headingLevel={1}
          title="Availability didn’t load"
          description={loadError}
          action={
            <Button variant="outline" onClick={retryLoad}>
              Try again
            </Button>
          }
        />
      </div>
    );
  if (!units?.length)
    return (
      <div className="px-4 py-16">
        <EmptyState
          headingLevel={1}
          title="No stays are available"
          description="Please check back soon, or contact the GilMars team."
          action={
            <Link
              to="/units"
              className="inline-flex min-h-11 items-center text-brand underline"
            >
              Browse stays
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="min-h-[70vh] bg-mist px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-7">
        <PageHeader title="Check availability" />
        <Card className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="availability-unit"
              label="Choose a stay"
              value={selectedUnit}
              onChange={(event) => {
                setSelectedUnit(event.target.value);
                setAvailable(null);
                setCheckError(null);
              }}
            >
              <option value="">Select a stay</option>
              {units.map((stay) => (
                <option key={stay.id} value={stay.id}>
                  {stay.name} — {formatCurrency(stay.price_per_night)} per night
                </option>
              ))}
            </Select>
            <label className="space-y-1.5 text-sm font-medium text-text">
              Number of guests
              <select
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
                className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal"
              >
                {Array.from(
                  { length: Math.max(1, unit?.capacity ?? 10) },
                  (_, index) => index + 1,
                ).map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            minDate={minDate}
            minAdvanceDays={minAdvance}
            blockedRanges={blockedRanges}
            onChange={changeDates}
          />
          <Button
            type="button"
            onClick={checkAvailability}
            loading={checking}
            disabled={
              checking ||
              !unit ||
              !checkIn ||
              !checkOut ||
              nights < 1 ||
              blockedError ||
              blockedLoading
            }
            className="w-full sm:w-auto"
          >
            Check these dates
          </Button>
          {blockedError && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              We couldn’t load blocked dates for this stay.{" "}
              <button
                type="button"
                className="font-medium text-brand underline"
                onClick={() => setBlockedRetry((v) => v + 1)}
              >
                Retry
              </button>
            </p>
          )}
          {checkError && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {checkError}
            </p>
          )}
          <div aria-live="polite" aria-atomic="true">
            {available === true && unit && (
              <div className="space-y-3">
                <p className="font-semibold text-success-700">
                  Your dates are available
                </p>
                <dl className="space-y-1 text-sm text-text">
                  <div className="flex gap-2">
                    <dt className="text-text-muted">Stay</dt>
                    <dd>
                      {nights} {nights === 1 ? "night" : "nights"},{" "}
                      {formatStayDate(checkIn)} to {formatStayDate(checkOut)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-text-muted">Estimated stay</dt>
                    <dd className="font-semibold">{formatCurrency(price)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-text-muted">Deposit</dt>
                    <dd className="font-semibold">
                      {formatCurrency(depositAmount)}
                    </dd>
                  </div>
                </dl>
                {!isStaff && (
                  <Link
                    to={`/reservations/request/${unit.id}?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}&guests=${guests}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark sm:w-auto"
                  >
                    Request this stay
                  </Link>
                )}
              </div>
            )}
            {available === false && (
              <div className="space-y-1">
                <p className="font-semibold text-warning-800">
                  Those dates aren’t available
                </p>
                <p className="text-sm leading-5 text-text">
                  Choose different dates or{" "}
                  <Link
                    to="/units"
                    className="font-medium text-brand underline"
                  >
                    explore another stay
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
