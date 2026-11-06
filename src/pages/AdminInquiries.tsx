import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import {
  addInquiryReply,
  getAllInquiries,
  getAllProfiles,
  getInquiryReplies,
  updateInquiry,
} from "@/lib/db";
import { formatStayDate } from "@/lib/format";
import { categoryLabels, statusLabels } from "@/lib/inquiryLabels";
import type {
  Inquiry,
  InquiryCategory,
  InquiryReply,
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
  const { user } = useAuth();
  const [replies, setReplies] = useState<InquiryReply[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const pinnedId = searchParams.get("id");

  const load = useCallback(async () => {
    try {
      const [inquiries, guests, replyRows] = await Promise.all([
        getAllInquiries(),
        getAllProfiles(),
        getInquiryReplies(),
      ]);
      setReplies(replyRows);
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
        (!pinnedId || row.id === pinnedId) &&
        (filterCategory === "all" || row.category === filterCategory) &&
        (filterStatus === "all" || row.status === filterStatus),
    )
    .sort(
      (a, b) =>
        Number(b.category === "complaint" && b.status !== "resolved") -
        Number(a.category === "complaint" && a.status !== "resolved"),
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

  async function sendReply(row: Inquiry) {
    const message = (drafts[row.id] ?? "").trim();
    if (!message || !user) return;
    setBusyId(row.id);
    try {
      await addInquiryReply(row.id, user.id, message);
      setDrafts((current) => ({ ...current, [row.id]: "" }));
      setReplies(await getInquiryReplies());
      showToast("Reply sent.", "success");
    } catch {
      showToast("The reply could not be sent. Please try again.", "error");
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
      <PageHeader title="Inquiry inbox" />
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
              {categoryLabels[category]}
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
              {statusLabels[status]}
            </option>
          ))}
        </Select>
      </div>
      {pinnedId && (
        <p className="mb-4 text-sm text-ink-muted">
          Showing one inquiry.{" "}
          <button
            type="button"
            className="font-medium text-brand underline"
            onClick={() => setSearchParams({}, { replace: true })}
          >
            Show all inquiries
          </button>
        </p>
      )}
      {!filtered.length ? (
        <EmptyState
          title={
            rows.length
              ? "No inquiries match these filters."
              : "No inquiries yet."
          }
        />
      ) : (
        <Card as="section" padded={false} aria-label="Inquiries">
          <ul className="divide-y divide-rule">
            {filtered.map((row) => (
              <li key={row.id} className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink-muted">
                      {names.get(row.guest_id) ?? "Guest"} ·{" "}
                      {formatStayDate((row.created_at ?? "").slice(0, 10))}
                    </p>
                    <h2 className="mt-1 font-heading text-xl text-brand-dark">
                      {row.subject || "Guest message"}
                    </h2>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
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
                        {categoryLabels[category]}
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
                        {statusLabels[status]}
                      </option>
                    ))}
                  </Select>
                </div>
                {replies
                  .filter((reply) => reply.inquiry_id === row.id)
                  .map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-card bg-brand-light p-3 text-sm"
                    >
                      <p className="text-xs font-semibold text-brand-dark">
                        Staff reply ·{" "}
                        {formatStayDate(reply.created_at.slice(0, 10))}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-ink">
                        {reply.message}
                      </p>
                    </div>
                  ))}
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendReply(row);
                  }}
                >
                  <Textarea
                    id={`reply-${row.id}`}
                    label="Reply to guest"
                    maxLength={2000}
                    value={drafts[row.id] ?? ""}
                    onChange={(event) =>
                      setDrafts({ ...drafts, [row.id]: event.target.value })
                    }
                  />
                  <Button
                    type="submit"
                    disabled={
                      busyId === row.id || !(drafts[row.id] ?? "").trim()
                    }
                  >
                    Send reply
                  </Button>
                </form>
                <p className="text-xs text-ink-muted">
                  <span className="font-semibold">Matched keywords:</span>{" "}
                  {row.matched_keywords.length
                    ? row.matched_keywords.join(", ")
                    : "none"}
                  {row.category_source === "admin" && (
                    <>
                      {" · "}
                      <span className="font-medium text-brand-dark">
                        Corrected by admin
                      </span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
