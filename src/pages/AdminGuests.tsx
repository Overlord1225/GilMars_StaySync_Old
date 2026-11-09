import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/useToast";
import {
  auditLog,
  clearDeletionRequest,
  getAllProfiles,
  getDeletionRequests,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { DeletionRequest, Profile } from "@/lib/types";

export default function AdminGuests() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const [profiles, deletionRequests] = await Promise.all([
        getAllProfiles(),
        // Optional: the guest list still works without request data.
        getDeletionRequests().catch(() => []),
      ]);
      setRows(profiles.filter((profile) => profile.role === "guest"));
      setRequests(deletionRequests);
      setError("");
    } catch {
      setError("We couldn’t load guests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, reload]);

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.full_name} ${row.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  const deletionFor = (guestId: string) =>
    requests.find((item) => item.guest_id === guestId);

  async function markHandled(guestId: string) {
    try {
      await clearDeletionRequest(guestId);
      setRequests((current) =>
        current.filter((item) => item.guest_id !== guestId),
      );
    } catch {
      showToast("We couldn’t clear that request. Please try again.", "error");
    }
  }

  const closeDialog = () => {
    setTarget(null);
    setReason("");
  };

  async function changeStatus() {
    if (!target || saving) return;
    const trimmedReason = reason.trim();
    if (target.is_active && trimmedReason.length < 3) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_active: !target.is_active })
      .eq("id", target.id);
    if (updateError)
      showToast(
        "We couldn’t change that guest’s status. Please try again.",
        "error",
      );
    else {
      try {
        await auditLog({
          action: target.is_active ? "deactivate_guest" : "reactivate_guest",
          targetTable: "profiles",
          targetId: target.id,
          targetDetails: target.is_active ? { reason: trimmedReason } : {},
        });
      } catch {
        showToast("Saved, but the reason couldn’t be logged.", "info");
      }
      showToast(
        target.is_active
          ? "Guest account deactivated."
          : "Guest account reactivated.",
        "success",
      );
      setRows((current) =>
        current.map((row) =>
          row.id === target.id ? { ...row, is_active: !target.is_active } : row,
        ),
      );
      closeDialog();
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Guest records did not load"
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
      <PageHeader title="Guest records" />
      <div className="max-w-md">
        <Input
          id="guest-search"
          type="search"
          label="Search guests"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or email"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0
              ? "No guests yet."
              : "No guests match your search."
          }
        />
      ) : (
        <Card as="section" padded={false} aria-label="Guests">
          <ul className="divide-y divide-rule">
            {filtered.map((profile) => (
              <li
                key={profile.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"
              >
                <div>
                  <h2 className="font-heading text-lg text-brand-dark">
                    {profile.full_name || "Unnamed guest"}
                  </h2>
                  <p className="text-sm text-ink-muted">{profile.email}</p>
                  <Badge
                    variant={profile.is_active ? "success" : "default"}
                    className="mt-1"
                  >
                    {profile.is_active ? "Active" : "Deactivated"}
                  </Badge>
                  {deletionFor(profile.id) && (
                    <p className="mt-2 text-sm text-warning-800">
                      Asked to delete their account
                      {deletionFor(profile.id)?.reason
                        ? `: ${deletionFor(profile.id)?.reason}`
                        : "."}{" "}
                      <button
                        type="button"
                        className="min-h-11 font-medium text-brand underline"
                        onClick={() => void markHandled(profile.id)}
                      >
                        Mark handled
                      </button>
                    </p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className={
                    profile.is_active
                      ? "border-danger-200 text-danger-700 enabled:hover:bg-danger-50"
                      : ""
                  }
                  onClick={() => setTarget(profile)}
                >
                  {profile.is_active ? "Deactivate guest" : "Reactivate guest"}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ConfirmDialog
        open={Boolean(target)}
        onClose={closeDialog}
        onConfirm={() => void changeStatus()}
        loading={saving}
        confirmDisabled={Boolean(target?.is_active) && reason.trim().length < 3}
        title={
          target?.is_active
            ? "Deactivate this guest?"
            : "Reactivate this guest?"
        }
        consequence={
          target?.is_active
            ? "This guest will no longer be able to sign in or submit new requests."
            : "This guest will be able to sign in and use StaySync again."
        }
        confirmLabel={
          target?.is_active ? "Deactivate guest" : "Reactivate guest"
        }
      >
        {target?.is_active && (
          <Textarea
            id="deactivate-reason"
            label="Reason for deactivating"
            hint="Saved to the audit log. The guest does not see it."
            required
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </ConfirmDialog>
    </section>
  );
}
