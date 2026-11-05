import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import {
  getReservationsByGuest,
  cancelReservation,
  getActiveUnits,
} from "../lib/db";
import { formatCurrency, formatStayDate } from "../lib/format";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Table, type TableColumn } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { useToast } from "../components/ui/useToast";
import {
  useReservationsRealtime,
  applyRealtimeChange,
} from "../hooks/useRealtime";
import type { Reservation } from "../lib/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const PAGE_SIZE = 10;

function nextStep(status: Reservation["status"]): string {
  switch (status) {
    case "pending":
      return "Staff will verify your down payment and confirm.";
    case "confirmed":
      return "Confirmed. Staff will share arrival details.";
    case "rejected":
      return "Not approved. Try other dates or another stay.";
    case "cancelled":
      return "Cancelled. Send a new request to book again.";
    case "completed":
      return "Stay complete.";
  }
}

export default function MyReservations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [unitNames, setUnitNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    // Unit names are a nicety: a failed lookup falls back to a generic label.
    void getActiveUnits()
      .then((units) => {
        if (mounted)
          setUnitNames(Object.fromEntries(units.map((u) => [u.id, u.name])));
      })
      .catch(() => undefined);
    getReservationsByGuest(user.id)
      .then((data) => {
        if (mounted) setReservations(data);
      })
      .catch(() => {
        if (mounted)
          setError("We couldn’t load your reservations. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, retry]);

  const handleReservationChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Reservation>) => {
      if (!user) return;
      const changed =
        payload.eventType === "DELETE" ? payload.old : payload.new;
      if (!changed || changed.guest_id !== user.id) return;
      setReservations((rows) => applyRealtimeChange(rows, payload));
    },
    [user],
  );

  useReservationsRealtime(handleReservationChange, {
    filter: user ? `guest_id=eq.${user.id}` : undefined,
  });

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setRetry((value) => value + 1);
  };
  const pageCount = Math.ceil(reservations.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const pageReservations = reservations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  async function confirmCancel() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      await cancelReservation(cancelTarget.id);
      setReservations((rows) =>
        rows.map((row) =>
          row.id === cancelTarget.id ? { ...row, status: "cancelled" } : row,
        ),
      );
      showToast("Reservation request cancelled.", "success");
      setCancelTarget(null);
    } catch {
      showToast("We couldn’t cancel that request. Please try again.", "error");
    } finally {
      setCancelling(false);
    }
  }

  const columns: TableColumn<Reservation>[] = [
    {
      key: "stay",
      header: "Stay",
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-dark">
            {unitNames[row.unit_id] ?? "GilMars stay"}
          </p>
          <Link
            to={`/units/${row.unit_id}`}
            className="inline-flex min-h-11 items-center text-xs font-medium text-brand underline"
          >
            View stay
          </Link>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (row) => (
        <span>
          {formatStayDate(row.check_in)}
          <span aria-hidden="true"> → </span>
          <span className="sr-only">to </span>
          {formatStayDate(row.check_out)}
        </span>
      ),
    },
    {
      key: "guests",
      header: "Guests",
      render: (row) =>
        `${row.num_guests} ${row.num_guests === 1 ? "guest" : "guests"}`,
    },
    {
      key: "deposit",
      header: "Down payment",
      render: (row) =>
        row.deposit_amount
          ? formatCurrency(row.deposit_amount)
          : "Awaiting payment",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "next",
      header: "What happens next",
      render: (row) => (
        <span className="max-w-xs leading-5 text-ink-muted">
          {nextStep(row.status)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) =>
        row.status === "pending" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelTarget(row)}
          >
            Cancel request
          </Button>
        ) : null,
    },
  ];

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Reservations didn’t load"
        description={error}
        action={
          <Button variant="outline" onClick={retryLoad}>
            Try again
          </Button>
        }
      />
    );
  if (!reservations.length)
    return (
      <div className="space-y-6">
        <PageHeader title="My reservations" />
        <EmptyState
          title="No reservations yet"
          description="Your stay requests will appear here after you send one."
          action={
            <Button onClick={() => navigate("/units")}>Browse stays</Button>
          }
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reservations"
        actions={
          <Button variant="outline" onClick={() => navigate("/units")}>
            Browse stays
          </Button>
        }
      />
      <Table
        columns={columns}
        rows={pageReservations}
        getRowKey={(row) => row.id}
        caption="Your GilMars reservation requests"
        emptyMessage="No reservation requests yet."
      />
      {pageCount > 1 && (
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          label="reservation requests"
        />
      )}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
        loading={cancelling}
        title="Cancel this request?"
        consequence="This will cancel your pending reservation request. You’ll need to send a new request if you still want these dates."
        confirmLabel="Cancel reservation request"
        cancelLabel="Keep request"
      />
    </div>
  );
}
