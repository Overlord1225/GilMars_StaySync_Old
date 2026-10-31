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
import { addDays, todayManila, nightsBetween } from "../lib/dates";
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
          setCheckIn(
            addDays(todayManila(), Math.max(1, bookingRules.min_advance_days)),
          );
        if (!searchParams.get("check_out"))
          setCheckOut(
            addDays(
              todayManila(),
              Math.max(1, bookingRules.min_advance_days) + 1,
            ),
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
  const minDate = addDays(todayManila(), minAdvanceDays);
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

  async function copyPaymentDetails(method: "GCash" | "bank transfer") {
    const reference = requestId
      ? ` Reservation request reference: ${requestId}.`
      : "";
    const text = `GilMars StaySync deposit: ${formatCurrency(rules?.deposit_amount ?? 1500)} by ${method}.${reference} Please use verified receiving details shared by GilMars staff.`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${method} payment note copied.`, "success");
    } catch {
      showToast(
        `Clipboard access isn’t available in this browser. You can note the ${formatCurrency(rules?.deposit_amount ?? 1500)} deposit manually.`,
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
        description={
          requestId
            ? "Your reservation request is on its way to the GilMars team."
            : "Review your stay details, then send your reservation request."
        }
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
          { label: "Deposit and confirmation" },
        ]}
        currentStep={requestId ? 2 : step}
      />

      {requestId ? (
        <Card className="space-y-5 p-5 sm:p-7">
          <div
            role="status"
            className="rounded-card border border-success-200 bg-success-50 p-4"
          >
            <h2 className="font-heading text-xl font-semibold text-success-700">
              Request sent successfully
            </h2>
            <p className="mt-1 text-sm leading-6 text-text">
              Request reference:{" "}
              <strong className="break-all">{requestId}</strong>. The dates
              aren’t held yet. GilMars staff must verify the deposit and confirm
              your stay.
            </p>
          </div>
          <PaymentInstructions
            requestId={requestId}
            onCopy={copyPaymentDetails}
            depositAmount={rules.deposit_amount}
          />
          <PaymentReferenceForm reservationId={requestId} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => navigate("/my-bookings")}>
              View my reservations
            </Button>
            <Link
              to="/inquire"
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 font-medium text-text hover:bg-cream focus-visible:ring-2 focus-visible:ring-brand"
            >
              Ask about payment details
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-5 sm:p-7">
          {step === 0 && (
            <section aria-labelledby="dates-title" className="space-y-5">
              <div>
                <h2
                  id="dates-title"
                  className="font-heading text-2xl font-semibold text-brand-dark"
                >
                  Dates and guests
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Choose dates in advance. Check-out is exclusive and isn’t
                  counted as a night.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-text">
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
                    className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-text">
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
                    className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </label>
              </div>
              <label className="block max-w-xs space-y-1.5 text-sm font-medium text-text">
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
                  className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
                />
                <span className="block text-xs font-normal text-text-muted">
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
              <p className="text-right text-xs text-text-muted">
                {notes.length}/500
              </p>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="review-title" className="space-y-5">
              <div>
                <h2
                  id="review-title"
                  className="font-heading text-2xl font-semibold text-brand-dark"
                >
                  Review your stay
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Check the details before you continue to the deposit
                  instructions.
                </p>
              </div>
              <dl className="divide-y divide-border rounded-card border border-border bg-cream px-4">
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
                <div className="rounded-control border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Note for the host
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text">
                    {notes}
                  </p>
                </div>
              )}
              <p className="text-sm leading-6 text-text-muted">
                A fixed {formatCurrency(rules.deposit_amount)} deposit is paid
                by GCash or bank transfer. Your dates are held only after the
                deposit is verified and an admin confirms your request.
              </p>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="deposit-title" className="space-y-5">
              <div>
                <h2
                  id="deposit-title"
                  className="font-heading text-2xl font-semibold text-brand-dark"
                >
                  Deposit instructions
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Your fixed deposit is {formatCurrency(rules.deposit_amount)}.
                  Choose GCash or bank transfer.
                </p>
              </div>
              <PaymentInstructions
                onCopy={copyPaymentDetails}
                depositAmount={rules.deposit_amount}
              />
              <div className="rounded-control border border-warning-200 bg-warning-50 p-4 text-sm leading-6 text-warning-800">
                <strong>Before sending payment:</strong> ask GilMars staff for
                the current verified GCash number or bank account details.
                Payment account details aren’t stored in StaySync. Keep your
                transfer reference; the admin will verify it and confirm your
                dates.
              </div>
              <p className="text-sm leading-6 text-text-muted">
                Your dates aren’t held until the deposit is verified and an
                admin confirms the request. Rescheduling is considered only in
                emergencies.
              </p>
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
          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {step === 0 ? (
                <Link
                  to={`/units/${unit.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-control px-4 font-medium text-brand hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand"
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
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-medium text-text-muted hover:bg-cream hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand"
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
                Continue to deposit
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
          {step === 2 && (
            <p className="mt-3 text-center text-xs leading-5 text-text-muted">
              The request won’t be sent until you select “Send reservation
              request.”
            </p>
          )}
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
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={`text-right ${strong ? "font-semibold text-brand-dark" : "font-medium text-text"}`}
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
      className="space-y-4 rounded-card border border-border bg-cream p-4"
    >
      <div>
        <h3 className="font-semibold text-brand-dark">
          Already paid the deposit?
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          Send the transfer reference so GilMars staff can verify your payment.
          Your dates are not held until staff confirms the request.
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
  onCopy: (method: "GCash" | "bank transfer") => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-4">
        <h3 className="font-semibold text-brand-dark">GCash</h3>
        <p className="mt-1 text-sm leading-5 text-text-muted">
          Deposit {formatCurrency(depositAmount)} using the verified GCash
          details from GilMars staff. Include your name and stay dates.
        </p>
        {requestId && (
          <p className="mt-2 break-all text-xs text-text-muted">
            Reference: {requestId}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => void onCopy("GCash")}
        >
          Copy payment note
        </Button>
      </div>
      <div className="rounded-card border border-border bg-surface p-4">
        <h3 className="font-semibold text-brand-dark">Bank transfer</h3>
        <p className="mt-1 text-sm leading-5 text-text-muted">
          Deposit {formatCurrency(depositAmount)} using the verified bank
          details from GilMars staff. Include your name and stay dates.
        </p>
        {requestId && (
          <p className="mt-2 break-all text-xs text-text-muted">
            Reference: {requestId}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => void onCopy("bank transfer")}
        >
          Copy payment note
        </Button>
      </div>
    </div>
  );
}
