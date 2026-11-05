import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { createInquiry } from "../lib/db";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/useToast";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import type { Inquiry } from "../lib/types";

export default function InquiryForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sentInquiry, setSentInquiry] = useState<Inquiry | null>(null);
  useUnsavedChangesGuard(
    Boolean((subject.trim() || message.trim()) && !sentInquiry),
    "You have an unsent message. Leave this page and discard it?",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !message.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const inquiry = await createInquiry({
        guest_id: user.id,
        message: message.trim(),
        subject: subject.trim() || null,
        unit_id: null,
        category: null,
        category_source: "auto",
        corrected_at: null,
        corrected_by: null,
        original_category: null,
        matched_keywords: [],
        status: "new",
      });
      setSentInquiry(inquiry);
      showToast("Your message was sent to GilMars.", "success");
    } catch {
      setError(
        "We couldn’t send your message right now. Please try again; your message is still here.",
      );
      showToast("Your message wasn’t sent. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (sentInquiry)
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Message sent"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "My inquiries", href: "/my-inquiries" },
            { label: "Sent" },
          ]}
        />
        <Card className="space-y-4 p-5 sm:p-7">
          <p className="font-semibold text-brand-dark">
            {sentInquiry.subject || "Your message"}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
            {sentInquiry.message}
          </p>
          <p className="text-sm text-ink-muted">
            GilMars staff will reply in My inquiries. Check back there for the
            answer.
          </p>
          <Link
            to="/my-inquiries"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark"
          >
            View my inquiries
          </Link>
        </Card>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Ask GilMars a question"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "My inquiries", href: "/my-inquiries" },
          { label: "Ask a question" },
        ]}
      />
      <Card className="p-5 sm:p-7">
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          <Input
            id="inquiry-subject"
            label="Subject (optional)"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={100}
          />
          <div>
            <Textarea
              id="inquiry-message"
              label="Your message"
              required
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              hint="Include your dates, the stay and group size if relevant. Please don’t include bank or card details."
            />
            <p className="mt-1 text-right text-xs text-ink-muted">
              {message.length}/1,000 characters
            </p>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link
              to="/my-inquiries"
              className="inline-flex min-h-11 items-center justify-center rounded-control px-4 font-medium text-brand hover:bg-brand-light sm:-ml-4"
            >
              Back to my inquiries
            </Link>
            <Button
              type="submit"
              loading={saving}
              disabled={saving || !message.trim()}
            >
              Send question
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
