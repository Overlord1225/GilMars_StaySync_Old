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
import { sourceLabel } from "@/lib/calendar";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/useToast";
import {
  addAirbnbReservation,
  addDateBlock,
  addReservationStaffNote,
  expireStaleRequests,
  confirmReservation,
  getAllProfiles,
  getAllUnits,
  getReservationStaffNotes,
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
import type {
  Profile,
  Reservation,
  ReservationStaffNote,
  Unit,
} from "@/lib/types";

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

// Under md each row becomes a stacked card: cells show their heading as a label.
const cellClass =
  "grid grid-cols-[minmax(5rem,35%)_1fr] gap-3 border-b border-rule/70 px-3 py-2.5 before:content-[attr(data-label)] before:text-xs before:font-semibold before:text-ink-muted md:table-cell md:border-0 md:px-4 md:py-3 md:before:hidden";

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
    return value === "staysync" || value === "airbnb" || value === "block"
      ? value
      : "all";
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
    unitId: searchParams.get("unitId") ?? "",
    guestName: "",
    checkIn: urlDate(searchParams, "start"),
    checkOut: "",
    guests: "1",
    notes: "",
  });
  const [staffNotes, setStaffNotes] = useState<ReservationStaffNote[]>([]);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [block, setBlock] = useState({
    unitId: searchParams.get("unitId") ?? "",
    reason: "",
    start: urlDate(searchParams, "start"),
    end: "",
  });
  const [payment, setPayment] = useState<
    Record<string, { method: "GCash" | "Bank transfer"; reference: string }>
  >({});
  const [reschedule, setReschedule] = useState<
    Record<string, { checkIn: string; checkOut: string; reason: string }>
  >({});

  const load = useCallback(async () => {
    try {
      // Housekeeping only: a failure must not block the list from loading.
      await expireStaleRequests().catch(() => 0);
      const [reservations, unitRows, profileRows, noteRows] = await Promise.all(
        [
          getStaffReservations(),
          getAllUnits(),
          getAllProfiles(),
          // Notes are secondary: if they fail, the reservation list still loads.
          getReservationStaffNotes().catch(() => []),
        ],
      );
      setError("");
      setRows(reservations);
      setStaffNotes(noteRows);
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

  // j/k pick a row, c confirms it, p jumps to its payment reference.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageIds = pageReservations.map((row) => row.id).join(",");
  useEffect(() => {
    const ids = pageIds ? pageIds.split(",") : [];
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (
        el?.closest("input, textarea, select, [contenteditable], [role=dialog]")
      )
        return;
      const at = selectedId ? ids.indexOf(selectedId) : -1;
      if (event.key === "j" || event.key === "k") {
        const next =
          ids[at + (event.key === "j" ? 1 : -1)] ?? ids[Math.max(at, 0)];
        if (!next) return;
        setSelectedId(next);
        document
          .querySelector(`[data-row-id="${next}"]`)
          ?.scrollIntoView({ block: "nearest" });
      } else if (selectedId && event.key === "c") {
        document
          .querySelector<HTMLButtonElement>(`[data-confirm="${selectedId}"]`)
          ?.click();
      } else if (selectedId && event.key === "p") {
        event.preventDefault();
        document.getElementById(`reference-${selectedId}`)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageIds, selectedId]);

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
        sourceLabel(row.source),
        unitNames.get(row.unit_id) ?? "",
        row.check_in,
        row.check_out,
        row.num_guests,
        row.status,
        row.source !== "staysync" ? "" : row.paid_at ? "Verified" : "Pending",
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

  /** Undo for a just-created Airbnb booking or block: cancel it again. */
  function undoCreate(id: string) {
    return {
      label: "Undo",
      onClick: () => {
        updateReservationStatus(id, "cancelled")
          .then(() => {
            showToast("Undone.", "success");
            setRefresh((value) => value + 1);
          })
          .catch((cause) =>
            showToast(friendlyReservationError(cause), "error"),
          );
      },
    };
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
    // Untouched form: fall back to what the row already shows, like the inputs do.
    const value = payment[row.id] ?? {
      method:
        row.payment_method === "Bank transfer"
          ? ("Bank transfer" as const)
          : ("GCash" as const),
      reference: row.payment_reference ?? "",
    };
    if (!value.reference.trim()) return;
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
      const createdId = await addAirbnbReservation({
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
      showToast("Airbnb booking added.", "success", undoCreate(createdId));
      setRefresh((value) => value + 1);
    } catch (cause) {
      showToast(friendlyReservationError(cause), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function saveNote(row: Reservation) {
    const note = noteDraft[row.id]?.trim();
    if (!note) return;
    setBusyId(`note-${row.id}`);
    try {
      await addReservationStaffNote(row.id, note);
      setNoteDraft((old) => ({ ...old, [row.id]: "" }));
      showToast("Note saved.", "success");
      setRefresh((value) => value + 1);
    } catch {
      showToast("We couldn’t save the note. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const unitId = block.unitId || units[0]?.id;
    if (!unitId || !block.reason.trim()) return;
    setBusyId("block");
    try {
      const createdId = await addDateBlock({
        unitId,
        reason: block.reason.trim(),
        start: block.start,
        end: block.end,
      });
      setBlock((value) => ({ ...value, reason: "", start: "", end: "" }));
      showToast("Dates blocked.", "success", undoCreate(createdId));
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
      <Card>
        <h2 className="mb-4 text-2xl text-brand-dark">Block dates</h2>
        <form
          onSubmit={(event) => void saveBlock(event)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Select
            id="block-unit"
            label="Stay"
            value={block.unitId || units[0]?.id || ""}
            onChange={(event) =>
              setBlock({ ...block, unitId: event.target.value })
            }
          >
            {units.map((unit) => (
              <option value={unit.id} key={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
          <Input
            id="block-reason"
            label="Reason (maintenance, owner stay)"
            required
            value={block.reason}
            onChange={(event) =>
              setBlock({ ...block, reason: event.target.value })
            }
          />
          <Input
            id="block-start"
            label="First blocked night"
            type="date"
            required
            value={block.start}
            onChange={(event) =>
              setBlock({ ...block, start: event.target.value })
            }
          />
          <Input
            id="block-end"
            label="Free again on (check-out day)"
            type="date"
            required
            min={block.start || undefined}
            value={block.end}
            onChange={(event) =>
              setBlock({ ...block, end: event.target.value })
            }
          />
          <div className="sm:col-span-2">
            <Button type="submit" loading={busyId === "block"}>
              Save block
            </Button>
          </div>
        </form>
      </Card>
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
          <option value="block">Blocked</option>
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
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
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
          headingLevel={2}
          title={
            rows.length === 0
              ? "No reservations yet"
              : "No reservations match these filters"
          }
        />
      ) : (
        <Card as="section" padded={false} aria-label="Reservations">
          <div className="max-h-[75vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Reservations</caption>
              <thead className="sticky top-0 z-sticky hidden border-b border-rule-strong bg-paper text-xs font-semibold text-ink-muted md:table-header-group">
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
                const rowNotes = staffNotes.filter(
                  (note) => note.reservation_id === row.id,
                );
                return (
                  <tbody
                    key={row.id}
                    data-row-id={row.id}
                    aria-current={selectedId === row.id ? "true" : undefined}
                    className={`mb-3 block rounded-card border border-rule md:mb-0 md:table-row-group md:rounded-none md:border-0 md:border-b ${selectedId === row.id ? "bg-brand-light/50" : "bg-surface md:bg-transparent"}`}
                  >
                    <tr className="block align-top md:table-row">
                      <th
                        scope="row"
                        data-label="Guest and source"
                        className={`${cellClass} font-normal`}
                      >
                        <span className="block font-medium text-brand-dark">
                          {guest}
                        </span>
                        <span className="text-ink-muted">
                          {sourceLabel(row.source)}
                        </span>
                      </th>
                      <td data-label="Stay" className={cellClass}>
                        {unitNames.get(row.unit_id) ?? "Stay"}
                      </td>
                      <td data-label="Dates" className={cellClass}>
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
                      <td data-label="Payment" className={cellClass}>
                        {row.source !== "staysync" ? (
                          <span className="text-ink-muted">
                            {row.source === "airbnb"
                              ? "Via Airbnb"
                              : "No down payment"}
                          </span>
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
                      <td data-label="Status" className={cellClass}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td data-label="Actions" className={cellClass}>
                        <div className="flex flex-wrap gap-2">
                          {row.status === "pending" && (
                            <>
                              <Button
                                data-confirm={row.id}
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
                    <tr className="block md:table-row">
                      <td
                        colSpan={6}
                        className="block space-y-3 px-3 pb-3 md:table-cell md:px-4 md:pb-4"
                      >
                        {row.notes && (
                          <p className="text-sm">
                            <span className="text-ink-muted">Notes </span>
                            {row.notes}
                          </p>
                        )}
                        <details>
                          <summary className="min-h-11 cursor-pointer py-2 font-medium text-brand">
                            Staff notes ({rowNotes.length})
                          </summary>
                          <p className="mb-2 text-sm text-ink-muted">
                            Only staff can see these. Guests never do.
                          </p>
                          <ul className="mb-3 space-y-1 text-sm">
                            {rowNotes.map((note) => (
                              <li key={note.id}>
                                <span className="text-ink-muted">
                                  {formatStayDate(note.created_at.slice(0, 10))}{" "}
                                  · {guestNames.get(note.staff_id) ?? "Staff"}{" "}
                                  ·{" "}
                                </span>
                                {note.note}
                              </li>
                            ))}
                          </ul>
                          <Textarea
                            id={`staff-note-${row.id}`}
                            label="Add a note"
                            maxLength={1000}
                            value={noteDraft[row.id] ?? ""}
                            onChange={(event) =>
                              setNoteDraft({
                                ...noteDraft,
                                [row.id]: event.target.value,
                              })
                            }
                          />
                          <Button
                            className="mt-2"
                            variant="outline"
                            disabled={!noteDraft[row.id]?.trim()}
                            loading={busyId === `note-${row.id}`}
                            onClick={() => void saveNote(row)}
                          >
                            Save note
                          </Button>
                        </details>
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
                              For emergencies such as floods or heavy rain. Add
                              the reason to the record.
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
