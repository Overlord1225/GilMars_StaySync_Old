import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  getUnitById,
  getBookingRules,
  createReservationRequest,
  submitDepositReference,
} from "../lib/db";
import { addDays, earliestCheckIn, nightsBetween } from "../lib/dates";
import { formatCurrency, formatStayDate } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { Stepper } from "../components/ui/Stepper";
import { Textarea } from "../components/ui/Textarea";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useToast } from "../components/ui/useToast";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import type { BookingRule, Unit } from "../lib/types";

export default function ReservationRequest() {
  const { id: unitId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [rules, setRules] = useState<BookingRule | null>(null);
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") ?? "");
  const [numGuests, setNumGuests] = useState(searchParams.get("guests") ?? "1");
  const [notes, setNotes] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(
    Boolean(
      searchParams.get("check_in") ||
      searchParams.get("check_out") ||
      searchParams.get("guests"),
    ),
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
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
        if (!searchParams.get("check_in"))
          setCheckIn(earliestCheckIn(bookingRules.min_advance_days));
        if (!searchParams.get("check_out"))
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
  }, [unitId, user, searchParams, retry]);

  const minAdvanceDays = Math.max(1, rules?.min_advance_days ?? 1);
  const minDate = earliestCheckIn(minAdvanceDays);
  const totalNights =
    checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const totalAmount =
    unit && totalNights > 0 ? totalNights * unit.price_per_night : 0;

  function validate(): string | null {
    if (!checkIn || !checkOut)
      return "Please select both check-in and check-out dates.";
    if (checkIn < minDate)
      return `Check-in must be at least ${minAdvanceDays} ${minAdvanceDays === 1 ? "day" : "days"} from today.`;
    if (checkOut <= checkIn) return "Check-out must be after check-in.";
    const guests = Number.parseInt(numGuests, 10);
    if (!numGuests || !Number.isFinite(guests) || guests < 1)
      return "Please enter at least one guest.";
    if (unit && guests > unit.capacity)
      return `This stay fits up to ${unit.capacity} ${unit.capacity === 1 ? "guest" : "guests"}.`;
    return null;
  }

  function continueToReview() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
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
      showToast("Payment note copied.", "success");
    } catch {
      showToast(
        "Clipboard access isn’t available in this browser. You can note the payment details manually.",
        "error",
      );
    }
  }

  async function submitRequest() {
    if (!unitId || !unit || !user || saving || requestId) return;
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      setStep(0);
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
      const message =
        databaseError.code === "23P01"
          ? "Those dates were just taken. Choose another date range and check availability again."
          : String(databaseError.message ?? "")
                .toLowerCase()
                .includes("advance")
            ? `Check-in must be at least ${minAdvanceDays} ${minAdvanceDays === 1 ? "day" : "days"} from today.`
            : "We couldn’t send your request right now. Please try again; your details are still here.";
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
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate("/units")}>
              Browse stays
            </Button>
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
        steps={[
          { label: "Dates and guests" },
          { label: "Review details" },
          { label: "Down payment and confirmation" },
        ]}
        currentStep={requestId ? 2 : step}
      />

      {requestId ? (
        <Card className="space-y-5 p-5 sm:p-7">
          <div role="status">
            <h2 className="font-heading text-xl text-success-700">
              Request sent
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink">
              Reference: <strong className="break-all">{requestId}</strong>.
              Your dates aren’t held until staff verify the down payment and
              confirm.
            </p>
          </div>
          <PaymentInstructions
            requestId={requestId}
            onCopy={copyPaymentDetails}
            depositAmount={rules.deposit_amount}
          />
          <PaymentReferenceForm reservationId={requestId} />
          <Button type="button" onClick={() => navigate("/my-bookings")}>
            View my reservations
          </Button>
        </Card>
      ) : (
        <Card className="p-5 sm:p-7">
          {step === 0 && (
            <section aria-labelledby="dates-title" className="space-y-5">
              <h2
                id="dates-title"
                className="font-heading text-2xl text-brand-dark"
              >
                Dates and guests
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-ink">
                  Check-in date
                  <input
                    type="date"
                    min={minDate}
                    value={checkIn}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      setHasUnsavedChanges(true);
                      setError(null);
                    }}
                    className="min-h-11 w-full rounded-control border border-rule-strong bg-surface px-3.5 font-normal"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-ink">
                  Check-out date
                  <input
                    type="date"
                    min={checkIn ? addDays(checkIn, 1) : addDays(minDate, 1)}
                    value={checkOut}
                    onChange={(event) => {
                      setCheckOut(event.target.value);
                      setHasUnsavedChanges(true);
                      setError(null);
                    }}
                    className="min-h-11 w-full rounded-control border border-rule-strong bg-surface px-3.5 font-normal"
                  />
                </label>
              </div>
              <label className="block max-w-xs space-y-1.5 text-sm font-medium text-ink">
                Number of guests
                <input
                  type="number"
                  min="1"
                  max={unit.capacity}
                  value={numGuests}
                  onChange={(event) => {
                    setNumGuests(event.target.value);
                    setHasUnsavedChanges(true);
                    setError(null);
                  }}
                  className="min-h-11 w-full rounded-control border border-rule-strong bg-surface px-3.5 font-normal"
                />
                <span className="block text-xs font-normal text-ink-muted">
                  This stay fits up to {unit.capacity} guests.
                </span>
              </label>
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
              <p className="text-right text-xs text-ink-muted">
                {notes.length}/500
              </p>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="review-title" className="space-y-5">
              <h2
                id="review-title"
                className="font-heading text-2xl text-brand-dark"
              >
                Review your stay
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
                  value={`${formatStayDate(checkOut)} (exclusive)`}
                />
                <SummaryRow
                  label="Nights"
                  value={`${totalNights} ${totalNights === 1 ? "night" : "nights"}`}
                />
                <SummaryRow
                  label="Price per night"
                  value={formatCurrency(unit.price_per_night)}
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
              <p className="text-sm leading-6 text-ink-muted">
                A non-refundable {formatCurrency(rules.deposit_amount)} down
                payment is paid by GCash or bank transfer. Your dates are held
                only after the down payment is verified and an admin confirms
                your request. Check-out is exclusive.
              </p>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="deposit-title" className="space-y-5">
              <h2
                id="deposit-title"
                className="font-heading text-2xl text-brand-dark"
              >
                Down payment instructions
              </h2>
              <PaymentInstructions
                onCopy={copyPaymentDetails}
                depositAmount={rules.deposit_amount}
              />
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
                  className="inline-flex min-h-11 items-center justify-center rounded-control px-4 font-medium text-brand hover:bg-brand-light"
                >
                  Back to stay details
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStep((current) => Math.max(0, current - 1));
                  }}
                >
                  Back
                </Button>
              )}
              <Link
                to="/units"
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-medium text-ink-muted hover:bg-paper hover:text-brand-dark"
              >
                Cancel request
              </Link>
            </div>
            {step === 0 ? (
              <Button type="button" onClick={continueToReview}>
                Review details
              </Button>
            ) : step === 1 ? (
              <Button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                Continue to down payment
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

function PaymentReferenceForm({ reservationId }: { reservationId: string }) {
  const { showToast } = useToast();
  const [method, setMethod] = useState<"GCash" | "Bank transfer">("GCash");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference.trim() || saving) return;
    setSaving(true);
    try {
      await submitDepositReference({
        reservationId,
        method,
        reference: reference.trim(),
      });
      setSaved(true);
      showToast("Payment reference sent for staff verification.", "success");
    } catch {
      showToast(
        "The payment reference could not be sent. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-4 border-t border-rule pt-5"
    >
      <div>
        <h3 className=" text-brand-dark">Already paid the down payment?</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Send the transfer reference so staff can verify your payment.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id="payment-method"
          label="Payment method"
          value={method}
          onChange={(event) =>
            setMethod(event.target.value as "GCash" | "Bank transfer")
          }
        >
          <option>GCash</option>
          <option>Bank transfer</option>
        </Select>
        <Input
          id="payment-reference"
          label="Payment reference"
          required
          maxLength={120}
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
            setSaved(false);
          }}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        loading={saving}
        disabled={!reference.trim() || saving}
      >
        {saved ? "Send updated reference" : "Send payment reference"}
      </Button>
    </form>
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
        Pay the non-refundable {formatCurrency(depositAmount)} down payment by
        GCash or bank transfer. Ask GilMars staff for the current verified
        account details, as they aren’t stored in StaySync. Include your name
        and stay dates, and keep your transfer reference.
      </p>
      {requestId && (
        <p className="break-all text-xs text-ink-muted">
          Reference: {requestId}
        </p>
      )}
      <Button type="button" variant="outline" onClick={() => void onCopy()}>
        Copy payment note
      </Button>
    </div>
  );
}
