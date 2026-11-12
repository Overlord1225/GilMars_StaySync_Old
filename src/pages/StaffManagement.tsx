import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { auditLog } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/types";

type ProfileEdit = {
  full_name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    full_name: string;
    email: string;
  }>({ full_name: "", email: "" });
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);

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
    void auditLog({
      action: `staff.${Object.keys(updates).join(".")}`,
      targetTable: "profiles",
      targetId: profile.id,
      targetDetails: {
        previous: {
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active,
        },
        updates,
      },
    });
    return true;
  }

  async function confirmChange() {
    if (!pendingChange || savingId) return;
    const saved = await updateStaff(
      pendingChange.profile,
      pendingChange.updates,
    );
    if (saved) setPendingChange(null);
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
      });
    }
    setCreating(false);
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id);
    setEditValues({
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
    });
  }

  async function saveEdit(profile: Profile) {
    if (editingId !== profile.id || savingId) return;
    const updates: ProfileEdit = {};
    if (editValues.full_name.trim() !== profile.full_name)
      updates.full_name = editValues.full_name.trim();
    if (editValues.email.trim() !== profile.email)
      updates.email = editValues.email.trim().toLowerCase();
    if (Object.keys(updates).length === 0) {
      setEditingId(null);
      return;
    }
    const saved = await updateStaff(profile, updates);
    if (saved) setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function confirmResetPassword() {
    if (!user || !resetTarget || savingId) return;
    setSavingId(resetTarget.id);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetTarget.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    if (resetError) {
      setError("Password reset email could not be sent. Please try again.");
      setSavingId(null);
    } else {
      void auditLog({
        action: "staff.reset_password",
        targetTable: "profiles",
        targetId: resetTarget.id,
        targetDetails: { email: resetTarget.email },
      });
      setResetTarget(null);
      setSavingId(null);
      showToast("Password reset email sent.", "success");
    }
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
            const isEditing = editingId === profile.id;
            return (
              <li
                key={profile.id}
                className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        id={`edit-full-name-${profile.id}`}
                        label="Full name"
                        autoComplete="name"
                        value={editValues.full_name}
                        onChange={(event) =>
                          setEditValues({
                            ...editValues,
                            full_name: event.target.value,
                          })
                        }
                      />
                      <Input
                        id={`edit-email-${profile.id}`}
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={editValues.email}
                        onChange={(event) =>
                          setEditValues({
                            ...editValues,
                            email: event.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => void saveEdit(profile)}
                          disabled={Boolean(savingId)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="font-heading text-lg text-brand-dark">
                        {profile.full_name || "Unnamed account"}
                      </h2>
                      <p className="text-sm text-ink-muted">{profile.email}</p>
                      {profile.id === user?.id && (
                        <p className="mt-1 text-xs text-ink-muted">
                          Your current account
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        className="-ml-3 text-brand"
                        onClick={() => startEdit(profile)}
                        disabled={Boolean(savingId)}
                      >
                        Edit details
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {profile.role === "guest" ? (
                    <span className="text-sm text-ink-muted">Guest</span>
                  ) : (
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
                  )}
                  {profile.id === user?.id ? (
                    <p className="max-w-48 text-sm text-ink-muted">
                      You can’t deactivate or reset your own account here.
                    </p>
                  ) : (
                    <>
                      <Button
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
                      <Button
                        variant="outline"
                        disabled={savingId === profile.id}
                        onClick={() => setResetTarget(profile)}
                      >
                        Reset password
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
                      minLength={12}
                      hint="Use at least 12 characters."
                      value={newStaff.temporaryPassword}
                      onChange={(event) =>
                        setNewStaff({
                          ...newStaff,
                          temporaryPassword: event.target.value,
                        })
                      }
                    />
                    <div className="flex items-end">
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
          if (!savingId) setPendingChange(null);
        }}
        onConfirm={() => void confirmChange()}
        loading={Boolean(savingId)}
        title={pendingChange?.title ?? "Confirm staff change"}
        consequence={pendingChange?.consequence ?? ""}
        confirmLabel={pendingChange?.confirmLabel ?? "Confirm"}
        cancelLabel="Go back"
      />
      {resetTarget && (
        <ConfirmDialog
          open={Boolean(resetTarget)}
          onClose={() => setResetTarget(null)}
          onConfirm={() => void confirmResetPassword()}
          loading={savingId === resetTarget.id}
          title={`Reset password for ${resetTarget.full_name || "this staff account"}?`}
          consequence={`A password reset link will be sent to ${resetTarget.email}. The staff member can use it to set a new password.`}
          confirmLabel="Send reset email"
          cancelLabel="Cancel"
        />
      )}
    </section>
  );
}
