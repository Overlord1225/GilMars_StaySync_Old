import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import {
  addInquiryReply,
  addReplyTemplate,
  deleteReplyTemplate,
  getAllInquiries,
  getAllProfiles,
  getInquiryReplies,
  getReplyTemplates,
  updateInquiry,
} from "@/lib/db";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { formatStayDate } from "@/lib/format";
import { categoryLabels, statusLabels } from "@/lib/inquiryLabels";
import type {
  Inquiry,
  InquiryCategory,
  InquiryReply,
  InquiryStatus,
  Profile,
  ReplyTemplate,
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const pinnedId = searchParams.get("id");

  const load = useCallback(async () => {
    try {
      const [inquiries, guests, replyRows, templateRows] = await Promise.all([
        getAllInquiries(),
        getAllProfiles(),
        getInquiryReplies(),
        // Templates are optional: the inbox still works without them.
        getReplyTemplates().catch(() => []),
      ]);
      setTemplates(templateRows);
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

  const unresolved = filtered.filter((row) => row.status !== "resolved");

  async function resolveShown() {
    setBusyId("bulk");
    try {
      await Promise.all(
        unresolved.map((row) =>
          updateInquiry(row.id, {
            category: row.category,
            status: "resolved",
          }),
        ),
      );
      const ids = new Set(unresolved.map((row) => row.id));
      setRows((current) =>
        current.map((item) =>
          ids.has(item.id) ? { ...item, status: "resolved" } : item,
        ),
      );
      showToast(`${ids.size} inquiries marked resolved.`, "success");
    } catch {
      showToast(
        "Some inquiries could not be updated. Reload and check.",
        "error",
      );
      setReload((value) => value + 1);
    } finally {
      setBusyId(null);
      setBulkOpen(false);
    }
  }

  function exportCsv() {
    downloadCsv(
      "inquiries.csv",
      buildCsv(
        ["Guest", "Received", "Subject", "Category", "Status", "Message"],
        filtered.map((row) => [
          names.get(row.guest_id) ?? "Guest",
          (row.created_at ?? "").slice(0, 10),
          row.subject,
          categoryLabels[row.category ?? "general_question"],
          statusLabels[row.status],
          row.message,
        ]),
      ),
    );
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await addReplyTemplate(newTitle.trim(), newBody.trim());
      setNewTitle("");
      setNewBody("");
      setTemplates(await getReplyTemplates());
      showToast("Template saved.", "success");
    } catch {
      showToast("The template could not be saved.", "error");
    }
  }

  async function removeTemplate(id: string) {
    try {
      await deleteReplyTemplate(id);
      setTemplates((current) => current.filter((item) => item.id !== id));
    } catch {
      showToast("The template could not be deleted.", "error");
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
      <PageHeader
        title="Inquiry inbox"
        actions={
          <>
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              disabled={unresolved.length === 0 || busyId === "bulk"}
              onClick={() => setBulkOpen(true)}
            >
              Resolve shown ({unresolved.length})
            </Button>
          </>
        }
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
      <details className="rounded-card border border-rule bg-surface p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-brand">
          Reply templates ({templates.length})
        </summary>
        <ul className="my-3 space-y-2 text-sm">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                <span className="font-medium text-ink">{template.title}</span>
                <span className="block text-ink-muted">{template.body}</span>
              </span>
              <Button
                variant="outline"
                onClick={() => void removeTemplate(template.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event) => void saveTemplate(event)}
          className="space-y-3"
        >
          <Input
            id="template-title"
            label="Template name"
            maxLength={80}
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <Textarea
            id="template-body"
            label="Template text"
            maxLength={2000}
            value={newBody}
            onChange={(event) => setNewBody(event.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!newTitle.trim() || !newBody.trim()}
          >
            Save template
          </Button>
        </form>
      </details>
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
          headingLevel={2}
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
                {row.category === "booking_request" && (
                  <p className="text-sm">
                    <Link
                      className="font-medium text-brand underline"
                      to={`/admin/search?q=${encodeURIComponent(names.get(row.guest_id) ?? "")}`}
                    >
                      See this guest’s reservations
                    </Link>
                  </p>
                )}
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
                  {templates.length > 0 && (
                    <Select
                      id={`template-${row.id}`}
                      label="Use a template"
                      value=""
                      onChange={(event) => {
                        const template = templates.find(
                          (item) => item.id === event.target.value,
                        );
                        if (template)
                          setDrafts({ ...drafts, [row.id]: template.body });
                      }}
                    >
                      <option value="">Choose a template…</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                    </Select>
                  )}
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
      <ConfirmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={() => void resolveShown()}
        loading={busyId === "bulk"}
        title="Mark these inquiries resolved?"
        consequence={`${unresolved.length} inquiries currently shown will be marked resolved. Guests see the new status.`}
        confirmLabel="Mark resolved"
        cancelLabel="Cancel"
      />
    </section>
  );
}
