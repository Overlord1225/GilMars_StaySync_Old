import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

const schema = z.object({ full_name: z.string().trim().min(2, "Enter your full name.") });
type FormValues = z.infer<typeof schema>;

export default function Account() {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });
  useEffect(() => { if (profile) reset({ full_name: profile.full_name ?? "" }); }, [profile, reset]);
  useUnsavedChangesGuard(isDirty, "You have unsaved profile changes. Leave this page and discard them?");

  async function onSubmit(values: FormValues) {
    try {
      await updateProfile(values);
      reset(values);
      showToast("Your profile was saved.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save your profile. Please try again.";
      setError("root", { message });
      showToast("Your profile wasn’t saved. Please try again.", "error");
    }
  }

  return <div className="mx-auto max-w-2xl space-y-6"><PageHeader title="Account profile" description="Update the name GilMars uses when we contact you about your stay." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]} />
    <Card className="p-5 sm:p-7"><form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Input id="full_name" label="Full name" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
      {errors.root?.message && <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{errors.root.message}</p>}
      {isDirty && <p role="status" className="text-sm text-warning-800">You have unsaved changes. Leaving this page will ask before discarding them.</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button type="submit" loading={isSubmitting} disabled={isSubmitting || !isDirty}>Save profile</Button>{isDirty && <Button type="button" variant="outline" onClick={() => reset({ full_name: profile?.full_name ?? "" })}>Discard changes</Button>}</div>
    </form></Card>
  </div>;
}
