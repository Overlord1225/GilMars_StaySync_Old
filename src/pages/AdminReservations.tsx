import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/useToast";
import {
  addAirbnbReservation,
  confirmReservation,
  getAllProfiles,
  getAllUnits,
  getStaffReservations,
  recordReservationDeposit,
  rejectReservation,
  rescheduleReservation,
  updateReservationStatus,
} from "@/lib/db";
import { useReservationsRealtime } from "@/hooks/useRealtime";
import { buildCsv } from "@/lib/csv";
import { formatCurrency, formatStayDate } from "@/lib/format";
import { nightsBetween } from "@/lib/dates";
import { nightlyRate } from "@/lib/pricing";
import type { Profile, Reservation, Unit } from "@/lib/types";

type FilterStatus = "all" | Reservation["status"];

const STATUS_OPTIONS: string[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

function urlDate(params: URLSearchParams, key: string) {
  const value = params.get(key) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function friendlyReservationError(error: unknown): string {
  const detail =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : {};
  if (
    detail.code === "23P01" ||
    String(detail.message ?? "").includes("overlap")
  )
    return "These dates were just taken by another confirmed booking.";
  if (String(detail.message ?? "").includes("Paid date"))
    return "Record the down payment and reference before confirming this StaySync request.";
  return "The reservation could not be updated. Check the details and try again.";
}

export default function AdminReservations() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  // Filters live in the URL so a refresh or shared link keeps them.
  // Hand-edited params fall back to the default instead of hiding every row.
  const [status, setStatus] = useState(() => {
    const value = searchParams.get("status");
    return (
      value && STATUS_OPTIONS.includes(value) ? value : "all"
    ) as FilterStatus;
  });
  const [unitFilter, setUnitFilter] = useState(
    () => searchParams.get("unit") ?? "all",
  );
  const [sourceFilter, setSourceFilter] = useState(() => {
    const value = searchParams.get("source");
    return value === "staysync" || value === "airbnb" ? value : "all";
  });
  const [dateFrom, setDateFrom] = useState(() => urlDate(searchParams, "from"));
  const [dateTo, setDateTo] = useState(() => urlDate(searchParams, "to"));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(() =>
    Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1),
  );
  const [manualOpen, setManualOpen] = useState(
    () => searchParams.get("add") === "airbnb",
  );
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<Reservation | null>(
    null,
  );
  const pinnedId = searchParams.get("id");

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const filters = {
          status,
          unit: unitFilter,
          source: sourceFilter,
          from: dateFrom,
          to: dateTo,
          page: page > 1 ? String(page) : "",
        };
        for (const [key, value] of Object.entries(filters)) {
          if (value && value !== "all") next.set(key, value);
          else next.delete(key);
        }
        return next.toString() === current.toString() ? current : next;
      },
      { replace: true },
    );
  }, [
    status,
    unitFilter,
    sourceFilter,
    dateFrom,
    dateTo,
    page,
    setSearchParams,
  ]);
  const [manual, setManual] = useState({
    unitId: "",
    guestName: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
    notes: "",
  });
  const [payment, setPayment] = useState<
    Record<string, { method: "GCash" | "Bank transfer"; reference: string }>
  >({});
  const [reschedule, setReschedule] = useState<
    Record<string, { checkIn: string; checkOut: string; reason: string }>
  >({});

  const load = useCallback(async () => {
    try {
      const [reservations, unitRows, profileRows] = await Promise.all([
        getStaffReservations(),
        getAllUnits(),
        getAllProfiles(),
      ]);
      setError("");
      setRows(reservations);
      setUnits(unitRows);
      setProfiles(profileRows);
      setManual((value) => ({
        ...value,
        unitId: value.unitId || unitRows[0]?.id || "",
      }));
    } catch {
      setError(
        "We could not load reservation records. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, refresh]);

  useReservationsRealtime(() => setRefresh((value) => value + 1));

  const unitsById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit])),
    [units],
  );
  const unitNames = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  );
  const guestNames = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile.full_name || profile.email,
        ]),
      ),
    [profiles],
  );
  const filtered = rows.filter(
    (row) =>
      (!pinnedId || row.id === pinnedId) &&
      (status === "all" || row.status === status) &&
      (unitFilter === "all" || row.unit_id === unitFilter) &&
      (sourceFilter === "all" || row.source === sourceFilter) &&
      (!dateFrom || row.check_out > dateFrom) &&
      (!dateTo || row.check_in < dateTo),
  );

  const PAGE_SIZE = 10;
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const pageReservations = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function exportCsv() {
    const csv = buildCsv(
      [
        "Guest",
        "Source",
        "Stay",
        "Check-in",
        "Check-out",
        "Guests",
        "Status",
        "Down payment",
        "Payment method",
        "Payment reference",
      ],
      filtered.map((row) => [
        row.guest_id
          ? (guestNames.get(row.guest_id) ?? "Guest")
          : (row.manual_guest_name ?? "Airbnb guest"),
        row.source === "airbnb" ? "Airbnb" : "StaySync",
        unitNames.get(row.unit_id) ?? "",
        row.check_in,
        row.check_out,
        row.num_guests,
        row.status,
        row.source === "airbnb" ? "" : row.paid_at ? "Verified" : "Pending",
        row.payment_method,
        row.payment_reference,
      ]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "reservations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function runAction(
    id: string,
    action: () => Promise<void>,
    success: string,
  ) {
    setBusyId(id);
    try {
      await action();
      showToast(success, "success");
      setRefresh((value) => value + 1);
    } catch (cause) {
      showToast(friendlyReservationError(cause), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function savePayment(row: Reservation) {
    const value = payment[row.id];
    if (!value?.reference.trim()) return;
    await runAction(
      row.id,
      () =>
        recordReservationDeposit({
          reservationId: row.id,
          method: value.method,
          reference: value.reference.trim(),
          amount: row.deposit_amount ?? 1000,
        }),
      "Down payment recorded.",
    );
  }

  async function addManualBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manual.unitId || !manual.guestName.trim()) return;
    setBusyId("manual");
    try {
      await addAirbnbReservation({
        unitId: manual.unitId,
        guestName: manual.guestName.trim(),
        checkIn: manual.checkIn,
        checkOut: manual.checkOut,
        guests: Number(manual.guests),
        notes: manual.notes.trim() || null,
      });
      setManualOpen(false);
      setManual((value) => ({
        ...value,
        guestName: "",
        checkIn: "",
        checkOut: "",
        notes: "",
      }));
      showToast("Airbnb booking added.", "success");
      setRefresh((value) => value + 1);
    } catch (cause) {
      showToast(friendlyReservationError(cause), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function saveReschedule(row: Reservation) {
    const value = reschedule[row.id];
    if (!value?.checkIn || !value.checkOut || !value.reason.trim()) return;
    await runAction(
      row.id,
      () =>
        rescheduleReservation({
          reservationId: row.id,
          checkIn: value.checkIn,
          checkOut: value.checkOut,
          unitId: row.unit_id,
          reason: value.reason.trim(),
        }),
      "Emergency reschedule saved.",
    );
    setReschedule((old) => {
      const next = { ...old };
      delete next[row.id];
      return next;
    });
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Reservations did not load"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Try again
          </Button>
        }
      />
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Reservations"
        description="Confirm requests, record down payments and add Airbnb bookings."
        actions={
          <>
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <Button onClick={() => setManualOpen((value) => !value)}>
              {manualOpen ? "Close form" : "Add Airbnb booking"}
            </Button>
          </>
        }
      />
      {manualOpen && (
        <Card>
          <form
            onSubmit={(event) => void addManualBooking(event)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Select
              id="manual-unit"
              label="Stay"
              value={manual.unitId}
              onChange={(event) =>
                setManual({ ...manual, unitId: event.target.value })
              }
            >
              {units.map((unit) => (
                <option value={unit.id} key={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
            <Input
              id="manual-name"
              label="Guest name"
              required
              value={manual.guestName}
              onChange={(event) =>
                setManual({ ...manual, guestName: event.target.value })
              }
            />
            <Input
              id="manual-checkin"
              label="Check-in"
              type="date"
              required
              value={manual.checkIn}
              onChange={(event) =>
                setManual({ ...manual, checkIn: event.target.value })
              }
            />
            <Input
              id="manual-checkout"
              label="Check-out"
              type="date"
              required
              min={manual.checkIn || undefined}
              value={manual.checkOut}
              onChange={(event) =>
                setManual({ ...manual, checkOut: event.target.value })
              }
            />
            <Input
              id="manual-guests"
              label="Guests"
              type="number"
              min="1"
              required
              value={manual.guests}
              onChange={(event) =>
                setManual({ ...manual, guests: event.target.value })
              }
            />
            <Textarea
              id="manual-notes"
              label="Notes"
              value={manual.notes}
              onChange={(event) =>
                setManual({ ...manual, notes: event.target.value })
              }
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={busyId === "manual"}>
                Save Airbnb booking
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          id="filter-status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as FilterStatus)}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </Select>
        <Select
          id="filter-unit"
          label="Stay"
          value={unitFilter}
          onChange={(event) => setUnitFilter(event.target.value)}
        >
          <option value="all">All stays</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </Select>
        <Select
          id="filter-source"
          label="Source"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
        >
          <option value="all">All sources</option>
          <option value="staysync">StaySync</option>
          <option value="airbnb">Airbnb</option>
        </Select>
        <Input
          id="filter-from"
          label="Stays from"
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          id="filter-to"
          label="Stays until"
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
      </div>
      <Button
        variant="outline"
        disabled={
          status === "all" &&
          unitFilter === "all" &&
          sourceFilter === "all" &&
          !dateFrom &&
          !dateTo
        }
        onClick={() => {
          setStatus("all");
          setUnitFilter("all");
          setSourceFilter("all");
          setDateFrom("");
          setDateTo("");
          setPage(1);
        }}
      >
        Clear filters
      </Button>
      {pinnedId && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-3 rounded-control border border-rule bg-brand-light p-3 text-sm text-brand-dark"
        >
          Showing one reservation.
          <button
            type="button"
            className="min-h-11 font-medium text-brand underline"
            onClick={() =>
              setSearchParams(
                (current) => {
                  const next = new URLSearchParams(current);
                  next.delete("id");
                  return next;
                },
                { replace: true },
              )
            }
          >
            Show all
          </button>
        </p>
      )}
      {pageReservations.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0
              ? "No reservations yet"
              : "No reservations match these filters"
          }
        />
      ) : (
        <Card as="section" padded={false} aria-label="Reservations">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Reservations</caption>
              <thead className="border-b border-rule-strong bg-paper text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  {[
                    "Guest and source",
                    "Stay",
                    "Dates",
                    "Payment",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th scope="col" key={heading} className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              {pageReservations.map((row) => {
                const guest = row.guest_id
                  ? (guestNames.get(row.guest_id) ?? "Guest")
                  : (row.manual_guest_name ?? "Airbnb guest");
                const paymentValue = payment[row.id] ?? {
                  method:
                    row.payment_method === "Bank transfer"
                      ? ("Bank transfer" as const)
                      : ("GCash" as const),
                  reference: row.payment_reference ?? "",
                };
                const nextReschedule = reschedule[row.id] ?? {
                  checkIn: row.check_in,
                  checkOut: row.check_out,
                  reason: "",
                };
                const unit = unitsById.get(row.unit_id);
                const nights = nightsBetween(row.check_in, row.check_out);
                const total = unit
                  ? nights * nightlyRate(unit, row.num_guests)
                  : 0;
                const needsPayment =
                  row.source === "staysync" &&
                  row.status === "pending" &&
                  !row.paid_at;
                const hasDetail =
                  needsPayment ||
                  row.status === "confirmed" ||
                  Boolean(row.notes);
                return (
                  <tbody key={row.id} className="border-b border-rule">
                    <tr className="align-top">
                      <th scope="row" className="px-4 py-3 font-normal">
                        <span className="block font-medium text-brand-dark">
                          {guest}
                        </span>
                        <span className="text-ink-muted">
                          {row.source === "airbnb" ? "Airbnb" : "StaySync"}
                        </span>
                      </th>
                      <td className="px-4 py-3">
                        {unitNames.get(row.unit_id) ?? "Stay"}
                      </td>
                      <td className="px-4 py-3">
                        {formatStayDate(row.check_in)} to{" "}
                        {formatStayDate(row.check_out)}
                        <span className="block text-ink-muted">
                          {nights} {nights === 1 ? "night" : "nights"} ·{" "}
                          {row.num_guests}{" "}
                          {row.num_guests === 1 ? "guest" : "guests"}
                        </span>
                        {unit && row.source === "staysync" && (
                          <span className="block text-ink-muted">
                            {formatCurrency(nightlyRate(unit, row.num_guests))}{" "}
                            / night · {formatCurrency(total)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.source === "airbnb" ? (
                          <span className="text-ink-muted">Via Airbnb</span>
                        ) : row.paid_at ? (
                          <span>
                            Down payment verified
                            <span className="block text-ink-muted">
                              {row.payment_method} · {row.payment_reference}
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            Down payment pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {row.status === "pending" && (
                            <>
                              <Button
                                disabled={busyId === row.id || needsPayment}
                                loading={busyId === row.id}
                                onClick={() =>
                                  void runAction(
                                    row.id,
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
                            </>
                          )}
                          {row.status === "confirmed" && (
                            <>
                              <Button
                                variant="outline"
                                disabled={busyId === row.id}
                                onClick={() =>
                                  void runAction(
                                    row.id,
                                    () =>
                                      updateReservationStatus(
                                        row.id,
                                        "completed",
                                      ),
                                    "Stay marked complete.",
                                  )
                                }
                              >
                                Mark completed
                              </Button>
                              <Button
                                variant="danger"
                                disabled={busyId === row.id}
                                onClick={() => setCancelTarget(row)}
                              >
                                Cancel stay
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {hasDetail && (
                      <tr>
                        <td colSpan={6} className="space-y-3 px-4 pb-4">
                          {row.notes && (
                            <p className="text-sm">
                              <span className="text-ink-muted">Notes </span>
                              {row.notes}
                            </p>
                          )}
                          {needsPayment && (
                            <>
                              <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
                                <Select
                                  id={`method-${row.id}`}
                                  label="Payment method"
                                  value={paymentValue.method}
                                  onChange={(event) =>
                                    setPayment({
                                      ...payment,
                                      [row.id]: {
                                        ...paymentValue,
                                        method: event.target.value as
                                          "GCash" | "Bank transfer",
                                      },
                                    })
                                  }
                                >
                                  <option>GCash</option>
                                  <option>Bank transfer</option>
                                </Select>
                                <Input
                                  id={`reference-${row.id}`}
                                  label={`Payment reference (${formatCurrency(row.deposit_amount ?? 1000)})`}
                                  value={paymentValue.reference}
                                  onChange={(event) =>
                                    setPayment({
                                      ...payment,
                                      [row.id]: {
                                        ...paymentValue,
                                        reference: event.target.value,
                                      },
                                    })
                                  }
                                />
                                <Button
                                  variant="outline"
                                  disabled={
                                    !paymentValue.reference.trim() ||
                                    busyId === row.id
                                  }
                                  loading={busyId === row.id}
                                  onClick={() => void savePayment(row)}
                                >
                                  Record payment
                                </Button>
                              </div>
                              <p className="text-sm text-ink-muted">
                                Record the down payment first. Confirm unlocks
                                after.
                              </p>
                            </>
                          )}
                          {row.status === "confirmed" && (
                            <details>
                              <summary className="min-h-11 cursor-pointer py-2 font-medium text-brand">
                                Emergency reschedule
                              </summary>
                              <p className="mb-3 text-sm text-ink-muted">
                                For emergencies such as floods or heavy rain.
                                Add the reason to the record.
                              </p>
                              <div className="grid gap-3 sm:grid-cols-3">
                                <Input
                                  id={`new-in-${row.id}`}
                                  label="New check-in"
                                  type="date"
                                  value={nextReschedule.checkIn}
                                  onChange={(event) =>
                                    setReschedule({
                                      ...reschedule,
                                      [row.id]: {
                                        ...nextReschedule,
                                        checkIn: event.target.value,
                                      },
                                    })
                                  }
                                />
                                <Input
                                  id={`new-out-${row.id}`}
                                  label="New check-out"
                                  type="date"
                                  value={nextReschedule.checkOut}
                                  onChange={(event) =>
                                    setReschedule({
                                      ...reschedule,
                                      [row.id]: {
                                        ...nextReschedule,
                                        checkOut: event.target.value,
                                      },
                                    })
                                  }
                                />
                                <Input
                                  id={`reason-${row.id}`}
                                  label="Reason"
                                  value={nextReschedule.reason}
                                  onChange={(event) =>
                                    setReschedule({
                                      ...reschedule,
                                      [row.id]: {
                                        ...nextReschedule,
                                        reason: event.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                              {nextReschedule.checkOut <=
                                nextReschedule.checkIn && (
                                <p className="mt-2 text-sm text-danger-700">
                                  Check-out must be after check-in.
                                </p>
                              )}
                              <Button
                                className="mt-3"
                                disabled={
                                  !nextReschedule.reason.trim() ||
                                  nextReschedule.checkOut <=
                                    nextReschedule.checkIn ||
                                  busyId === row.id
                                }
                                onClick={() => setRescheduleTarget(row)}
                              >
                                Save reschedule
                              </Button>
                            </details>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>
        </Card>
      )}
      {pageCount > 1 && (
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          label="reservations"
        />
      )}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          const target = rejectTarget;
          setRejectTarget(null);
          if (target)
            void runAction(
              target.id,
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
      <ConfirmDialog
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={() => {
          const target = rescheduleTarget;
          setRescheduleTarget(null);
          if (target) void saveReschedule(target);
        }}
        title="Move this confirmed stay?"
        consequence="The stay moves to the new dates and the old dates open up. The reason is added to the record."
        confirmLabel="Move stay"
        cancelLabel="Keep dates"
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          const target = cancelTarget;
          setCancelTarget(null);
          if (target)
            void runAction(
              target.id,
              () => updateReservationStatus(target.id, "cancelled"),
              "Reservation cancelled.",
            );
        }}
        title="Cancel this confirmed stay?"
        consequence="The dates will open up again for other guests. This cannot be undone."
        confirmLabel="Cancel stay"
        cancelLabel="Keep stay"
      />
    </section>
  );
}
