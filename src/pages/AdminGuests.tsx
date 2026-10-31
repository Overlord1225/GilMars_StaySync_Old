import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/useToast";
import { getAllProfiles } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function AdminGuests() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      setRows(
        (await getAllProfiles()).filter((profile) => profile.role === "guest"),
      );
      setError("");
    } catch {
      setError(
        "Guest records could not be loaded. Verify your staff access and try again.",
      );
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

  async function changeStatus() {
    if (!target || saving) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_active: !target.is_active })
      .eq("id", target.id);
    if (updateError)
      showToast(
        "Guest status could not be changed. Apply migration 0008 and check the staff profile policy.",
        "error",
      );
    else {
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
      setTarget(null);
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
      <PageHeader
        title="Guest records"
        description="Search guest profiles and manage their access to StaySync."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Guests" }]}
      />
      <label className="block max-w-md space-y-1.5 text-sm font-medium text-text">
        Search guests
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 focus-visible:ring-2 focus-visible:ring-brand"
          placeholder="Name or email"
        />
      </label>
      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length ? "No guests match" : "No guest profiles yet"}
          description="Guest accounts appear here after registration."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((profile) => (
            <Card
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <h2 className="font-semibold text-brand-dark">
                  {profile.full_name || "Unnamed guest"}
                </h2>
                <p className="text-sm text-text-muted">{profile.email}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {profile.is_active ? "Active account" : "Deactivated"}
                </p>
              </div>
              <Button
                variant={profile.is_active ? "danger" : "secondary"}
                onClick={() => setTarget(profile)}
              >
                {profile.is_active ? "Deactivate guest" : "Reactivate guest"}
              </Button>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={() => void changeStatus()}
        loading={saving}
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
      />
    </section>
  );
}
