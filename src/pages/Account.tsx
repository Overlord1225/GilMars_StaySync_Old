import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import {
  PASSWORD_MIN_LENGTH,
  passwordField,
} from "@/features/auth/authSchemas";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import {
  clearDeletionRequest,
  getDeletionRequests,
  getGuestPreferences,
  requestAccountDeletion,
  saveGuestPreferences,
} from "@/lib/db";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
});
type FormValues = z.infer<typeof schema>;

const passwordSchema = z
  .object({ password: passwordField, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function Account() {
  const { profile, updateProfile, updatePassword } = useAuth();
  const { showToast } = useToast();
  const [deletionRequested, setDeletionRequested] = useState<boolean | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const isGuest = profile?.role === "guest";
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [contactPref, setContactPref] = useState("any");
  const [arrivalNote, setArrivalNote] = useState("");
  const [prefsBusy, setPrefsBusy] = useState(false);

  useEffect(() => {
    if (!isGuest) return;
    let active = true;
    getGuestPreferences()
      .then((rows) => {
        if (!active) return;
        setContactPref(rows[0]?.contact_preference ?? "any");
        setArrivalNote(rows[0]?.arrival_note ?? "");
        setPrefsLoaded(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isGuest]);

  async function savePrefs() {
    setPrefsBusy(true);
    try {
      await saveGuestPreferences({
        contactPreference: contactPref,
        arrivalNote,
      });
      showToast("Preferences saved.", "success");
    } catch {
      showToast(
        "We couldn’t save your preferences. Please try again.",
        "error",
      );
    } finally {
      setPrefsBusy(false);
    }
  }

  useEffect(() => {
    if (!isGuest) return;
    let active = true;
    getDeletionRequests()
      .then((rows) => {
        if (active) setDeletionRequested(rows.length > 0);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isGuest]);

  async function toggleDeletionRequest() {
    if (!profile) return;
    setDeleteBusy(true);
    try {
      if (deletionRequested) await clearDeletionRequest(profile.id);
      else await requestAccountDeletion(deleteReason);
      setDeletionRequested(!deletionRequested);
      setDeleteOpen(false);
      setDeleteReason("");
      showToast(
        deletionRequested
          ? "Your deletion request was withdrawn."
          : "Your deletion request was sent to GilMars staff.",
        "success",
      );
    } catch {
      showToast("We couldn’t update your request. Please try again.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }
  const {
    register: registerPassword,
    handleSubmit: handlePassword,
    reset: resetPasswordForm,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  });
  async function onPasswordSubmit({ password }: PasswordValues) {
    try {
      await updatePassword(password);
      resetPasswordForm();
      showToast("Your password was changed.", "success");
    } catch {
      setPasswordError("root", {
        message: "We couldn’t change your password. Please try again.",
      });
    }
  }
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });
  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name ?? "" });
  }, [profile, reset]);
  useUnsavedChangesGuard(
    isDirty,
    "You have unsaved profile changes. Leave this page and discard them?",
  );

  async function onSubmit(values: FormValues) {
    try {
      await updateProfile(values);
      reset(values);
      showToast("Your profile was saved.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your profile. Please try again.";
      setError("root", { message });
      showToast("Your profile wasn’t saved. Please try again.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account profile" />
      <Card className="p-5 sm:p-7">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <Input
            id="full_name"
            label="Full name"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          {errors.root?.message && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {errors.root.message}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !isDirty}
            >
              Save profile
            </Button>
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => reset({ full_name: profile?.full_name ?? "" })}
              >
                Discard changes
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card
        as="section"
        aria-labelledby="password-heading"
        className="p-5 sm:p-7"
      >
        <h2
          id="password-heading"
          className="font-heading text-xl text-brand-dark"
        >
          Password
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a new password of at least {PASSWORD_MIN_LENGTH} characters.
        </p>
        <form
          onSubmit={handlePassword(onPasswordSubmit)}
          className="mt-4 space-y-4"
          noValidate
        >
          <Input
            id="new_password"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={passwordErrors.password?.message}
            {...registerPassword("password")}
          />
          <Input
            id="confirm_password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword("confirmPassword")}
          />
          {passwordErrors.root?.message && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {passwordErrors.root.message}
            </p>
          )}
          <Button type="submit" loading={passwordSubmitting}>
            Change password
          </Button>
        </form>
        <p className="mt-3 text-sm text-ink-muted">
          Forgot your password?{" "}
          <Link className="text-brand underline" to="/forgot-password">
            Email me a reset link
          </Link>
        </p>
      </Card>
      {isGuest && prefsLoaded && (
        <Card
          as="section"
          aria-labelledby="prefs-heading"
          className="p-5 sm:p-7"
        >
          <h2
            id="prefs-heading"
            className="font-heading text-xl text-brand-dark"
          >
            Contact and arrival
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            GilMars staff can see this. It does not send you anything.
          </p>
          <div className="mt-4 grid gap-4 sm:max-w-md">
            <Select
              id="contact-pref"
              label="Best way to reach me"
              value={contactPref}
              onChange={(event) => setContactPref(event.target.value)}
            >
              <option value="any">Any</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </Select>
            <Textarea
              id="arrival-note"
              label="Arrival note (for example, arriving after 10 PM)"
              maxLength={300}
              value={arrivalNote}
              onChange={(event) => setArrivalNote(event.target.value)}
            />
            <Button
              className="self-start"
              loading={prefsBusy}
              onClick={() => void savePrefs()}
            >
              Save preferences
            </Button>
          </div>
        </Card>
      )}
      {isGuest && deletionRequested !== null && (
        <Card
          as="section"
          aria-labelledby="delete-heading"
          className="p-5 sm:p-7"
        >
          <h2
            id="delete-heading"
            className="font-heading text-xl text-brand-dark"
          >
            Delete my account
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {deletionRequested
              ? "Your request is waiting for GilMars staff. You can still sign in until they act on it."
              : "Ask GilMars staff to delete your account. Staff review each request, and some booking records may need to be kept."}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              deletionRequested
                ? void toggleDeletionRequest()
                : setDeleteOpen(true)
            }
            loading={deleteBusy && Boolean(deletionRequested)}
          >
            {deletionRequested
              ? "Withdraw request"
              : "Request account deletion"}
          </Button>
        </Card>
      )}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void toggleDeletionRequest()}
        loading={deleteBusy}
        title="Ask to delete your account?"
        consequence="Staff will review your request. Nothing is deleted until they act on it."
        confirmLabel="Send request"
        cancelLabel="Keep my account"
      >
        <Textarea
          id="delete-reason"
          label="Reason (optional)"
          maxLength={500}
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
