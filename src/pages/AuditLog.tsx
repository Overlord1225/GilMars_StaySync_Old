import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Head } from "@/components/ui/Head";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { AUDIT_PAGE_SIZE, getAuditLog } from "@/lib/db";
import type { AuditLogEntry } from "@/lib/types";

const whenFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
});

const ACTION_LABELS: Record<string, string> = {
  "staff.create": "Created admin account",
  "staff.reset_password": "Sent password reset",
  "staff.role": "Changed role",
  "staff.is_active": "Changed active status",
};

function actionLabel(action: string) {
  return (
    ACTION_LABELS[action] ??
    (action.startsWith("staff.")
      ? "Edited account details"
      : action.replaceAll(".", " · ").replaceAll("_", " "))
  );
}

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    page: number;
    rows: AuditLogEntry[];
    total: number;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAuditLog(page)
      .then((result) => {
        if (!mounted) return;
        setData({ page, ...result });
        setError(false);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, [page]);

  const loading = !error && data?.page !== page;
  const pageCount = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / AUDIT_PAGE_SIZE),
  );

  return (
    <section className="space-y-6">
      <Head title="Audit log" />
      <PageHeader
        title="Audit log"
        description="Staff account actions, newest first. Times are Asia/Manila."
      />
      {error ? (
        <EmptyState
          headingLevel={2}
          role="alert"
          title="We couldn’t load the audit log"
          description="Check your connection and refresh the page."
        />
      ) : loading ? (
        <Skeleton className="h-64 w-full" label="Loading audit log" />
      ) : data && data.rows.length === 0 ? (
        <EmptyState headingLevel={2} title="No activity recorded yet" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-rule bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Audit log entries</caption>
              <thead className="border-b border-rule bg-paper text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    When
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-rule last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {whenFormat.format(new Date(row.created_at))}
                    </td>
                    <td className="px-4 py-3">
                      {row.actor_email}
                      <span className="block text-xs text-ink-muted">
                        {row.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{actionLabel(row.action)}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {row.target_table ?? "—"}
                      {row.target_details ? (
                        <details>
                          <summary className="min-h-11 cursor-pointer py-2 text-xs text-brand">
                            Details
                          </summary>
                          <code className="block break-all text-xs">
                            {JSON.stringify(row.target_details)}
                          </code>
                        </details>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            label="entries"
          />
        </>
      )}
    </section>
  );
}
