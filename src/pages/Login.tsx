import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/useAuth";
import { roleRedirect } from "@/features/auth/roleRedirect";
import { loginSchema, type LoginValues } from "@/features/auth/authSchemas";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Login() {
  const { signIn, signInWithOAuth, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  const requestedPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (!loading && user?.is_active && user.role) {
      navigate(roleRedirect(user.role, requestedPath), { replace: true });
    }
  }, [loading, user, requestedPath, navigate]);

  async function onSubmit(values: LoginValues) {
    try {
      const role = await signIn(values.email, values.password);
      navigate(roleRedirect(role, requestedPath), { replace: true });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message =
        /invalid login credentials|invalid email or password/i.test(rawMessage)
          ? "Email or password is incorrect."
          : /inactive|profile|provisioned/i.test(rawMessage)
            ? "We couldn’t open your account profile. Please contact the GilMars team for help."
            : "We couldn’t sign you in right now. Check your details and try again.";
      setError("root", { message });
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your GilMars stay."
    >
      {message && (
        <p
          role="status"
          className="mb-4 rounded-control border border-success-200 bg-success-50 p-3 text-sm text-success-700"
        >
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="space-y-1">
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-control px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>
        {errors.root?.message && (
          <p
            role="alert"
            className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <div className="mt-5 flex items-center gap-3 text-xs text-text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        or continue with
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={isSubmitting}
        onClick={() => void signInWithOAuth("google")}
      >
        <svg aria-hidden="true" className="mr-2 size-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.05c0-.8-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <Link
          to="/forgot-password"
          className="inline-flex min-h-11 items-center font-medium text-brand hover:underline"
        >
          Forgot password?
        </Link>
        <Link
          to="/register"
          className="inline-flex min-h-11 items-center font-medium text-brand hover:underline"
        >
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
