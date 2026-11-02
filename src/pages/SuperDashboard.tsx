import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAllInquiries, getStaffReservations } from "@/lib/db";
import { todayManila } from "@/lib/dates";
import type { Inquiry, Reservation } from "@/lib/types";

// Read-only overview: super admin manages accounts, not day-to-day operations.
export default function SuperDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([getStaffReservations(), getAllInquiries()])
      .then(([bookingRows, inquiryRows]) => {
        if (!active) return;
        setReservations(bookingRows);
        setInquiries(inquiryRows);
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
  }, []);
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
      />
    );

  const month = todayManila().slice(0, 7);
  const count = (status: Reservation["status"]) =>
    reservations.filter((row) => row.status === status).length;
  const stats: [string, number][] = [
    ["Total reservations", reservations.length],
    ["Pending", count("pending")],
    ["Confirmed", count("confirmed")],
    [
      "Confirmed this month",
      reservations.filter(
        (row) => row.status === "confirmed" && row.check_in.startsWith(month),
      ).length,
    ],
    ["Total inquiries", inquiries.length],
    ["New inquiries", inquiries.filter((row) => row.status === "new").length],
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Read-only totals for bookings, reservations and inquiries."
        breadcrumbs={[{ label: "Super admin" }]}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-text-muted">{label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand">
              {value}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
