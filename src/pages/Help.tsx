import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBookingRules } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

const questions = [
  {
    title: "Can I book for today?",
    answer: "No. StaySync accepts advance requests only. Choose a check-in date that meets the minimum notice shown above the date calendar.",
  },
  {
    title: "How is the check-out date counted?",
    answer: "Check-out is the day you leave. It is exclusive and is not counted as a night in the stay price.",
  },
  {
    title: "How much is the deposit, and how can I pay?",
    answer: "Pay by GCash or bank transfer using the current verified account details shared by GilMars staff. StaySync does not take online payments.",
  },
  {
    title: "When are my dates held?",
    answer: "Sending a request does not hold dates. GilMars staff must verify the deposit and confirm your request before the dates are held.",
  },
  {
    title: "How do I cancel a request?",
    answer: "While a reservation request is Pending, open My reservations and choose Cancel request. If your stay is already Confirmed, send the GilMars team a message so staff can advise you.",
  },
  {
    title: "Can I reschedule my stay?",
    answer: "Rescheduling is considered only in emergencies. Send the GilMars team a message as soon as you can; staff will review your situation.",
  },
  {
    title: "How are inquiry categories assigned?",
    answer: "StaySync assigns a category to your message automatically, so you do not need to choose one. Booking request is about requesting a stay, Availability is about open dates, General question covers other information, and Concern is a complaint or problem for the team to review.",
  },
];

export default function Help() {
  const [depositAmount, setDepositAmount] = useState(1500);
  useEffect(() => { void getBookingRules().then((rules) => setDepositAmount(rules.deposit_amount)).catch(() => undefined); }, []);

  return <div className="mx-auto max-w-4xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader title="Help and booking rules" description="Answers about dates, reservation requests, deposits and messages to GilMars." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Help" }]} />

    <section aria-labelledby="help-booking-title" className="space-y-4">
      <h2 id="help-booking-title" className="font-heading text-2xl font-semibold text-brand-dark">Booking questions</h2>
      {questions.slice(0, 6).map((item) => <details key={item.title} className="group rounded-card border border-border bg-surface p-4 open:shadow-soft sm:p-5">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-control font-semibold text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
          {item.title}
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-brand transition-transform duration-ui group-open:rotate-180 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <p className="pt-3 text-sm leading-6 text-text-muted">{item.title === "How much is the deposit, and how can I pay?" ? `The current deposit is ${formatCurrency(depositAmount)}. ${item.answer}` : item.answer}</p>
      </details>)}
    </section>

    <section aria-labelledby="help-inquiries-title" className="space-y-4">
      <h2 id="help-inquiries-title" className="font-heading text-2xl font-semibold text-brand-dark">Inquiries and contact</h2>
      <Card className="space-y-3 p-5 sm:p-6">
        <h3 className="font-semibold text-brand-dark">How does StaySync categorize a message?</h3>
        <p className="text-sm leading-6 text-text-muted">{questions[6]?.answer}</p>
        <p className="text-sm leading-6 text-text-muted">Contact the GilMars team through the Ask a question form in StaySync. Sign in to send a message and follow its status under My inquiries. StaySync does not currently list a public phone number or email address.</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link to="/inquire" className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-white hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Ask a question</Link>
          <Link to="/my-inquiries" className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 font-medium text-text hover:bg-cream focus-visible:ring-2 focus-visible:ring-brand">My inquiries</Link>
        </div>
      </Card>
    </section>

    <Card className="p-5 sm:p-6">
      <h2 className="font-heading text-xl font-semibold text-brand-dark">Need to choose dates?</h2>
      <p className="mt-2 text-sm leading-6 text-text-muted">Browse the stays or check availability. The calendar shows the earliest date you can request and marks booked dates.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/units" className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 font-medium text-text hover:bg-cream focus-visible:ring-2 focus-visible:ring-brand">Browse stays</Link>
        <Link to="/availability" className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 font-medium text-text hover:bg-cream focus-visible:ring-2 focus-visible:ring-brand">Check availability</Link>
      </div>
    </Card>
  </div>;
}
