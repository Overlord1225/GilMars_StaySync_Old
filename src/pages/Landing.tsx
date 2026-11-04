import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BookingRule, Unit } from "../lib/types";
import { addDays, earliestCheckIn } from "../lib/dates";
import { formatCurrency } from "../lib/format";
import { getActiveUnits, getBookingRules } from "../lib/db";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StayImage } from "../components/public/StayImage";
import { Head } from "../components/ui/Head";
import { BrandMark } from "../components/ui/BrandMark";

export default function Landing() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [rules, setRules] = useState<BookingRule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

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
  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests: String(guests),
    });
    navigate(`/units?${query.toString()}`);
  };

  const heroPhoto = units[0]?.image_urls?.[0];

  return (
    <>
      <Head
        title="Home"
        description="A welcoming stay in the Philippines — find a comfortable place for your next visit at GilMars StaySync."
      />
      <div className="bg-paper">
        <section className="mx-auto grid min-w-0 max-w-7xl gap-10 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-16">
          <div className="min-w-0 space-y-6">
            <h1 className="max-w-xl text-5xl leading-[1.05] text-brand-dark sm:text-6xl">
              A little more room to feel at home.
            </h1>
            <p className="max-w-md text-lg text-ink-muted">
              Five GilMars stays, booked directly with the team. Pick your
              dates, send a request, and we’ll confirm with you.
            </p>
            <Button type="button" onClick={() => navigate("/units")}>
              Browse stays
            </Button>
          </div>
          <div
            className={`mx-auto aspect-3/4 w-full max-w-xs min-w-0 overflow-hidden rounded-t-full bg-sky lg:ml-auto ${heroPhoto ? "" : "hidden items-center justify-center lg:flex"}`}
          >
            {heroPhoto ? (
              <StayImage
                src={heroPhoto}
                alt={`${units[0]?.name}, one of the GilMars stays`}
                priority
                className="size-full"
              />
            ) : (
              <BrandMark className="h-1/3 w-auto opacity-30" />
            )}
          </div>
        </section>

        <section
          aria-labelledby="quick-search-title"
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
        >
          <form
            onSubmit={handleQuickSearch}
            className="relative grid gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2 sm:p-7 lg:-mt-6 lg:grid-cols-[1fr_1fr_0.7fr_auto] lg:items-end"
          >
            <div className="sm:col-span-2 lg:col-span-4">
              <h2 id="quick-search-title" className="text-2xl text-brand-dark">
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
              onChange={(event) => setCheckIn(event.target.value)}
            />
            <Input
              id="home-check-out"
              label="Check-out"
              required
              type="date"
              min={checkIn ? addDays(checkIn, 1) : minimumDate}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
            <Select
              id="home-guests"
              label="Guests"
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              disabled={!checkIn || !checkOut || checkOut <= checkIn}
              className="w-full lg:w-auto"
            >
              Search
            </Button>
          </form>
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
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-3">
                  <Skeleton
                    className="aspect-4/3 w-full rounded-card"
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
              description="Please check again soon, or browse all unit details when they reopen."
              action={
                <Link
                  to="/availability"
                  className="inline-flex min-h-11 items-center font-medium text-brand underline"
                >
                  Check dates
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <li key={unit.id}>
                  <Link to={`/units/${unit.id}`} className="group block h-full">
                    <div className="aspect-4/3 overflow-hidden rounded-card bg-brand-light">
                      <StayImage
                        src={unit.image_urls[0]}
                        alt={unit.name}
                        className="size-full"
                      />
                    </div>
                    <div className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-brand-dark group-hover:underline">
                            {unit.name}
                          </h3>
                          <p className="mt-1 text-sm text-ink-muted">
                            Up to {unit.capacity} guests
                          </p>
                        </div>
                        <p className="shrink-0 border-b-2 border-mango font-heading text-xl tabular-nums text-brand-dark">
                          {formatCurrency(unit.price_per_night)}
                          <span className="font-sans text-sm text-ink-muted">
                            {" "}
                            / night
                          </span>
                        </p>
                      </div>
                      {unit.amenities.length > 0 && (
                        <p className="mt-3 text-sm text-ink-muted">
                          {unit.amenities.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="steps-heading"
          className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <h2
              id="steps-heading"
              className="text-3xl text-brand-dark sm:text-4xl"
            >
              A simple way to book
            </h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3">
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
                  title: "Verify your deposit",
                  text: `${formatCurrency(rules?.deposit_amount ?? 1500)} deposit by GCash or bank transfer. Dates are held after verification and admin confirmation.`,
                },
              ].map((step, index) => (
                <li
                  key={step.title}
                  className="border-t border-rule-strong pt-5"
                >
                  <span
                    aria-hidden="true"
                    className="font-heading text-3xl tabular-nums text-brand"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-2xl text-brand-dark">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-ink-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
