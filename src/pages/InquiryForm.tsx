import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { createInquiry } from "../lib/db";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
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
          description="Your note is in the GilMars inbox. You can follow its status from My inquiries."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "My inquiries", href: "/my-inquiries" },
            { label: "Sent" },
          ]}
        />
        <Card className="space-y-4 p-5 sm:p-7">
          <div
            role="status"
            className="rounded-control border border-success-200 bg-success-50 p-4 text-sm leading-6 text-success-700"
          >
            Thanks for reaching out. We’ve received your message and the GilMars
            team will review it.
          </div>
          <p className="font-semibold text-brand-dark">
            {sentInquiry.subject || "Your message"}
          </p>
          <p className="whitespace-pre-wrap rounded-control bg-cream p-4 text-sm leading-6 text-text">
            {sentInquiry.message}
          </p>
          <Link
            to="/my-inquiries"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand"
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
        description="Send a short note and we’ll route it to the right person."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "My inquiries", href: "/my-inquiries" },
          { label: "New message" },
        ]}
      />
      <Card className="p-5 sm:p-7">
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          <label className="block space-y-1.5 text-sm font-medium text-text">
            Subject{" "}
            <span className="font-normal text-text-muted">(optional)</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={100}
              className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal focus-visible:ring-2 focus-visible:ring-brand"
            />
          </label>
          <div>
            <Textarea
              id="inquiry-message"
              label="Your message"
              required
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              hint="Tell us what you need help with. Please don’t include bank or card details."
            />
            <p
              aria-live="polite"
              className="mt-1 text-right text-xs text-text-muted"
            >
              {message.length}/1,000 characters
            </p>
          </div>
          <aside className="rounded-control border border-border bg-cream p-4">
            <h2 className="text-sm font-semibold text-brand-dark">
              A few helpful details
            </h2>
            <p className="mt-1 text-sm leading-5 text-text-muted">
              StaySync categorizes your message automatically. You don’t need to
              choose a category.
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-5 text-text-muted">
              <li>Your preferred dates and stay name</li>
              <li>How many guests are in your group</li>
              <li>A short description of the question or concern</li>
            </ul>
          </aside>
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
              className="inline-flex min-h-11 items-center justify-center rounded-control px-4 font-medium text-brand hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand"
            >
              Back to my inquiries
            </Link>
            <Button
              type="submit"
              loading={saving}
              disabled={saving || !message.trim()}
            >
              Send message
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
