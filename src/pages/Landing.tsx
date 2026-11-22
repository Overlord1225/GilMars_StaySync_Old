import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BookingRule, Unit } from "../lib/types";
import { addDays, earliestCheckIn } from "../lib/dates";
import { formatCurrency } from "../lib/format";
import { getActiveUnits, getBookingRules } from "../lib/db";
import { guestTierSummary } from "../lib/pricing";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StayImage } from "../components/public/StayImage";
import { UnitCard } from "../components/public/UnitCard";
import { Head } from "../components/ui/Head";
import poolPhoto from "../assets/pool.jpg";
import heroPhoto from "../assets/unit-g-studio.jpg";
import {
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  CLEANING_DEPOSIT,
  SECURITY_DEPOSIT,
} from "@/lib/policies";
import { Plus } from "lucide-react";
import { siteJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/siteUrl";

export default function Landing() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [rules, setRules] = useState<BookingRule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [searchError, setSearchError] = useState<{
    field: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getActiveUnits(), getBookingRules()])
      .then(([unitRows, bookingRules]) => {
        if (!mounted) return;
        // Simulated study units stay on /units but not on the landing page.
        setUnits(unitRows.filter((unit) => !/\(demo\)/i.test(unit.name)));
        setRules(bookingRules);
        setLoaded(true);
      })
      .catch(() => {
        if (mounted) {
          setLoadError(true);
          setLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const minimumAdvanceDays = Math.max(1, rules?.min_advance_days ?? 1);
  const minimumDate = earliestCheckIn(minimumAdvanceDays);
  const depositAmount = rules?.deposit_amount ?? 1000;
  // Only compare when the stays differ; today every other row is identical.
  const unitsDiffer = units.some(
    (unit) =>
      unit.price_per_night !== units[0]?.price_per_night ||
      unit.capacity !== units[0]?.capacity,
  );
  // Hero shows the Building G (Unit 530) cover: the best whole-room shot. Falls
  // back to the first unit if that unit is renamed or inactive.
  const maxGuests = units.length
    ? Math.max(...units.map((unit) => unit.capacity))
    : 6;
  const searchGuests = Math.min(guests, maxGuests);
  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = !checkIn
      ? { field: "home-check-in", message: "Choose a check-in date." }
      : checkIn < minimumDate
        ? {
            field: "home-check-in",
            message: `Check-in must be at least ${minimumAdvanceDays} ${minimumAdvanceDays === 1 ? "day" : "days"} from today.`,
          }
        : !checkOut || checkOut <= checkIn
          ? {
              field: "home-check-out",
              message: "Choose a check-out date after check-in.",
            }
          : null;
    setSearchError(problem);
    if (problem) {
      document.getElementById(problem.field)?.focus();
      return;
    }
    const query = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests: String(searchGuests),
    });
    navigate(`/units?${query.toString()}`);
  };

  return (
    <>
      <Head
        title="Home"
        description="A welcoming stay in the Philippines — find a comfortable place for your next visit at GilMars StaySync."
        jsonLd={siteJsonLd(SITE_URL)}
      />
      <div className="bg-paper">
        <p className="bg-mango-light px-4 py-2 text-center text-sm text-brand-dark">
          {formatCurrency(depositAmount)} non-refundable down payment is needed
          to confirm your stay.
        </p>
        <section className="relative isolate flex min-h-[44rem] flex-col overflow-hidden bg-paper lg:min-h-[85svh]">
          <div className="absolute inset-0">
            <StayImage
              src={heroPhoto}
              alt=""
              priority
              className="size-full rounded-none"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-hero-scrim via-hero-scrim/60 to-hero-scrim/30"
          />
          <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-10 lg:px-8 lg:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl text-on-band sm:text-5xl lg:text-display">
                A little more room to feel at home.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-lg text-on-band">
                GilMars stays, booked directly with the team. Pick your dates,
                send a request, and we’ll confirm with you.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/units"
                  className={buttonClass(
                    "primary",
                    "focus-visible:ring-2 focus-visible:ring-white",
                  )}
                >
                  Browse our stays
                </Link>
                <Link
                  to="/inquire"
                  className={buttonClass(
                    "secondary",
                    "focus-visible:ring-2 focus-visible:ring-white",
                  )}
                >
                  Ask a question
                </Link>
              </div>
            </div>
            <section
              aria-labelledby="quick-search-title"
              className="mx-auto mt-auto w-full max-w-4xl pt-16"
            >
              <form
                noValidate
                onSubmit={handleQuickSearch}
                className="grid gap-4 rounded-panel border border-rule bg-surface p-5 shadow-raised sm:grid-cols-2 sm:p-6 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
              >
                <h2
                  id="quick-search-title"
                  className="text-xl text-brand-dark sm:col-span-2 md:col-span-4"
                >
                  Start with your dates
                </h2>
                <Input
                  id="home-check-in"
                  label="Check-in"
                  required
                  type="date"
                  min={minimumDate}
                  value={checkIn}
                  error={
                    searchError?.field === "home-check-in"
                      ? searchError.message
                      : undefined
                  }
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    setSearchError(null);
                  }}
                />
                <Input
                  id="home-check-out"
                  label="Check-out"
                  required
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : minimumDate}
                  value={checkOut}
                  error={
                    searchError?.field === "home-check-out"
                      ? searchError.message
                      : undefined
                  }
                  onChange={(event) => {
                    setCheckOut(event.target.value);
                    setSearchError(null);
                  }}
                />
                <Select
                  id="home-guests"
                  label="Guests"
                  value={searchGuests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                >
                  {Array.from(
                    { length: maxGuests },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </Select>
                <Button
                  type="submit"
                  className="w-full sm:col-span-2 md:col-span-1"
                >
                  Search
                </Button>
              </form>
            </section>
          </div>
        </section>

        <section aria-labelledby="units-heading" className="bg-paper">
          <div className="reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mb-8">
              <h2
                id="units-heading"
                className="text-3xl text-brand-dark sm:text-4xl"
              >
                Our stays
              </h2>
            </div>
            {loadError ? (
              <Card className="p-5" role="alert">
                <p className="text-sm text-danger-700">
                  We couldn’t load the stays right now. Please try browsing all
                  units.
                </p>
                <Link
                  to="/units"
                  className="mt-2 inline-flex min-h-11 items-center font-medium text-brand underline"
                >
                  Browse units
                </Link>
              </Card>
            ) : !loaded ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="space-y-3">
                    <Skeleton
                      className="aspect-card w-full rounded-card"
                      label="Loading stay photo"
                    />
                    <Skeleton className="h-6 w-2/3" label="Loading stay name" />
                    <Skeleton
                      className="h-4 w-full"
                      label="Loading stay details"
                    />
                  </div>
                ))}
              </div>
            ) : units.length === 0 ? (
              <EmptyState
                title="No stays are available yet"
                description="Please check again soon, or browse all our stays when they reopen."
                action={
                  <Link
                    to="/units"
                    className="inline-flex min-h-11 items-center font-medium text-brand underline"
                  >
                    Browse stays
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 md:gap-10">
                {units.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    to={`/units/${unit.id}`}
                    compact
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="border-y border-mango bg-surface">
          <section
            aria-labelledby="steps-heading"
            className="reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
          >
            <div>
              <h2
                id="steps-heading"
                className="text-3xl text-brand-dark sm:text-4xl"
              >
                A simple way to book
              </h2>
              <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
                {[
                  {
                    title: "Choose your dates",
                    text: `Select a stay and dates in advance. We need at least ${minimumAdvanceDays} ${minimumAdvanceDays === 1 ? "day" : "days"} notice.`,
                  },
                  {
                    title: "Send a request",
                    text: "Share your guest details and review your stay before sending the request.",
                  },
                  {
                    title: "Verify your down payment",
                    text: "Pay the down payment by GCash or bank transfer. Your dates are held once staff verify it and confirm.",
                  },
                ].map((step, index) => (
                  <li
                    key={step.title}
                    className="border-t-2 border-mango pt-4 md:[&:nth-child(2)]:mt-10 md:[&:nth-child(3)]:mt-20"
                  >
                    <span
                      aria-hidden="true"
                      className="font-heading text-6xl tabular-nums text-brand"
                    >
                      {index + 1}
                    </span>
                    <h3 className="mt-3 text-2xl text-brand-dark">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-ink-muted">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {unitsDiffer && (
            <section
              aria-labelledby="compare-heading"
              className="reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20"
            >
              <h2
                id="compare-heading"
                className="text-3xl text-brand-dark sm:text-4xl"
              >
                Compare our stays
              </h2>
              <div
                className="mt-6 overflow-x-auto rounded-card border border-rule bg-paper shadow-soft"
                tabIndex={0}
                role="region"
                aria-label="Compare our stays"
              >
                <table className="w-full min-w-120 text-left text-sm">
                  <caption className="sr-only">Compare our stays</caption>
                  <thead className="bg-mango-light text-brand-dark">
                    <tr>
                      <th scope="col" className="p-4 font-semibold">
                        Detail
                      </th>
                      {units.map((unit) => (
                        <th
                          key={unit.id}
                          scope="col"
                          className="p-4 font-heading text-lg"
                        >
                          {unit.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule tabular-nums">
                    <tr>
                      <th
                        scope="row"
                        className="p-4 font-medium text-ink-muted"
                      >
                        Nightly rate
                      </th>
                      {units.map((unit) => (
                        <td key={unit.id} className="p-4">
                          {formatCurrency(unit.price_per_night)}
                          {guestTierSummary(unit) && (
                            <span className="block text-sm text-ink-muted">
                              {guestTierSummary(unit)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="p-4 font-medium text-ink-muted"
                      >
                        Capacity
                      </th>
                      {units.map((unit) => (
                        <td key={unit.id} className="p-4">
                          Up to {unit.capacity} guests
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="p-4 font-medium text-ink-muted"
                      >
                        Down payment
                      </th>
                      {units.map((unit) => (
                        <td key={unit.id} className="p-4">
                          {formatCurrency(depositAmount)} (non-refundable)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="p-4 font-medium text-ink-muted"
                      >
                        Check-in / check-out
                      </th>
                      {units.map((unit) => (
                        <td key={unit.id} className="p-4">
                          {CHECK_IN_TIME} / {CHECK_OUT_TIME}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="border-y border-mango bg-mango-light">
          <section
            aria-labelledby="pool-heading"
            className="reveal mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-12 md:items-center md:gap-12 lg:px-8 lg:py-20"
          >
            <StayImage
              src={poolPhoto}
              alt="The pool beside the residential building, with the clubhouse and loungers"
              ratio="tall"
              className="rounded-image md:order-2 md:col-span-5"
            />
            <div className="md:order-1 md:col-span-7">
              <h2
                id="pool-heading"
                className="text-3xl text-brand-dark sm:text-4xl"
              >
                Pool access
              </h2>
              <p className="mt-3 max-w-md text-ink-muted">
                Every stay includes use of the building pool.
              </p>
              <dl className="mt-8 border-t-2 border-mango pt-5">
                <dt className="text-sm font-medium text-ink-muted">
                  Pool hours
                </dt>
                <dd className="mt-1 font-heading text-3xl tabular-nums text-brand-dark sm:text-4xl">
                  6:00 AM – 10:00 PM
                </dd>
              </dl>
              <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {[
                  { term: "Pool pass", text: "Good for one day only." },
                  {
                    term: "Swimwear",
                    text: "Bring non-cotton clothes for swimming.",
                  },
                  { term: "Food", text: "No eating at the pool area." },
                  {
                    term: "Children",
                    text: "Floaties are available for children under 4 ft.",
                  },
                ].map((rule) => (
                  <div key={rule.term} className="border-t border-mango py-4">
                    <dt className="font-medium text-brand-dark">{rule.term}</dt>
                    <dd className="mt-1 text-ink-muted">{rule.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>

        <div className="border-t border-mango bg-paper">
          <section
            aria-labelledby="faq-heading"
            className="reveal mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-12 md:gap-12 lg:px-8 lg:py-20"
          >
            <div className="md:col-span-4 md:self-start">
              <h2
                id="faq-heading"
                className="text-3xl text-brand-dark sm:text-4xl"
              >
                Essential guest information
              </h2>
              <p className="mt-3 max-w-xs text-ink-muted">
                The fixed costs and times, so there are no surprises when you
                book.
              </p>
            </div>
            <div className="space-y-6 md:col-span-8">
              <dl className="grid divide-y divide-rule rounded-card border border-rule bg-surface shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  {
                    term: "Down payment",
                    value: formatCurrency(depositAmount),
                    note: "Non-refundable",
                  },
                  {
                    term: "Check-in",
                    value: CHECK_IN_TIME,
                    note: "From this time",
                  },
                  {
                    term: "Check-out",
                    value: CHECK_OUT_TIME,
                    note: "By this time",
                  },
                ].map((fact) => (
                  <div key={fact.term} className="p-5 sm:p-6">
                    <dt className="text-sm font-medium text-ink-muted">
                      {fact.term}
                    </dt>
                    <dd className="mt-1 font-heading text-2xl tabular-nums text-brand-dark sm:text-3xl">
                      {fact.value}
                    </dd>
                    <dd className="mt-1 text-sm text-ink-muted">{fact.note}</dd>
                  </div>
                ))}
              </dl>
              <div className="divide-y divide-rule rounded-card border border-rule bg-surface shadow-soft">
                {[
                  {
                    q: "How does the down payment work?",
                    a: `A fixed ${formatCurrency(depositAmount)} non-refundable down payment. Your dates are held after we verify it and confirm your reservation.`,
                  },
                  {
                    q: "What other deposits are there?",
                    a: `A ${formatCurrency(SECURITY_DEPOSIT)} security deposit and a ${formatCurrency(CLEANING_DEPOSIT)} cleaning deposit are collected at check-in. They are shown here for information only.`,
                  },
                ].map((item) => (
                  <details key={item.q} className="group p-5">
                    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-medium text-brand-dark">
                      {item.q}
                      <Plus
                        className="size-4 shrink-0 transition-transform duration-ui ease-ui group-open:rotate-45 motion-reduce:transform-none"
                        strokeWidth={1.5}
                      />
                    </summary>
                    <p className="mt-2 text-ink-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
