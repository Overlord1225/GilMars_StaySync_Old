import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { getAllInquiries, getAllProfiles, updateInquiry } from "@/lib/db";
import { formatStayDate } from "@/lib/format";
import type {
  Inquiry,
  InquiryCategory,
  InquiryStatus,
  Profile,
} from "@/lib/types";

const categories: InquiryCategory[] = [
  "booking_request",
  "availability_inquiry",
  "general_question",
  "complaint",
];
const statuses: InquiryStatus[] = ["new", "in_progress", "resolved"];

export default function AdminInquiries() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const [inquiries, guests] = await Promise.all([
        getAllInquiries(),
        getAllProfiles(),
      ]);
      setError("");
      setRows(inquiries);
      setProfiles(guests);
    } catch {
      setError(
        "We could not load the inquiry inbox. Check your staff access and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, reload]);

  const names = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile.full_name || profile.email,
        ]),
      ),
    [profiles],
  );
  const filtered = rows
    .filter(
      (row) =>
        (filterCategory === "all" || row.category === filterCategory) &&
        (filterStatus === "all" || row.status === filterStatus),
    )
    .sort(
      (a, b) =>
        Number(b.category === "complaint") - Number(a.category === "complaint"),
    );

  async function save(
    row: Inquiry,
    changes: Partial<Pick<Inquiry, "category" | "status">>,
  ) {
    setBusyId(row.id);
    try {
      await updateInquiry(row.id, {
        category: changes.category ?? row.category,
        status: changes.status ?? row.status,
      });
      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                ...changes,
                ...(changes.category && changes.category !== row.category
                  ? { category_source: "admin" }
                  : {}),
              }
            : item,
        ),
      );
      showToast("Inquiry updated.", "success");
    } catch {
      showToast("The inquiry could not be updated. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Inbox did not load"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            Try again
          </Button>
        }
      />
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Inquiry inbox"
        description="Review guest messages, correct categories, and track their status."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Inquiries" },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id="inquiry-category-filter"
          label="Category"
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select
          id="inquiry-status-filter"
          label="Status"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>
      {!filtered.length ? (
        <EmptyState
          title="No inquiries match"
          description="New guest messages will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => (
            <Card key={row.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-text-muted">
                    {names.get(row.guest_id) ?? "Guest"} ·{" "}
                    {formatStayDate((row.created_at ?? "").slice(0, 10))}
                  </p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-brand-dark">
                    {row.subject || "Guest message"}
                  </h2>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <p className="whitespace-pre-wrap rounded-control bg-cream p-4 text-sm leading-6 text-text">
                {row.message}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  id={`category-${row.id}`}
                  label="Category"
                  value={row.category ?? "general_question"}
                  disabled={busyId === row.id}
                  onChange={(event) =>
                    void save(row, {
                      category: event.target.value as InquiryCategory,
                    })
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
                <Select
                  id={`status-${row.id}`}
                  label="Status"
                  value={row.status}
                  disabled={busyId === row.id}
                  onChange={(event) =>
                    void save(row, {
                      status: event.target.value as InquiryStatus,
                    })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="font-semibold">Matched keywords:</span>
                {row.matched_keywords.length ? (
                  row.matched_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-border px-2 py-1"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span>none</span>
                )}
                {row.category_source === "admin" && (
                  <span className="rounded-full bg-brand-light px-2 py-1 font-medium text-brand-dark">
                    Corrected by admin
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
