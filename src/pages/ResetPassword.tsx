import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/features/auth/useAuth";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const { session, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });
  async function onSubmit({ password }: FormValues) {
    setSubmitError("");
    try {
      await updatePassword(password);
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Sign in with your new password." },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error && /session|token|expired/i.test(error.message)
          ? "This reset link may have expired. Request a new link and open it on this device."
          : "We couldn’t update your password right now. Please try again.",
      );
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Set a new password for your GilMars StaySync account."
    >
      {!session ? (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-text-muted">
            Open the password reset link from your email on this device to
            continue.
          </p>
          <Link
            className="inline-flex min-h-11 items-center font-medium text-brand underline"
            to="/forgot-password"
          >
            Request another link
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <Input
              id="password"
              label="New password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>
          <div>
            <Input
              id="confirmPassword"
              label="Confirm new password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand"
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((value) => !value)}
            >
              {showConfirmPassword ? "Hide password" : "Show password"}
            </button>
          </div>
          {submitError && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {submitError}
            </p>
          )}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
