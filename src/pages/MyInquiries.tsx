import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { getInquiriesByGuest } from "../lib/db";
import { formatStayDate } from "../lib/format";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { StatusTimeline } from "../components/ui/StatusTimeline";
import { Pagination } from "../components/ui/Pagination";
import type { Inquiry } from "../lib/types";

const PAGE_SIZE = 10;

const categories: Record<string, string> = {
  booking_request: "Booking request",
  availability_inquiry: "Availability",
  general_question: "General question",
  complaint: "Concern",
};

function statusMessage(status: Inquiry["status"]): string {
  if (status === "new") return "Your note is waiting for the GilMars team to review.";
  if (status === "in_progress") return "The team is looking into your message. Check here for the latest status.";
  return "The team has marked this conversation as resolved. If you still need help, send a new message.";
}

export default function MyInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    getInquiriesByGuest(user.id)
      .then((rows) => { if (mounted) setInquiries(rows); })
      .catch(() => { if (mounted) setError("We couldn’t load your messages. Please try again."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user, retry]);

  const retryLoad = () => { setError(""); setLoading(true); setRetry((value) => value + 1); };
  const pageCount = Math.ceil(inquiries.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const pageInquiries = inquiries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-64" /><Skeleton className="h-44 w-full rounded-card" /><Skeleton className="h-44 w-full rounded-card" /></div>;
  if (error) return <EmptyState title="Messages didn’t load" description={error} action={<Button variant="outline" onClick={retryLoad}>Try again</Button>} />;

  return <div className="space-y-6"><PageHeader title="My inquiries" description="Messages you’ve sent and the latest status from the GilMars team." breadcrumbs={[{ label: "Home", href: "/" }, { label: "My inquiries" }]} actions={<Link to="/inquire" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand">Ask a question</Link>} />
    {!inquiries.length ? <EmptyState title="No messages yet" description="Send a note if you need help with a stay or have a question before booking." action={<Link to="/inquire" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark">Send a message</Link>} /> : <div className="space-y-4">{pageInquiries.map((inquiry) => <article key={inquiry.id} className="rounded-card border border-border bg-surface p-4 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium text-text-muted">Sent {formatStayDate(inquiry.created_at.slice(0, 10))}</p><h2 className="mt-1 font-heading text-xl font-semibold text-brand-dark">{inquiry.subject || "Your message"}</h2></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-border bg-cream px-2.5 py-1 text-xs font-medium text-text-muted">{categories[inquiry.category ?? "general_question"] ?? "General question"}</span><StatusBadge status={inquiry.status} /></div></div>
      <div className="mt-4 max-w-3xl rounded-card rounded-tl-none bg-brand-light p-4"><p className="text-xs font-semibold text-brand-dark">You</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{inquiry.message}</p></div>
      <div className="mt-4 border-t border-border pt-4"><StatusTimeline status={inquiry.status} /><p className="mt-3 text-sm leading-5 text-text-muted">{statusMessage(inquiry.status)}</p></div>
    </article>)}{pageCount > 1 && <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} label="messages" />}</div>}
  </div>;
}
