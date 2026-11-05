import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/useToast";
import { submitDepositReference } from "@/lib/db";

type Method = "GCash" | "Bank transfer";

export function PaymentReferenceForm({
  reservationId,
  onSaved,
}: {
  reservationId: string;
  onSaved?: (method: Method, reference: string) => void;
}) {
  const { showToast } = useToast();
  const [method, setMethod] = useState<Method>("GCash");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference.trim() || saving) return;
    setSaving(true);
    try {
      await submitDepositReference({
        reservationId,
        method,
        reference: reference.trim(),
      });
      setSaved(true);
      onSaved?.(method, reference.trim());
      showToast("Payment reference sent for staff verification.", "success");
    } catch {
      showToast(
        "The payment reference could not be sent. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id={`payment-method-${reservationId}`}
          label="Payment method"
          value={method}
          onChange={(event) => setMethod(event.target.value as Method)}
        >
          <option>GCash</option>
          <option>Bank transfer</option>
        </Select>
        <Input
          id={`payment-reference-${reservationId}`}
          label="Payment reference"
          required
          maxLength={120}
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
            setSaved(false);
          }}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        loading={saving}
        disabled={!reference.trim() || saving}
      >
        {saved ? "Send updated reference" : "Send payment reference"}
      </Button>
    </form>
  );
}
