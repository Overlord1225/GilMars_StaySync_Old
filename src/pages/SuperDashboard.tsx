import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getActiveUnits,
  getAllInquiries,
  getStaffReservations,
} from "@/lib/db";
import {
  confirmedByUnit,
  inquiriesByCategory,
  reservationsByMonth,
  statusSplit,
  STATUSES,
} from "@/lib/dashboardStats";
import { todayManila } from "@/lib/dates";
import type { Inquiry, Reservation, Unit } from "@/lib/types";

const statusColor: Record<Reservation["status"], string> = {
  pending: "var(--color-status-pending)",
  confirmed: "var(--color-status-confirmed)",
  completed: "var(--color-status-completed)",
  cancelled: "var(--color-status-cancelled)",
  rejected: "var(--color-status-rejected)",
};
const categoryLabel: Record<string, string> = {
  booking_request: "Booking request",
  availability_inquiry: "Availability",
  general_question: "General",
  complaint: "Concern",
};
const axisProps = {
  tick: { fill: "var(--color-ink-muted)", fontSize: 12 },
  stroke: "var(--color-rule)",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
// Legend text uses the ink token; only the swatch carries the series colour.
const legendFormatter = (value: string) => (
  <span style={{ color: "var(--color-ink)" }}>{value}</span>
);

function ChartCard({
  title,
  empty,
  summary,
  children,
}: {
  title: string;
  empty: boolean;
  summary: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <h2 className="font-heading text-lg text-brand-dark">{title}</h2>
      {empty ? (
        <p className="mt-4 text-sm text-ink-muted">No data yet.</p>
      ) : (
        <div
          role="img"
          aria-label={`${title}. ${summary}`}
          className="mt-4 h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// Read-only overview: super admin manages accounts, not day-to-day operations.
export default function SuperDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getStaffReservations(), getAllInquiries(), getActiveUnits()])
      .then(([bookingRows, inquiryRows, unitRows]) => {
        if (!active) return;
        setReservations(bookingRows);
        setInquiries(inquiryRows);
        setUnits(unitRows);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Dashboard data did not load"
        description="Check your access and try again."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setError(false);
              setLoading(true);
              setRefresh((value) => value + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );

  const today = todayManila();
  const month = today.slice(0, 7);
  const occupiedUnits = new Set(
    reservations
      .filter(
        (row) =>
          row.status === "confirmed" &&
          row.source !== "block" &&
          row.check_in <= today &&
          row.check_out > today,
      )
      .map((row) => row.unit_id),
  ).size;
  const stats: [string, string][] = [
    [
      "Pending requests",
      String(reservations.filter((row) => row.status === "pending").length),
    ],
    ["Occupied today", `${occupiedUnits} / ${units.length}`],
    [
      "Confirmed this month",
      String(
        reservations.filter(
          (row) => row.status === "confirmed" && row.check_in.startsWith(month),
        ).length,
      ),
    ],
    [
      "New inquiries",
      String(inquiries.filter((row) => row.status === "new").length),
    ],
  ];
  const monthly = reservationsByMonth(reservations, todayManila());
  const multiYear = new Set(monthly.map((m) => m.month.slice(0, 4))).size > 1;
  const monthTick = (iso: string) => {
    const name = MONTH_NAMES[Number(iso.slice(5, 7)) - 1] ?? iso;
    return multiYear ? `${name} ${iso.slice(0, 4)}` : name;
  };
  const split = statusSplit(reservations);
  const byCategory = inquiriesByCategory(inquiries).map((row) => ({
    ...row,
    label: categoryLabel[row.category],
  }));
  const byUnit = confirmedByUnit(reservations, units);
  const tooltipStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-rule)",
    borderRadius: 8,
    color: "var(--color-ink)",
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="font-sans text-sm text-ink-muted">{label}</p>
            <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-brand">
              {value}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Reservations per month"
          empty={reservations.length === 0}
          summary={monthly
            .map(
              (m) => `${m.month}: ${STATUSES.reduce((n, st) => n + m[st], 0)}`,
            )
            .join(", ")}
        >
          <BarChart data={monthly}>
            <CartesianGrid stroke="var(--color-rule)" vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthTick} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend formatter={legendFormatter} />
            {STATUSES.map((st) => (
              <Bar key={st} dataKey={st} stackId="s" fill={statusColor[st]} />
            ))}
          </BarChart>
        </ChartCard>
        <ChartCard
          title="Reservation status split"
          empty={split.length === 0}
          summary={split.map((r) => `${r.status}: ${r.count}`).join(", ")}
        >
          <PieChart>
            <Pie
              data={split}
              dataKey="count"
              nameKey="status"
              innerRadius="55%"
              outerRadius="80%"
            >
              {split.map((r) => (
                <Cell key={r.status} fill={statusColor[r.status]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend formatter={legendFormatter} />
          </PieChart>
        </ChartCard>
        <ChartCard
          title="Inquiries by category"
          empty={inquiries.length === 0}
          summary={byCategory.map((r) => `${r.label}: ${r.count}`).join(", ")}
        >
          <BarChart data={byCategory}>
            <CartesianGrid stroke="var(--color-rule)" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Inquiries" fill="var(--color-brand)" />
          </BarChart>
        </ChartCard>
        <ChartCard
          title="Bookings per unit"
          empty={byUnit.every((row) => row.count === 0)}
          summary={byUnit.map((r) => `${r.unit}: ${r.count}`).join(", ")}
        >
          <BarChart data={byUnit} layout="vertical">
            <CartesianGrid stroke="var(--color-rule)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="unit" width={90} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Confirmed" fill="var(--color-brand)" />
          </BarChart>
        </ChartCard>
      </div>
    </section>
  );
}
