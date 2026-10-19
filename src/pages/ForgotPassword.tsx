import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/features/auth/useAuth";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });
  async function onSubmit({ email }: FormValues) {
    setSubmitError("");
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      setSubmitError(error instanceof Error && /rate limit|too many/i.test(error.message)
        ? "A reset email was requested recently. Wait a moment, then try again."
        : "We couldn’t send a reset email right now. Please try again.");
    }
  }

  return <AuthShell title="Reset your password" description="We’ll email you a secure link to choose a new password.">
    {sent ? <div className="space-y-4"><p className="rounded-control border border-success-200 bg-success-50 p-4 text-sm leading-6 text-success-700" role="status">If an account matches that email, a reset link is on its way. Open the link on this device to continue.</p><Button type="button" variant="outline" className="w-full" onClick={() => setSent(false)}>Try another email</Button></div> : <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      {submitError && <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{submitError}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
    </form>}
    <Link className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline" to="/login">Back to sign in</Link>
  </AuthShell>;
}
