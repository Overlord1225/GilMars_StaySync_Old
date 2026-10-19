import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BookingRule, Unit } from "../lib/types";
import { addDays, todayManila } from "../lib/dates";
import { formatCurrency } from "../lib/format";
import { getActiveUnits, getBookingRules } from "../lib/db";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StayImage } from "../components/public/StayImage";

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
      .catch(() => { if (mounted) { setLoadError(true); setLoaded(true); } });
    return () => { mounted = false; };
  }, []);

  const minimumAdvanceDays = Math.max(1, rules?.min_advance_days ?? 1);
  const minimumDate = addDays(todayManila(), minimumAdvanceDays);
  const amenities = [...new Set(units.flatMap((unit) => unit.amenities))].slice(0, 4);
  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
    navigate(`/units?${query.toString()}`);
  };

  return <div className="bg-cream">
    <section className="mx-auto grid min-w-0 max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-20">
      <div className="order-2 min-w-0 space-y-6 lg:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">A welcoming stay in the Philippines</p>
        <div className="space-y-4">
          <p className="font-heading text-2xl text-brand-dark">GilMars</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-brand-dark sm:text-5xl lg:text-6xl">A little more room to feel at home.</h1>
          <p className="max-w-lg text-base leading-7 text-text-muted sm:text-lg">Find a comfortable place for your next visit. Explore our five stays, choose your dates, and send a reservation request in a few simple steps.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => navigate("/units")}>Explore the stays</Button>
          <Link to="/availability" className="inline-flex min-h-11 items-center rounded-control px-4 font-medium text-brand hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand">Check availability <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </div>
      <div className="order-1 relative min-w-0 lg:order-2">
        <div className="absolute -bottom-3 -left-3 h-24 w-24 rounded-t-full border-2 border-sand/70 sm:-bottom-5 sm:-left-5 sm:h-36 sm:w-36" aria-hidden="true" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-brand-light shadow-raised">
          {units[0]?.image_urls?.[0] ? <StayImage src={units[0].image_urls[0]} alt={`${units[0].name}, one of the GilMars stays`} priority className="size-full" /> : <div className="flex size-full flex-col items-center justify-center bg-sand-light px-8 text-center text-brand-dark"><span aria-hidden="true" className="mb-4 block h-32 w-24 rounded-t-full border-[6px] border-brand sm:h-48 sm:w-36" /><p className="font-heading text-2xl">Your stay begins here</p></div>}
          <div className="absolute inset-x-0 bottom-0 bg-brand-dark px-5 py-4 text-white sm:px-7 sm:py-5"><p className="font-heading text-xl sm:text-2xl">Stay a little, stay awhile.</p><p className="mt-1 text-sm text-white">Thoughtful spaces for time away.</p></div>
        </div>
      </div>
    </section>

    <section aria-labelledby="quick-search-title" className="relative z-10 mx-auto -mt-2 max-w-6xl px-4 sm:px-6 lg:px-8">
      <Card className="p-5 sm:p-6">
        <form onSubmit={handleQuickSearch} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_auto] lg:items-end">
          <div className="sm:col-span-2 lg:col-span-4"><h2 id="quick-search-title" className="text-lg font-semibold text-brand-dark">Start with your dates</h2><p className="mt-1 text-sm text-text-muted">We’ll help you find a stay that fits your plans.</p></div>
          <label className="space-y-1.5 text-sm font-medium text-text">Check-in <input required type="date" min={minimumDate} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal text-text focus-visible:ring-2 focus-visible:ring-brand" /></label>
          <label className="space-y-1.5 text-sm font-medium text-text">Check-out <input required type="date" min={checkIn ? addDays(checkIn, 1) : minimumDate} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal text-text focus-visible:ring-2 focus-visible:ring-brand" /></label>
          <label className="space-y-1.5 text-sm font-medium text-text">Guests <select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="min-h-11 w-full rounded-control border border-border bg-surface px-3.5 font-normal text-text focus-visible:ring-2 focus-visible:ring-brand"><option value={1}>1 guest</option><option value={2}>2 guests</option><option value={3}>3 guests</option><option value={4}>4 guests</option><option value={5}>5 guests</option><option value={6}>6 guests</option></select></label>
          <Button type="submit" disabled={!checkIn || !checkOut || checkOut <= checkIn} className="w-full lg:w-auto">Find a stay</Button>
        </form>
        <p className="mt-3 text-xs text-text-muted">Advance booking only. Check-out date is not counted as a night.</p>
      </Card>
    </section>

    <section aria-labelledby="units-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Find your space</p><h2 id="units-heading" className="mt-2 text-3xl font-semibold text-brand-dark">Our stays</h2></div><Link to="/units" className="hidden min-h-11 items-center font-medium text-brand hover:underline sm:inline-flex">See all stays <span aria-hidden="true" className="ml-1">→</span></Link></div>
      {loadError ? <Card className="p-5" role="alert"><p className="text-sm text-danger-700">We couldn’t load the stays right now. Please try browsing all units.</p><Link to="/units" className="mt-2 inline-flex min-h-11 items-center font-medium text-brand underline">Browse units</Link></Card> : !loaded ? <div className="grid gap-5 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="space-y-3"><Skeleton className="aspect-[4/3] w-full rounded-card" label="Loading stay photo" /><Skeleton className="h-6 w-2/3" label="Loading stay name" /><Skeleton className="h-4 w-full" label="Loading stay details" /></div>)}</div> : units.length === 0 ? <EmptyState title="No stays are available yet" description="Please check again soon, or browse all unit details when they reopen." action={<Link to="/availability" className="font-medium text-brand underline">Check dates</Link>} /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{units.map((unit) => <Link key={unit.id} to={`/units/${unit.id}`} className="group overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-ui hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none">
        <div className="aspect-[4/3] overflow-hidden bg-brand-light"><StayImage src={unit.image_urls[0]} alt={unit.name} className="size-full transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none" /></div>
        <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-heading text-xl font-semibold text-brand-dark">{unit.name}</h3><p className="mt-1 text-sm text-text-muted">Up to {unit.capacity} guests</p></div><p className="shrink-0 text-sm font-semibold text-brand">{formatCurrency(unit.price_per_night)}<span className="font-normal text-text-muted"> / night</span></p></div><div className="mt-4 flex flex-wrap gap-2">{unit.amenities.slice(0, 2).map((amenity) => <span key={amenity} className="rounded-full border border-border bg-cream px-2.5 py-1 text-xs text-text-muted">{amenity}</span>)}</div></div>
      </Link>)}</div>}
      <Link to="/units" className="mt-6 inline-flex min-h-11 items-center font-medium text-brand underline sm:hidden">See all stays <span aria-hidden="true" className="ml-1">→</span></Link>
    </section>

    <section aria-labelledby="steps-heading" className="border-y border-border bg-surface px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">From planning to arrival</p><h2 id="steps-heading" className="mt-2 text-3xl font-semibold text-brand-dark">A simple way to book</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">{[
          { title: "Choose your dates", text: `Select a stay and dates in advance. We need at least ${minimumAdvanceDays} ${minimumAdvanceDays === 1 ? "day" : "days"} notice.` },
          { title: "Send a request", text: "Share your guest details and review your stay before sending the request." },
          { title: "Verify your deposit", text: `${formatCurrency(1500)} deposit by GCash or bank transfer. Dates are held after verification and admin confirmation.` },
        ].map((step, index) => <li key={step.title} className="flex gap-4"><span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">0{index + 1}</span><div><h3 className="font-heading text-xl font-semibold text-brand-dark">{step.title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{step.text}</p></div></li>)}</ol>
      </div>
    </section>

    <section aria-labelledby="amenities-heading" className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Comforts for your stay</p><h2 id="amenities-heading" className="mt-2 text-3xl font-semibold text-brand-dark">The details make it feel easy.</h2><p className="mt-3 max-w-lg leading-7 text-text-muted">Every stay has its own character. Browse each unit to see its capacity, nightly rate, and included amenities before you request.</p></div>
      <div className="flex flex-wrap content-start gap-3">{amenities.length ? amenities.map((amenity) => <span key={amenity} className="inline-flex min-h-11 items-center rounded-full border border-sand/60 bg-sand-light px-4 text-sm font-medium text-brand-dark">{amenity}</span>) : <span className="text-sm text-text-muted">Explore each stay to see its amenities.</span>}</div>
    </section>
    <section className="bg-brand-dark px-4 py-10 text-white sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-heading text-2xl">Questions before you book?</h2><p className="mt-1 text-sm text-white">Sign in to send our team an inquiry, or browse the stays to compare your options.</p></div><Link to="/units" className="inline-flex min-h-11 items-center justify-center rounded-control bg-surface px-5 font-semibold text-brand-dark hover:bg-cream focus-visible:ring-2 focus-visible:ring-white">Browse the stays</Link></div></section>
  </div>;
}
