import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/useToast";
import { getBookingRules, saveBookingRules } from "@/lib/db";

export default function BookingRules() {
  const { showToast } = useToast();
  const [advanceDays, setAdvanceDays] = useState("1");
  const [deposit, setDeposit] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let mounted = true;
    getBookingRules()
      .then((rules) => {
        if (!mounted) return;
        setAdvanceDays(String(rules.min_advance_days));
        setDeposit(String(rules.deposit_amount));
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [retry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveBookingRules({
        min_advance_days: Math.max(1, Number(advanceDays)),
        deposit_amount: Math.max(0, Number(deposit)),
      });
      showToast("Booking rules saved.", "success");
    } catch {
      setError("We couldn’t save the booking rules. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  if (loadError)
    return (
      <EmptyState
        title="Booking rules did not load"
        description="We couldn’t load the booking rules. Please try again."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setLoadError(false);
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );
  return (
    <section className="max-w-2xl space-y-6">
      <PageHeader title="Booking rules" />
      <Card>
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          <Input
            id="min-advance"
            label="Minimum advance days"
            type="number"
            min="1"
            step="1"
            required
            value={advanceDays}
            onChange={(event) => setAdvanceDays(event.target.value)}
            hint="Guests cannot request same-day stays."
          />
          <Input
            id="deposit-amount"
            label="Down payment (PHP, non-refundable)"
            type="number"
            min="0"
            step="0.01"
            required
            value={deposit}
            hint="Guests see this as the down payment when they request a stay."
            onChange={(event) => setDeposit(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger-700">
              {error}
            </p>
          )}
          <Button type="submit" loading={saving}>
            Save rules
          </Button>
        </form>
      </Card>
    </section>
  );
}
