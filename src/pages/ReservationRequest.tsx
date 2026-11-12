import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  getUnitById,
  getBookingRules,
  createReservationRequest,
  getBlockedDateRanges,
} from "../lib/db";
import {
  addDays,
  earliestCheckIn,
  nightsBetween,
  todayManila,
} from "../lib/dates";
import { formatCurrency, formatStayDate } from "../lib/format";
import { nightlyRate } from "../lib/pricing";
import { CONTACT_EMAIL } from "../lib/policies";
import { DateRangePicker } from "../components/public/DateRangePicker";
import { GuestStepper } from "../components/public/GuestStepper";
import { PaymentReferenceForm } from "../components/public/PaymentReferenceForm";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { Stepper } from "../components/ui/Stepper";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/useToast";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import type { BookingRule, Unit } from "../lib/types";

// Links can carry any text; keep only a real YYYY-MM-DD date, else "".
function dateParam(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  try {
    return addDays(value, 0) === value ? value : "";
  } catch {
    return "";
  }
}

export default function ReservationRequest() {
  const { id: unitId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [rules, setRules] = useState<BookingRule | null>(null);
  const checkInParam = dateParam(searchParams.get("check_in"));
  const checkOutParam = dateParam(searchParams.get("check_out"));
  const guestsParam = /^\d+$/.test(searchParams.get("guests") ?? "")
    ? (searchParams.get("guests") as string)
    : "";
  const [checkIn, setCheckIn] = useState(checkInParam);
  const [checkOut, setCheckOut] = useState(checkOutParam);
  const [numGuests, setNumGuests] = useState(guestsParam || "1");
  const [notes, setNotes] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(
    Boolean(checkInParam || checkOutParam || guestsParam),
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [blocked, setBlocked] = useState<
    { check_in: string; check_out: string }[]
  >([]);
  const [blockedError, setBlockedError] = useState(false);
  useUnsavedChangesGuard(
    hasUnsavedChanges && !requestId,
    "You have an unfinished reservation request. Leave this page and discard it?",
  );

  useEffect(() => {
    if (!unitId || !user) return;
    let mounted = true;
    getUnitById(unitId)
      .then((unitData) => {
        if (mounted) setUnit(unitData);
      })
      .then(() => getBookingRules())
      .then((bookingRules) => {
        if (!mounted) return;
        setRules(bookingRules);
        if (!checkInParam)
          setCheckIn(earliestCheckIn(bookingRules.min_advance_days));
        if (!checkOutParam)
          setCheckOut(
            addDays(earliestCheckIn(bookingRules.min_advance_days), 1),
          );
      })
      .catch(() => {
        if (mounted)
          setError("We couldn’t load the request details. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [unitId, user, checkInParam, checkOutParam, retry]);

  useEffect(() => {
    if (!unitId || !user) return;
    let mounted = true;
    getBlockedDateRanges(unitId)
      .then((ranges) => {
        if (mounted) {
          setBlocked(ranges);
          setBlockedError(false);
        }
      })
      .catch(() => {
        if (mounted) setBlockedError(true);
      });
    return () => {
      mounted = false;
    };
  }, [unitId, user, retry]);

  const minAdvanceDays = Math.max(1, rules?.min_advance_days ?? 1);
  const maxAdvanceDays = rules?.max_advance_days ?? 365;
  const maxStayNights = rules?.max_stay_nights ?? 30;
  const minDate = earliestCheckIn(minAdvanceDays);
  const totalNights =
    checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const guestCount = Math.max(1, Number.parseInt(numGuests, 10) || 1);
  const totalAmount =
    unit && totalNights > 0 ? totalNights * nightlyRate(unit, guestCount) : 0;

  function validate(): { field: string; message: string } | null {
    if (!checkIn)
      return {
        field: "stay-dates",
        message: "Please select a check-in date.",
      };
    if (!checkOut)
      return {
        field: "stay-dates",
        message: "Please select a check-out date.",
      };
    if (checkIn < minDate)
      return {
        field: "stay-dates",
        message: `Check-in must be at least ${minAdvanceDays} ${minAdvanceDays === 1 ? "day" : "days"} from today.`,
      };
    if (checkOut <= checkIn)
      return {
        field: "stay-dates",
        message: "Check-out must be after check-in.",
      };
    if (checkIn > addDays(todayManila(), maxAdvanceDays))
      return {
        field: "stay-dates",
        message: `Check-in can be at most ${maxAdvanceDays} days from today.`,
      };
    if (nightsBetween(checkIn, checkOut) > maxStayNights)
      return {
        field: "stay-dates",
        message: `A stay can be at most ${maxStayNights} ${maxStayNights === 1 ? "night" : "nights"}.`,
      };
    if (blocked.some((r) => checkIn < r.check_out && checkOut > r.check_in))
      return {
        field: "stay-dates",
        message:
          "Some of those nights are already booked. Choose different dates.",
      };
    const guests = Number.parseInt(numGuests, 10);
    if (!/^\d+$/.test(numGuests.trim()) || guests < 1)
      return {
        field: "stay-guests",
        message: "Please enter at least one guest.",
      };
    if (unit && guests > unit.capacity)
      return {
        field: "stay-guests",
        message: `This stay fits up to ${unit.capacity} ${unit.capacity === 1 ? "guest" : "guests"}.`,
      };
    return null;
  }

  function showFieldError(problem: { field: string; message: string }) {
    setFieldError(problem);
    setError(null);
    document.getElementById(problem.field)?.focus();
  }

  function continueToReview() {
    const problem = validate();
    if (problem) {
      showFieldError(problem);
      return;
    }
    setFieldError(null);
    setError(null);
    setHasUnsavedChanges(true);
    setStep(1);
  }

  async function copyPaymentDetails() {
    const reference = requestId
      ? ` Reservation request reference: ${requestId}.`
      : "";
    const text = `GilMars StaySync down payment: ${formatCurrency(rules?.deposit_amount ?? 1000)} by GCash or bank transfer.${reference} Please use verified receiving details shared by GilMars staff.`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Reference and amount copied.", "success");
    } catch {
      showToast(
        "Clipboard access isn’t available in this browser. You can note the reference and amount manually.",
        "error",
      );
    }
  }

  async function submitRequest() {
    if (!unitId || !unit || !user || saving || requestId) return;
    const problem = validate();
    if (problem) {
      setStep(0);
      // Fields mount after the step change, so focus on the next frame.
      requestAnimationFrame(() => showFieldError(problem));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = await createReservationRequest({
        unitId,
        checkIn,
        checkOut,
        numGuests: Number.parseInt(numGuests, 10),
        notes: notes.trim() || null,
      });
      setRequestId(id);
      showToast("Your reservation request was sent.", "success");
    } catch (cause) {
      const databaseError =
        typeof cause === "object" && cause !== null
          ? (cause as { code?: unknown; message?: unknown })
          : {};
      const text = String(databaseError.message ?? "").toLowerCase();
      // shortcut: matches DB message wording, update with the RPC's messages
      let message =
        "We couldn’t send your request right now. Please try again; your details are still here.";
      if (databaseError.code === "23P01")
        message =
          "Those dates were just taken. Choose another date range and check availability again.";
      else if (text.includes("advance"))
        message = `Check-in must be at least ${minAdvanceDays} ${minAdvanceDays === 1 ? "day" : "days"} from today.`;
      else if (text.includes("booking window"))
        message = `Check-in can be at most ${maxAdvanceDays} days from today.`;
      else if (text.includes("maximum number"))
        message = `A stay can be at most ${maxStayNights} ${maxStayNights === 1 ? "night" : "nights"}.`;
      setError(message);
      showToast("The request wasn’t sent. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setRetry((value) => value + 1);
  };

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  if (!unit || !rules || !user)
    return (
      <EmptyState
        title={
          error
            ? "Request details didn’t load"
            : !user
              ? "Sign in to request a stay"
              : "Stay not found"
        }
        description={
          error ??
          (!user
            ? "Sign in to continue with your reservation request."
            : "This stay could not be found. Browse the other GilMars stays.")
        }
        action={
          error ? (
            <Button variant="outline" onClick={retryLoad}>
              Try again
            </Button>
          ) : !user ? (
            <Link className={buttonClass("outline")} to="/login">
              Sign in
            </Link>
          ) : (
            <Link className={buttonClass("outline")} to="/units">
              Browse stays
            </Link>
          )
        }
      />
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-3">
      <PageHeader
        title={requestId ? "Request received" : "Request your stay"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Stays", href: "/units" },
          { label: unit.name, href: `/units/${unitId}` },
          { label: "Request" },
        ]}
      />
      <Stepper
        steps={[{ label: "Your stay" }, { label: "Review and send" }]}
        currentStep={requestId ? 2 : step}
      />

      {requestId ? (
        <Card className="space-y-5 p-5 sm:p-7">
          <div role="status">
            <h2 className="font-heading text-xl text-success-700">
              Request sent
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink">
              Your dates aren’t held until staff verify the down payment and
              confirm.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg text-brand-dark">
              What happens next
            </h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-muted">
              <li>
                Email GilMars to get the GCash or bank account details. Staff
                also send them to you.
              </li>
              <li>
                Pay the down payment. Include your name and stay dates, and keep
                your transfer reference.
              </li>
              <li>Send the transfer reference below so staff can verify it.</li>
            </ol>
          </div>
          <PaymentInstructions
            requestId={requestId}
            onCopy={copyPaymentDetails}
            depositAmount={rules.deposit_amount}
          />
          <div className="space-y-4 border-t border-rule pt-5">
            <div>
              <h3 className="font-heading text-lg text-brand-dark">
                Already paid the down payment?
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Send the transfer reference so staff can verify your payment.
                You can also do this later from My reservations.
              </p>
            </div>
            <PaymentReferenceForm reservationId={requestId} />
          </div>
          <Link className={buttonClass("secondary")} to="/my-bookings">
            View my reservations
          </Link>
        </Card>
      ) : (
        <Card className="p-5 sm:p-7">
          {step === 0 && (
            <section
              aria-labelledby="dates-title"
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]"
            >
              <div className="space-y-5">
                <h2
                  id="dates-title"
                  className="font-heading text-2xl text-brand-dark"
                >
                  Your stay
                </h2>
                <div id="stay-dates" tabIndex={-1} className="space-y-2">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    minDate={minDate}
                    minAdvanceDays={minAdvanceDays}
                    maxDate={addDays(todayManila(), maxAdvanceDays)}
                    maxNights={maxStayNights}
                    blockedRanges={blocked}
                    onChange={(nextIn, nextOut) => {
                      setCheckIn(nextIn);
                      setCheckOut(nextOut);
                      setHasUnsavedChanges(true);
                      setError(null);
                      setFieldError(null);
                    }}
                  />
                  {blockedError && (
                    <p className="text-sm text-ink-muted">
                      We couldn’t load booked dates. Staff will check them when
                      they review your request.
                    </p>
                  )}
                  {fieldError?.field === "stay-dates" && (
                    <p role="alert" className="text-sm text-danger-700">
                      {fieldError.message}
                    </p>
                  )}
                </div>
                <div className="max-w-xs">
                  <GuestStepper
                    id="stay-guests"
                    value={guestCount}
                    max={unit.capacity}
                    error={
                      fieldError?.field === "stay-guests"
                        ? fieldError.message
                        : undefined
                    }
                    onChange={(next) => {
                      setNumGuests(String(next));
                      setHasUnsavedChanges(true);
                      setError(null);
                      setFieldError(null);
                    }}
                  />
                </div>
                <div>
                  <Textarea
                    id="stay-notes"
                    label="Notes for the host (optional)"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    hint="Share anything the team should know about your request."
                  />
                  <p className="mt-1 text-right text-xs text-ink-muted">
                    {notes.length}/500
                  </p>
                </div>
              </div>
              <aside
                aria-label="Price estimate"
                className="h-fit rounded-card border border-rule bg-paper p-4 lg:sticky lg:top-4"
              >
                <h3 className="font-heading text-lg text-brand-dark">
                  Estimate
                </h3>
                <dl className="mt-2 divide-y divide-rule">
                  <SummaryRow
                    label="Nights"
                    value={totalNights > 0 ? String(totalNights) : "—"}
                  />
                  <SummaryRow
                    label="Per night"
                    value={formatCurrency(nightlyRate(unit, guestCount))}
                  />
                  <SummaryRow
                    label="Estimated stay"
                    value={totalNights > 0 ? formatCurrency(totalAmount) : "—"}
                    strong
                  />
                </dl>
                <p className="mt-3 text-xs leading-5 text-ink-muted">
                  Check-out is the morning you leave, so that night isn’t
                  counted.
                </p>
              </aside>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="review-title" className="space-y-5">
              <h2
                id="review-title"
                className="font-heading text-2xl text-brand-dark"
              >
                Review and send
              </h2>
              <dl className="divide-y divide-rule">
                <SummaryRow label="Stay" value={unit.name} />
                <SummaryRow
                  label="Guests"
                  value={`${numGuests} ${Number(numGuests) === 1 ? "guest" : "guests"}`}
                />
                <SummaryRow label="Check-in" value={formatStayDate(checkIn)} />
                <SummaryRow
                  label="Check-out"
                  value={formatStayDate(checkOut)}
                />
                <SummaryRow
                  label="Nights"
                  value={`${totalNights} ${totalNights === 1 ? "night" : "nights"}`}
                />
                <SummaryRow
                  label="Price per night"
                  value={formatCurrency(nightlyRate(unit, guestCount))}
                />
                <SummaryRow
                  label="Estimated stay"
                  value={formatCurrency(totalAmount)}
                  strong
                />
              </dl>
              {notes && (
                <dl>
                  <SummaryRow label="Note for the host" value={notes} />
                </dl>
              )}
              <div className="space-y-3 border-t border-rule pt-5">
                <h3 className="font-heading text-lg text-brand-dark">
                  Down payment
                </h3>
                <p className="text-sm leading-6 text-ink-muted">
                  Your dates are held only after the down payment is verified
                  and staff confirm your request.
                </p>
                <PaymentInstructions
                  onCopy={copyPaymentDetails}
                  depositAmount={rules.deposit_amount}
                />
              </div>
            </section>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {error}
            </p>
          )}
          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {step === 0 ? (
                <Link
                  to={`/units/${unit.id}`}
                  className={buttonClass("ghost", "sm:-ml-5")}
                >
                  Back to stay details
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStep(0);
                  }}
                >
                  Back
                </Button>
              )}
              <Link to="/units" className={buttonClass("ghost")}>
                Discard
              </Link>
            </div>
            {step === 0 ? (
              <Button type="button" onClick={continueToReview}>
                Review details
              </Button>
            ) : (
              <Button
                type="button"
                loading={saving}
                disabled={saving}
                onClick={() => void submitRequest()}
              >
                Send reservation request
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 py-3 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`text-right ${strong ? "font-semibold text-brand-dark" : "font-medium text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function PaymentInstructions({
  requestId,
  depositAmount,
  onCopy,
}: {
  requestId?: string;
  depositAmount: number;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-ink-muted">
        The down payment is {formatCurrency(depositAmount)} and is
        non-refundable.
        {!requestId &&
          " Staff will send you the GCash or bank account details; StaySync doesn’t store them. When you pay, include your name and stay dates, and keep your transfer reference."}
      </p>
      {requestId && (
        <>
          <p className="break-all text-xs text-ink-muted">
            Reference: {requestId}
          </p>
          <a
            className={buttonClass("primary")}
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Down payment details for request ${requestId}`)}`}
          >
            Email GilMars for payment details
          </a>
        </>
      )}
      <Button type="button" variant="outline" onClick={() => void onCopy()}>
        Copy reference and amount
      </Button>
    </div>
  );
}
