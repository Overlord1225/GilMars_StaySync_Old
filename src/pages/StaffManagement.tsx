import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/authSchemas";
import { auditLog } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/types";

type ProfileEdit = {
  role?: UserRole;
  is_active?: boolean;
  deactivation_reason?: string;
};

type PendingProfileChange = {
  profile: Profile;
  updates: ProfileEdit;
  title: string;
  consequence: string;
  confirmLabel: string;
};

export default function StaffManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    email: "",
    temporaryPassword: "",
  });
  const [creating, setCreating] = useState(false);
  const [pendingChange, setPendingChange] =
    useState<PendingProfileChange | null>(null);
  const [reason, setReason] = useState("");

  const fetchStaff = useCallback(async () => {
    return await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await fetchStaff();
    if (queryError) setError("We couldn’t load accounts. Please try again.");
    else setStaff(data ?? []);
    setLoading(false);
  }, [fetchStaff]);

  useEffect(() => {
    let active = true;
    void fetchStaff().then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError("We couldn’t load accounts. Please try again.");
      else setStaff(data ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchStaff]);

  async function updateStaff(
    profile: Profile,
    updates: ProfileEdit,
  ): Promise<boolean> {
    if (!user || profile.id === user.id) return false;
    setSavingId(profile.id);
    setError("");
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);
    if (updateError) {
      setError("We couldn’t update this staff account. Please try again.");
      setSavingId(null);
      return false;
    }
    await loadStaff();
    setSavingId(null);
    showToast("Account updated.", "success");
    // The audit row is written by the profiles_audit_staff_changes trigger.
    return true;
  }

  const deactivating = pendingChange?.updates.is_active === false;

  function closePendingChange() {
    setPendingChange(null);
    setReason("");
  }

  async function confirmChange() {
    if (!pendingChange || savingId) return;
    const trimmed = reason.trim();
    if (deactivating && trimmed.length < 3) return;
    const saved = await updateStaff(
      pendingChange.profile,
      deactivating
        ? { ...pendingChange.updates, deactivation_reason: trimmed }
        : pendingChange.updates,
    );
    if (saved) closePendingChange();
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (creating) return;
    setCreating(true);
    setError("");
    const { error: createError } = await supabase.functions.invoke(
      "create-staff",
      { body: newStaff },
    );
    if (createError) {
      setError(
        "The admin account could not be created. Check that the create-staff Edge Function is deployed and try again.",
      );
    } else {
      const createdEmail = newStaff.email;
      const createdName = newStaff.fullName;
      setNewStaff({ fullName: "", email: "", temporaryPassword: "" });
      await loadStaff();
      showToast("Admin account created.", "success");
      void auditLog({
        action: "staff.create",
        targetTable: "profiles",
        targetDetails: { email: createdEmail, full_name: createdName },
      }).catch(() => undefined);
    }
    setCreating(false);
  }

  const admins = staff.filter((p) => p.role !== "guest");
  const guests = staff.filter((p) => p.role === "guest");
  const accountList = (rows: Profile[], empty: string, label: string) =>
    loading ? (
      <p role="status">Loading accounts…</p>
    ) : rows.length === 0 ? (
      <EmptyState title={empty} />
    ) : (
      <Card as="section" padded={false} aria-label={label}>
        <ul className="divide-y divide-rule">
          {rows.map((profile) => {
            return (
              <li
                key={profile.id}
                className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg text-brand-dark">
                    {profile.full_name || "Unnamed account"}
                  </h2>
                  <p className="text-sm text-ink-muted">{profile.email}</p>
                  {profile.id === user?.id && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Your current account
                    </p>
                  )}
                  {!profile.is_active && (
                    <p className="mt-1 text-sm text-danger-700">
                      Deactivated
                      {profile.deactivation_reason
                        ? `: ${profile.deactivation_reason}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  {profile.role === "guest" ? (
                    <span className="flex min-h-11 w-36 items-center text-sm text-ink-muted">
                      Guest
                    </span>
                  ) : (
                    <div className="w-36">
                      <Select
                        id={`role-${profile.id}`}
                        label="Role"
                        value={profile.role}
                        disabled={
                          profile.id === user?.id || savingId === profile.id
                        }
                        onChange={(event) => {
                          const role = event.target.value as UserRole;
                          if (role === profile.role) return;
                          const roleName =
                            role === "super_admin" ? "super admin" : "admin";
                          setPendingChange({
                            profile,
                            updates: { role },
                            title: `Change ${profile.full_name || "this staff member"}’s role?`,
                            consequence: `This will change ${profile.full_name || "this staff member"}’s access to StaySync as a ${roleName}.`,
                            confirmLabel: "Change role",
                          });
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </Select>
                    </div>
                  )}
                  {profile.id === user?.id ? (
                    <p className="flex min-h-11 w-32 items-center text-sm text-ink-muted">
                      You can’t deactivate your own account here.
                    </p>
                  ) : (
                    <>
                      <Button
                        className="h-11 w-32"
                        variant={profile.is_active ? "danger" : "secondary"}
                        disabled={savingId === profile.id}
                        loading={savingId === profile.id}
                        onClick={() =>
                          setPendingChange({
                            profile,
                            updates: { is_active: !profile.is_active },
                            title: profile.is_active
                              ? `Deactivate ${profile.full_name || "this staff account"}?`
                              : `Reactivate ${profile.full_name || "this staff account"}?`,
                            consequence: profile.is_active
                              ? "This will prevent this account from accessing StaySync."
                              : "This will restore this account’s access to StaySync.",
                            confirmLabel: profile.is_active
                              ? "Deactivate account"
                              : "Reactivate account",
                          })
                        }
                      >
                        {profile.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Account management"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void loadStaff()}
              loading={loading}
            >
              Refresh
            </Button>
          </>
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800"
        >
          {error}
        </p>
      )}
      <Tabs
        items={[
          {
            id: "admins",
            label: `Admins (${admins.length})`,
            content: (
              <div className="space-y-6">
                <Card>
                  <form
                    onSubmit={(event) => void createStaff(event)}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <h2 className="font-heading text-lg text-brand-dark">
                        Create admin account
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        A temporary password is required. Share it with the new
                        staff member privately.
                      </p>
                    </div>
                    <Input
                      id="staff-name"
                      label="Full name"
                      autoComplete="name"
                      required
                      minLength={2}
                      value={newStaff.fullName}
                      onChange={(event) =>
                        setNewStaff({
                          ...newStaff,
                          fullName: event.target.value,
                        })
                      }
                    />
                    <Input
                      id="staff-email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      required
                      value={newStaff.email}
                      onChange={(event) =>
                        setNewStaff({ ...newStaff, email: event.target.value })
                      }
                    />
                    <Input
                      id="staff-temporary-password"
                      label="Temporary password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      hint={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
                      value={newStaff.temporaryPassword}
                      onChange={(event) =>
                        setNewStaff({
                          ...newStaff,
                          temporaryPassword: event.target.value,
                        })
                      }
                    />
                    <div className="sm:col-span-2">
                      <Button type="submit" loading={creating}>
                        Create admin
                      </Button>
                    </div>
                  </form>
                </Card>
                {accountList(
                  admins,
                  "No admin accounts yet.",
                  "Admin accounts",
                )}
              </div>
            ),
          },
          {
            id: "guests",
            label: `Guests (${guests.length})`,
            content: accountList(
              guests,
              "No guest accounts yet.",
              "Guest accounts",
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={Boolean(pendingChange)}
        onClose={() => {
          if (!savingId) closePendingChange();
        }}
        onConfirm={() => void confirmChange()}
        loading={Boolean(savingId)}
        confirmDisabled={deactivating && reason.trim().length < 3}
        title={pendingChange?.title ?? "Confirm staff change"}
        consequence={pendingChange?.consequence ?? ""}
        confirmLabel={pendingChange?.confirmLabel ?? "Confirm"}
        cancelLabel="Go back"
      >
        {deactivating && (
          <Textarea
            id="deactivate-account-reason"
            label="Reason for deactivating"
            hint="The account holder sees this reason when they try to sign in. It is also saved to the audit log."
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
