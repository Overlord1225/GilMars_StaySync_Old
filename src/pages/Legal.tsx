import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Head } from "@/components/ui/Head";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBookingRules } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { CHECK_IN_TIME, CHECK_OUT_TIME, POLICY_VERSION } from "@/lib/policies";

type Section = { title: string; body: ReactNode };
type Doc = "privacy" | "terms" | "cancellation" | "house-rules";

function useDeposit() {
  const [amount, setAmount] = useState(1000);
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
              `A non-refundable down payment of ${deposit} must be paid and recorded before staff can confirm a direct booking.`,
              "Full payment is due on or before check-in. Meet GilMars staff at the clubhouse for contract signing and to complete payment.",
              "Bring valid IDs at check-in. Unregistered guests are strictly not allowed.",
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
            body: "You can cancel a Pending request any time from My reservations using Cancel request. No down payment has been confirmed at that stage.",
          },
          {
            title: "Confirmed stays",
            body: "Cancellation of a confirmed booking is strictly not allowed. The down payment is non-refundable, and the security and cleaning deposits are not refunded for a cancelled booking.",
          },
          {
            title: "Rescheduling",
            body: "Rescheduling must be requested at least 5 days before the booking date, with an additional fee of 30% of the rate. Message the GilMars team to arrange it.",
          },
        ],
      };
    case "house-rules":
      return {
        title: "House rules",
        sections: [
          {
            title: "Check-in and check-out",
            body: list([
              `Check-in is ${CHECK_IN_TIME}. Standard check-out is ${CHECK_OUT_TIME}, regardless of the check-in time.`,
              "No early or late check-in, and no late check-out. Additional hours cost ₱300 per hour.",
              "On check-in, meet staff at the clubhouse for contract signing and completion of payment.",
              "Turn off the air conditioning and TV at check-out.",
              "Keep to the maximum number of guests shown on each unit.",
            ]),
          },
          {
            title: "In the unit",
            body: list([
              "No pets.",
              "Strictly no smoking or vaping inside the unit.",
              "Alcohol is allowed. Please drink responsibly.",
              "No cooking inside the unit. Take-out food, snacks and drinks are allowed, and utensils are provided.",
              "Be considerate of noise, especially during quiet hours.",
              "Wear slippers inside the unit to keep it clean.",
            ]),
          },
          {
            title: "Clean as you go (CLAYGO)",
            body: list([
              "Tidy up as you go. Wash and put away used dishes, and dispose of trash daily in the garbage room.",
              "A ₱500 cleaning fee applies if the unit or bathroom is left untidy.",
              "An extra garbage bag is under the sink.",
              "Unit 122 garbage area: left side of the hallway, outside the glass (grey) door. For other units, staff will show you at check-in.",
            ]),
          },
          {
            title: "Pool",
            body: list([
              "Open from 6:00 AM to 10:00 PM.",
              "The pool pass is good for one day only.",
              "Bring non-cotton clothes for swimming.",
              "No eating at the pool area.",
            ]),
          },
          {
            title: "Charges and deposits",
            body: list([
              "Lost or damaged appliances, home decor, utensils and other items are charged to the guest.",
              "Lost keys are fined ₱1,000.",
              "Extra blanket or towel: ₱100 each.",
              "A ₱500 security deposit and a ₱500 cleaning deposit are collected at check-in and refunded at check-out. They are not refunded for cancelled bookings.",
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
          <h2 className="font-heading text-xl text-brand-dark">
            {i + 1}. {s.title}
          </h2>
          <div className="text-sm leading-6 text-ink-muted">{s.body}</div>
        </Card>
      ))}
    </div>
  );
}
