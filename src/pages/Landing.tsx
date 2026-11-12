import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BookingRule, Unit } from "../lib/types";
import { addDays, earliestCheckIn } from "../lib/dates";
import { formatCurrency } from "../lib/format";
import { getActiveUnits, getBookingRules } from "../lib/db";
import { guestTierSummary } from "../lib/pricing";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StayImage } from "../components/public/StayImage";
import { UnitCard } from "../components/public/UnitCard";
import { Head } from "../components/ui/Head";
import poolPhoto from "../assets/pool.jpg";
import {
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  CLEANING_DEPOSIT,
  SECURITY_DEPOSIT,
} from "@/lib/policies";

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
        setUnits(unitRows);
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
  // Second photo when there is one, so the hero does not repeat the first card.
  const heroImage = units[0]?.image_urls[1] ?? units[0]?.image_urls[0];
  const heroVisible = !loaded || Boolean(heroImage);
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
      />
      <div className="bg-paper">
        <p className="bg-mango-light px-4 py-2 text-center text-sm text-brand-dark">
          {formatCurrency(depositAmount)} non-refundable down payment is needed
          to confirm your stay.
        </p>
        <section
          className={`mx-auto grid min-w-0 max-w-7xl gap-10 px-4 pb-16 pt-8 sm:px-6 md:items-center lg:px-8 lg:pt-16 ${heroVisible ? "md:grid-cols-2" : ""}`}
        >
          <div className="min-w-0 space-y-6">
            <h1 className="max-w-xl text-4xl text-brand-dark sm:text-5xl lg:text-display">
              A little more room to feel at home.
            </h1>
            <p className="max-w-md text-lg text-ink-muted">
              GilMars stays, booked directly with the team. Pick your dates,
              send a request, and we’ll confirm with you.
            </p>
            <section aria-labelledby="quick-search-title">
              <form
                noValidate
                onSubmit={handleQuickSearch}
                className="grid gap-4 rounded-card border border-rule bg-surface p-5 sm:grid-cols-2 sm:items-end sm:p-6"
              >
                <div className="sm:col-span-2">
                  <h2
                    id="quick-search-title"
                    className="text-2xl text-brand-dark"
                  >
                    Start with your dates
                  </h2>
                </div>
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
                <Button type="submit" className="w-full">
                  Search
                </Button>
              </form>
            </section>
          </div>
          {heroVisible && (
            <div className="mx-auto w-full max-w-xl overflow-hidden rounded-card border border-mango/60 bg-brand-light md:ml-auto md:mr-0">
              {loaded ? (
                <StayImage
                  src={heroImage}
                  alt={units[0]?.name ?? "GilMars stay"}
                  priority
                  ratio="hero"
                />
              ) : (
                <Skeleton
                  className="aspect-hero w-full rounded-none"
                  label="Loading stay photo"
                />
              )}
              <div aria-hidden="true" className="weave-band" />
            </div>
          )}
        </section>

        <section
          aria-labelledby="units-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
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
            <ul className="grid gap-6 md:grid-cols-2">
              {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} to={`/units/${unit.id}`} />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="steps-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div>
            <h2
              id="steps-heading"
              className="text-3xl text-brand-dark sm:text-4xl"
            >
              A simple way to book
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
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
                  className="border-t border-brand-dark pt-4"
                >
                  <span
                    aria-hidden="true"
                    className="font-heading text-5xl tabular-nums text-brand"
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
            className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
          >
            <h2
              id="compare-heading"
              className="text-3xl text-brand-dark sm:text-4xl"
            >
              Compare our stays
            </h2>
            <div className="mt-6 overflow-x-auto rounded-card border border-rule bg-surface">
              <table className="w-full min-w-120 text-left text-sm">
                <thead className="bg-brand-light text-brand-dark">
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
                    <th scope="row" className="p-4 font-medium text-ink-muted">
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
                    <th scope="row" className="p-4 font-medium text-ink-muted">
                      Capacity
                    </th>
                    {units.map((unit) => (
                      <td key={unit.id} className="p-4">
                        Up to {unit.capacity} guests
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium text-ink-muted">
                      Down payment
                    </th>
                    {units.map((unit) => (
                      <td key={unit.id} className="p-4">
                        {formatCurrency(depositAmount)} (non-refundable)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium text-ink-muted">
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

        <section
          aria-labelledby="pool-heading"
          className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-8 lg:py-20"
        >
          <img
            src={poolPhoto}
            alt="The pool beside the residential building, with the clubhouse and loungers"
            width="768"
            height="1024"
            loading="lazy"
            className="aspect-hero h-auto w-full rounded-card border border-mango/60 object-cover object-center"
          />
          <div>
            <h2
              id="pool-heading"
              className="text-3xl text-brand-dark sm:text-4xl"
            >
              Pool access
            </h2>
            <p className="mt-3 max-w-md text-ink-muted">
              Every stay includes use of the building pool.
            </p>
            <ul className="mt-5 max-w-md list-disc space-y-1 pl-5 text-ink-muted">
              <li>Open from 6:00 AM to 10:00 PM.</li>
              <li>The pool pass is good for one day only.</li>
              <li>Bring non-cotton clothes for swimming.</li>
              <li>No eating at the pool area.</li>
              <li>Floaties are available for children under 4 ft.</li>
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="faq-heading"
          className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.4fr] md:gap-12 lg:px-8 lg:py-20"
        >
          <h2 id="faq-heading" className="text-3xl text-brand-dark sm:text-4xl">
            Essential guest information
          </h2>
          <div className="divide-y divide-rule rounded-card border border-rule bg-surface">
            {[
              {
                q: "What is the down payment?",
                a: `A fixed ${formatCurrency(depositAmount)} non-refundable down payment. Your dates are held after we verify it and confirm your reservation.`,
              },
              {
                q: "What time are check-in and check-out?",
                a: `Check-in is from ${CHECK_IN_TIME}. Check-out is by ${CHECK_OUT_TIME}.`,
              },
              {
                q: "What other deposits are there?",
                a: `A ${formatCurrency(SECURITY_DEPOSIT)} security deposit and a ${formatCurrency(CLEANING_DEPOSIT)} cleaning deposit are collected at check-in. They are shown here for information only.`,
              },
            ].map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-medium text-brand-dark">
                  {item.q}
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    className="size-4 shrink-0 transition-transform duration-ui ease-ui group-open:rotate-45 motion-reduce:transform-none"
                  >
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </summary>
                <p className="mt-2 text-ink-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="bg-band px-4 py-16 text-center text-on-band sm:px-6 lg:px-8"
        >
          <h2 id="cta-heading" className="text-3xl text-on-band sm:text-4xl">
            Ready to plan your stay?
          </h2>
          <Link
            to="/units"
            className="mt-6 inline-flex min-h-11 items-center rounded-control bg-mango px-6 text-sm font-semibold text-on-mango transition-[background-color,transform,box-shadow] duration-ui ease-ui hover:-translate-y-px hover:bg-mango/90 hover:shadow-lift active:scale-[0.97] motion-reduce:transform-none"
          >
            Browse stays
          </Link>
        </section>
      </div>
    </>
  );
}
