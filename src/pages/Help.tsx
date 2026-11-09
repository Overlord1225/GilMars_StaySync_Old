import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBookingRules } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/features/auth/useAuth";
import {
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  CONTACT_EMAIL,
  SOCIAL_NAME,
} from "@/lib/policies";

const questions = [
  {
    title: "Can I book for today?",
    answer:
      "No. You cannot book for today. Choose a check-in date that is at least the minimum number of days away, shown above the calendar.",
  },
  {
    title: "How is the check-out date counted?",
    answer:
      "Check-out is the day you leave. You are not charged for that day, so a stay from the 10th to the 12th is 2 nights.",
  },
  {
    title: "How much is the down payment, and how can I pay?",
    answer:
      "It is non-refundable. Pay by GCash or bank transfer using the current verified account details shared by GilMars staff. Full payment is due on or before check-in. StaySync does not take online payments.",
  },
  {
    title: "How are rates charged, and do you offer day tours?",
    answer:
      "Overnight rates are per night and depend on the number of guests; see each stay for its rates. Extra guests beyond the listed rates are charged per night. Day tours (₱1,599 for 1–2 guests, ₱2,099 for 3, ₱2,599 for 4, plus ₱300 per extra guest) are arranged with the team through an inquiry and are not booked on StaySync. The regular rate applies on holidays and for concerts at the PH Arena.",
  },
  {
    title: "What time are check-in and check-out?",
    answer: `Check-in is ${CHECK_IN_TIME} and check-out is ${CHECK_OUT_TIME}, regardless of check-in time. Early or late check-in and late check-out are not allowed; extra hours cost ₱300 per hour.`,
  },
  {
    title: "What should I bring?",
    answer:
      "Valid IDs for every guest at check-in (unregistered guests are not allowed) and non-cotton clothes for the pool. A ₱500 security deposit and ₱500 cleaning deposit are collected at check-in and refunded at check-out.",
  },
  {
    title: "When are my dates held?",
    answer:
      "Sending a request does not hold dates. GilMars staff must verify the down payment and confirm your request before the dates are held.",
  },
  {
    title: "How do I cancel a request?",
    answer:
      "While a reservation request is Pending, open My reservations and choose Cancel request. Confirmed bookings cannot be cancelled and the down payment is non-refundable.",
  },
  {
    title: "Can I reschedule my stay?",
    answer:
      "Rescheduling must be requested at least 5 days before your booking date, with an additional fee of 30% of the rate. Send the GilMars team a message to arrange it.",
  },
  {
    title: "How are inquiry categories assigned?",
    answer:
      "StaySync assigns a category to your message automatically, so you do not need to choose one. Booking request is about requesting a stay, Availability is about open dates, General question covers other information, and Concern is a complaint or problem for the team to review.",
  },
];

export default function Help() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "super_admin";
  const [depositAmount, setDepositAmount] = useState(1000);
  useEffect(() => {
    void getBookingRules()
      .then((rules) => setDepositAmount(rules.deposit_amount))
      .catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Help and booking rules" />

      <section aria-labelledby="help-booking-title" className="space-y-2">
        <h2
          id="help-booking-title"
          className="font-heading text-2xl text-brand-dark"
        >
          Booking questions
        </h2>
        {questions.map((item) => (
          <details
            key={item.title}
            className="group border-b border-rule-strong py-2"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-control font-medium text-brand-dark [&::-webkit-details-marker]:hidden">
              {item.title}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-brand transition-transform duration-ui group-open:rotate-180 motion-reduce:transition-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pt-3 text-sm leading-6 text-ink-muted">
              {item.title === "How much is the down payment, and how can I pay?"
                ? `The current down payment is ${formatCurrency(depositAmount)}. ${item.answer}`
                : item.answer}
            </p>
          </details>
        ))}
      </section>

      <section aria-labelledby="help-inquiries-title" className="space-y-4">
        <h2
          id="help-inquiries-title"
          className="font-heading text-2xl text-brand-dark"
        >
          Inquiries and contact
        </h2>
        <Card className="space-y-3 p-5 sm:p-6">
          <p className="text-sm leading-6 text-ink-muted">
            Contact the GilMars team through the Ask a question form. Sign in to
            send a message and follow its status under My inquiries.
          </p>
          <p className="text-sm leading-6 text-ink-muted">
            Email{" "}
            <a
              className="text-brand underline"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>{" "}
            or message {SOCIAL_NAME} on Facebook and Instagram.
          </p>
          {!isStaff && (
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/inquire"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 font-medium text-on-fill hover:bg-brand-dark"
              >
                Ask a question
              </Link>
              <Link
                to="/my-inquiries"
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-rule-strong bg-surface px-4 font-medium text-ink hover:bg-paper"
              >
                My inquiries
              </Link>
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby="help-dates-title" className="space-y-3">
        <h2
          id="help-dates-title"
          className="font-heading text-2xl text-brand-dark"
        >
          Need to choose dates?
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/units"
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-rule-strong bg-surface px-4 font-medium text-ink hover:bg-paper"
          >
            Browse stays
          </Link>
        </div>
      </section>
    </div>
  );
}
