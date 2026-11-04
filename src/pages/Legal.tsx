import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Head } from "@/components/ui/Head";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBookingRules } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { POLICY_VERSION } from "@/lib/policies";

type Section = { title: string; body: ReactNode };
type Doc = "privacy" | "terms" | "cancellation" | "house-rules";

function useDeposit() {
  const [amount, setAmount] = useState(1500);
  useEffect(() => {
    void getBookingRules()
      .then((rules) => setAmount(rules.deposit_amount))
      .catch(() => undefined);
  }, []);
  return formatCurrency(amount);
}

function list(items: string[]) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function content(
  doc: Doc,
  deposit: string,
): { title: string; sections: Section[] } {
  switch (doc) {
    case "privacy":
      return {
        title: "Privacy notice",
        sections: [
          {
            title: "Who we are",
            body: "GilMars (the owner of the stays listed on StaySync) decides why and how your personal data is processed. This notice follows the Philippine Data Privacy Act of 2012 (Republic Act 10173).",
          },
          {
            title: "What we collect",
            body: list([
              "Account data: your name and email address, or your Google account name and email if you sign in with Google.",
              "Booking data: requested dates, unit, number of guests, notes, and deposit records entered by staff.",
              "Inquiry data: the messages you send and the category assigned to them.",
              "Activity records: staff actions on reservations are logged for accountability.",
            ]),
          },
          {
            title: "Why we use it",
            body: "To create your account, process reservation requests, confirm bookings, answer your inquiries and keep the booking calendar accurate. We do not use your data for advertising and we do not sell it.",
          },
          {
            title: "Who can see it",
            body: "GilMars staff and the owner can see your account, bookings and inquiries. Supabase hosts our database and authentication as our service provider. We disclose data to others only when the law requires it.",
          },
          {
            title: "How long we keep it",
            body: "We keep data for as long as needed to run your bookings and keep business records. TODO: owner to confirm the exact retention period.",
          },
          {
            title: "Your rights",
            body: list([
              "Be informed about how your data is processed.",
              "Access a copy of your data.",
              "Correct data that is wrong or out of date.",
              "Object to processing, or ask us to erase or block your data.",
              "Receive your data in a usable format.",
              "File a complaint with the National Privacy Commission (privacy.gov.ph).",
            ]),
          },
          {
            title: "Contact",
            body: (
              <>
                To use your rights, send a message through{" "}
                <Link className="text-brand underline" to="/inquire">
                  Ask a question
                </Link>
                . TODO: owner to add a data protection contact email.
              </>
            ),
          },
        ],
      };
    case "terms":
      return {
        title: "Terms of service",
        sections: [
          {
            title: "Using StaySync",
            body: "StaySync is a reservation and inquiry tool for GilMars stays. You must give accurate information and keep your login private. Staff may deactivate accounts that misuse the service.",
          },
          {
            title: "How booking works",
            body: list([
              "Sending a request does not hold dates. A request stays Pending until staff confirm it.",
              `A fixed deposit of ${deposit} must be paid and recorded before staff can confirm a direct booking.`,
              "Only Confirmed reservations block dates. Check-out is the day you leave and is not counted as a night, so back-to-back stays are allowed.",
              "Same-day bookings are not accepted. Requests must meet the minimum advance notice shown when you pick dates.",
              "StaySync does not take online payments. Pay using the account details given by GilMars staff.",
            ]),
          },
          {
            title: "Cancellations and house rules",
            body: (
              <>
                See the{" "}
                <Link
                  className="text-brand underline"
                  to="/cancellation-policy"
                >
                  cancellation policy
                </Link>{" "}
                and{" "}
                <Link className="text-brand underline" to="/house-rules">
                  house rules
                </Link>
                . They are part of these terms.
              </>
            ),
          },
          {
            title: "Liability",
            body: "We try to keep availability accurate but cannot promise the site is always error-free or online. GilMars is not liable for losses caused by events outside its control.",
          },
          {
            title: "Changes",
            body: `We may update these terms and the privacy notice. The current version is ${POLICY_VERSION}.`,
          },
        ],
      };
    case "cancellation":
      return {
        title: "Cancellation policy",
        sections: [
          {
            title: "Pending requests",
            body: "You can cancel a Pending request any time from My reservations using Cancel request. No deposit has been confirmed at that stage.",
          },
          {
            title: "Confirmed stays",
            body: "Message the GilMars team as early as you can so staff can advise you. TODO: owner to state whether the deposit is refundable, partly refundable or forfeited, and the cut-off period.",
          },
          {
            title: "Rescheduling",
            body: "Rescheduling is considered only in emergencies. Staff review each case.",
          },
        ],
      };
    case "house-rules":
      return {
        title: "House rules",
        sections: [
          {
            title: "Rules for all stays",
            body: list([
              "TODO: check-in and check-out times.",
              "TODO: maximum number of guests per unit.",
              "TODO: quiet hours.",
              "TODO: smoking, pets and visitors.",
              "TODO: damage and cleaning charges.",
            ]),
          },
        ],
      };
  }
}

export default function Legal({ doc }: { doc: Doc }) {
  const deposit = useDeposit();
  const { title, sections } = content(doc, deposit);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <Head title={title} />
      <PageHeader title={title} description={`Version ${POLICY_VERSION}`} />
      {sections.map((s, i) => (
        <Card key={s.title} className="space-y-2 p-5 sm:p-6">
          <h2 className="font-heading text-xl font-semibold text-brand-dark">
            {i + 1}. {s.title}
          </h2>
          <div className="text-sm leading-6 text-text-muted">{s.body}</div>
        </Card>
      ))}
    </div>
  );
}
