import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BookingRule, Unit } from "../lib/types";
import { addDays, todayManila } from "../lib/dates";
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
  const minimumDate = addDays(todayManila(), minimumAdvanceDays);
  const amenities = [...new Set(units.flatMap((unit) => unit.amenities))].slice(
    0,
    4,
  );
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
      <div className="bg-mist">
        <section className="bg-linear-to-b from-sky to-mist">
          <div className="mx-auto grid min-w-0 max-w-7xl gap-12 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-32 lg:pt-16">
            <div className="min-w-0 space-y-7">
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] text-brand-dark sm:text-6xl lg:text-7xl">
                A little more room to feel at home.
              </h1>
              <p className="max-w-lg text-lg leading-7 text-text-muted">
                Find a comfortable place for your next visit. Explore our five
                stays, choose your dates, and send a reservation request in a
                few simple steps.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="button" onClick={() => navigate("/units")}>
                  Explore the stays
                </Button>
                <Link
                  to="/availability"
                  className="inline-flex min-h-11 items-center rounded-control px-4 font-medium text-brand-dark hover:bg-surface/70"
                >
                  Check availability
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm min-w-0 lg:ml-auto lg:max-w-md">
              <div className="relative aspect-4/5 overflow-hidden rounded-t-full bg-linear-to-b from-sky via-brand-light to-brand shadow-raised">
                {heroPhoto ? (
                  <StayImage
                    src={heroPhoto}
                    alt={`${units[0]?.name}, one of the GilMars stays`}
                    priority
                    className="size-full"
                  />
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-[24%] size-28 -translate-x-1/2 rounded-full bg-mango"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[36%] bg-brand"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-[36%] h-[6%] bg-brand-hover/70"
                    />
                  </>
                )}
              </div>
              <span
                aria-hidden="true"
                className="absolute -bottom-5 -right-4 -z-10 h-28 w-20 rounded-t-full bg-mango-light"
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="quick-search-title"
          className="relative z-sticky mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8"
        >
          <form
            onSubmit={handleQuickSearch}
            className="grid gap-4 rounded-panel border border-border bg-surface p-5 shadow-raised sm:grid-cols-2 sm:p-7 lg:grid-cols-[1fr_1fr_0.7fr_auto] lg:items-end"
          >
            <div className="sm:col-span-2 lg:col-span-4">
              <h2
                id="quick-search-title"
                className="text-xl font-semibold text-brand-dark"
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
              Find a stay
            </Button>
            <p className="text-sm text-text-muted sm:col-span-2 lg:col-span-4">
              Advance booking only. Check-out date is not counted as a night.
            </p>
          </form>
        </section>

        <section
          aria-labelledby="units-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2
              id="units-heading"
              className="text-3xl font-semibold text-brand-dark sm:text-4xl"
            >
              Our stays
            </h2>
            <Link
              to="/units"
              className="hidden min-h-11 items-center font-medium text-brand hover:underline sm:inline-flex"
            >
              See all stays
            </Link>
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
                  className="font-medium text-brand underline"
                >
                  Check dates
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <li key={unit.id}>
                  <Link
                    to={`/units/${unit.id}`}
                    className="group block h-full overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-ui hover:shadow-raised"
                  >
                    <div className="aspect-4/3 overflow-hidden bg-brand-light">
                      <StayImage
                        src={unit.image_urls[0]}
                        alt={unit.name}
                        className="size-full transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-brand-dark">
                            {unit.name}
                          </h3>
                          <p className="mt-1 text-sm text-text-muted">
                            Up to {unit.capacity} guests
                          </p>
                        </div>
                        <p className="shrink-0 rounded-full bg-mango-light px-3 py-1 text-sm font-semibold text-brand-dark">
                          {formatCurrency(unit.price_per_night)}
                          <span className="font-normal text-text-muted">
                            {" "}
                            / night
                          </span>
                        </p>
                      </div>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {unit.amenities.slice(0, 2).map((amenity) => (
                          <li
                            key={amenity}
                            className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark"
                          >
                            {amenity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/units"
            className="mt-6 inline-flex min-h-11 items-center font-medium text-brand underline sm:hidden"
          >
            See all stays
          </Link>
        </section>

        <section
          aria-labelledby="steps-heading"
          className="bg-surface px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <h2
              id="steps-heading"
              className="text-3xl font-semibold text-brand-dark sm:text-4xl"
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
                <li key={step.title} className="flex gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-mango font-heading text-lg font-bold text-brand-dark">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-dark">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-sm leading-7 text-text-muted">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {amenities.length > 0 && (
          <section
            aria-labelledby="amenities-heading"
            className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24"
          >
            <div>
              <h2
                id="amenities-heading"
                className="text-3xl font-semibold text-brand-dark sm:text-4xl"
              >
                The details make it feel easy.
              </h2>
              <p className="mt-3 max-w-lg leading-7 text-text-muted">
                Every stay has its own character. Browse each unit to see its
                capacity, nightly rate, and included amenities before you
                request.
              </p>
            </div>
            <ul className="flex flex-wrap content-start gap-3">
              {amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="inline-flex min-h-11 items-center rounded-full bg-mango-light px-5 font-medium text-brand-dark"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-brand-dark px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Questions before you book?
              </h2>
              <p className="mt-1 text-white/90">
                Sign in to send our team an inquiry, or browse the stays to
                compare your options.
              </p>
            </div>
            <Link
              to="/units"
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-mango px-6 font-semibold text-brand-dark transition-colors hover:bg-mango-light focus-visible:ring-2 focus-visible:ring-white"
            >
              Browse the stays
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
