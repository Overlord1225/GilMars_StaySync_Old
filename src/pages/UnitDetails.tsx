import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  getBlockedDateRanges,
  getBookingRules,
  getUnitById,
  checkAvailability as queryAvailability,
} from "../lib/db";
import { addDays, todayManila, nightsBetween } from "../lib/dates";
import { formatCurrency, formatStayDate } from "../lib/format";
import { guestTierSummary, hasGuestTiers, nightlyRate } from "../lib/pricing";
import { Button } from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { DateRangePicker } from "../components/public/DateRangePicker";
import { StayImage } from "../components/public/StayImage";
import type { BookingRule, Unit } from "../lib/types";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/components/ui/useToast";
import {
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  CLEANING_DEPOSIT,
  SECURITY_DEPOSIT,
} from "@/lib/policies";

const AMENITY_PREVIEW = 8;

export default function UnitDetails() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === "admin" || user?.role === "super_admin";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [blocked, setBlocked] = useState<
    { check_in: string; check_out: string }[]
  >([]);
  const [rules, setRules] = useState<BookingRule | null>(null);
  const [loadedRequest, setLoadedRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") ?? "");
  const [guests, setGuests] = useState(
    Math.max(1, Number(searchParams.get("guests")) || 1),
  );
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const checkRun = useRef(0);
  const requestKey = `${id ?? ""}:${retry}`;
  const loading = Boolean(id) && loadedRequest !== requestKey;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const key = `${id}:${retry}`;
    Promise.all([getUnitById(id), getBookingRules()])
      .then(([unitRow, bookingRules]) => {
        if (!mounted) return;
        setUnit(unitRow);
        setRules(bookingRules);
        setError(null);
        // Dates from the landing search arrive in the URL: check them now.
        if (unitRow) {
          const startGuests = Math.min(guests, unitRow.capacity);
          setGuests(startGuests);
          void runCheck(checkIn, checkOut, startGuests, unitRow);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setUnit(null);
        setError("We couldn’t load this stay. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoadedRequest(key);
      });
    return () => {
      mounted = false;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- URL dates are checked once, when the unit loads
  }, [id, retry]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reset gallery when the unit changes
    setGalleryIndex(0);
    setLightboxOpen(false);
  }, [id]);

  const [blockedRetry, setBlockedRetry] = useState(0);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    // oxlint-disable-next-line react/set-state-in-effect -- flag loading before the fetch
    setBlockedError(false);
    setBlockedLoading(true);
    getBlockedDateRanges(id)
      .then((blockedDates) => {
        if (!mounted) return;
        setBlocked(blockedDates);
        setBlockedError(false);
      })
      .catch(() => {
        if (mounted) {
          setBlocked([]);
          setBlockedError(true);
        }
      })
      .finally(() => {
        if (mounted) setBlockedLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, blockedRetry]);

  const minAdvance = Math.max(1, rules?.min_advance_days ?? 1);
  const minDate = addDays(todayManila(), minAdvance);
  const images = useMemo(() => unit?.image_urls.filter(Boolean) ?? [], [unit]);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const deposit = rules?.deposit_amount ?? 1000;
  const priceEstimate =
    unit && nights > 0 ? nights * nightlyRate(unit, guests) : 0;

  const canShare =
    typeof navigator !== "undefined" &&
    Boolean(navigator.share || navigator.clipboard);
  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: unit?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied.", "success");
      }
    } catch (err) {
      // A dismissed share sheet is not an error.
      if (!(err instanceof DOMException && err.name === "AbortError"))
        showToast("We couldn’t share this link.", "error");
    }
  }

  // Runs as soon as both dates are chosen (or the guest count changes), so
  // there is no separate "Check availability" step. Stale replies are dropped.
  async function runCheck(
    start: string,
    end: string,
    guestCount: number,
    target: Unit | null = unit,
  ) {
    const run = ++checkRun.current;
    setAvailable(null);
    setCheckError(null);
    if (!id || !target || !start || !end || nightsBetween(start, end) < 1) {
      setChecking(false);
      return;
    }
    if (guestCount > target.capacity) {
      setChecking(false);
      setCheckError(
        `This stay fits up to ${target.capacity} ${target.capacity === 1 ? "guest" : "guests"}.`,
      );
      return;
    }
    setChecking(true);
    try {
      const result = await queryAvailability(id, start, end);
      if (run === checkRun.current) setAvailable(result);
    } catch {
      if (run === checkRun.current)
        setCheckError("We couldn’t check those dates. Please try again.");
    } finally {
      if (run === checkRun.current) setChecking(false);
    }
  }

  function updateDates(start: string, end: string) {
    setCheckIn(start);
    setCheckOut(end);
    void runCheck(start, end, guests);
  }

  function updateGuests(next: number) {
    const value = Math.min(unit?.capacity ?? next, Math.max(1, next));
    setGuests(value);
    void runCheck(checkIn, checkOut, value);
  }

  const scrollToPhoto = (index: number) => {
    const track = trackRef.current;
    setGalleryIndex(index);
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };
  const moveGallery = (direction: number) => {
    if (!images.length) return;
    scrollToPhoto((galleryIndex + direction + images.length) % images.length);
  };
  const retryLoad = () => {
    setError(null);
    setRetry((value) => value + 1);
  };

  if (loading)
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <Skeleton className="aspect-4/3 w-full rounded-card" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-64 w-full rounded-card" />
          </div>
        </div>
      </div>
    );

  if (!id || error || !unit)
    return (
      <div className="px-4 py-16">
        <EmptyState
          headingLevel={1}
          title={error ? "This stay didn’t load" : "Stay not found"}
          description={
            error ?? "The stay you’re looking for may no longer be available."
          }
          action={
            error ? (
              <Button variant="outline" onClick={retryLoad}>
                Try again
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/units")}>
                Browse stays
              </Button>
            )
          }
        />
      </div>
    );

  const image = images[galleryIndex];
  return (
    <div className="min-h-[70vh] bg-paper px-4 py-7 pb-24 sm:px-6 sm:py-10 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title={unit.name}
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Stays", href: "/units" },
              { label: unit.name },
            ]}
          />
          {canShare && (
            <Button variant="outline" onClick={handleShare}>
              Share
            </Button>
          )}
        </div>
        <section
          aria-label={`${unit.name} photo gallery`}
          className="relative overflow-hidden rounded-card bg-brand-light"
        >
          <div
            key={unit.id}
            ref={trackRef}
            role="region"
            tabIndex={0}
            aria-label="Photos. Scroll or use arrow keys to see more."
            onScroll={(event) => {
              const track = event.currentTarget;
              const index = Math.round(track.scrollLeft / track.clientWidth);
              if (index !== galleryIndex) setGalleryIndex(index);
            }}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
          >
            {images.length ? (
              images.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  className="aspect-4/3 w-full shrink-0 snap-center cursor-zoom-in sm:aspect-16/9 lg:aspect-21/9"
                  aria-label={`Open photo ${index + 1} of ${images.length} in full screen`}
                  onClick={() => setLightboxOpen(true)}
                >
                  <StayImage
                    src={photo}
                    alt={`${unit.name}, photo ${index + 1} of ${images.length}`}
                    priority={index === 0}
                    className="size-full"
                  />
                </button>
              ))
            ) : (
              <div className="aspect-4/3 w-full shrink-0 sm:aspect-16/9 lg:aspect-21/9">
                <StayImage alt={unit.name} className="size-full" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => moveGallery(-1)}
                className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-brand shadow-raised transition-[background-color,transform] duration-ui ease-ui hover:scale-105 hover:bg-surface active:scale-95 motion-reduce:transform-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => moveGallery(1)}
                className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-brand shadow-raised transition-[background-color,transform] duration-ui ease-ui hover:scale-105 hover:bg-surface active:scale-95 motion-reduce:transform-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <span
                aria-live="polite"
                className="absolute bottom-3 right-3 rounded-full bg-brand-dark/85 px-3 py-1.5 text-xs font-medium text-on-fill"
              >
                {galleryIndex + 1} / {images.length}
              </span>
            </>
          )}
        </section>
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:gap-9">
          <div className="space-y-6">
            <section className="border-t border-rule-strong pt-6">
              <h2 className="font-heading text-3xl text-brand-dark">
                About this stay
              </h2>
              {unit.description && (
                <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">
                  {unit.description}
                </p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-ink-muted">Capacity</dt>
                  <dd className="font-semibold text-brand-dark">
                    {unit.capacity} {unit.capacity === 1 ? "guest" : "guests"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-ink-muted">Price per night</dt>
                  <dd className="font-semibold text-brand-dark">
                    {hasGuestTiers(unit) ? "From " : ""}
                    {formatCurrency(unit.price_per_night)}
                  </dd>
                  {guestTierSummary(unit) && (
                    <dd className="mt-1 text-sm text-ink-muted">
                      {guestTierSummary(unit)}
                    </dd>
                  )}
                </div>
              </dl>
            </section>
            <section className="border-t border-rule-strong pt-6">
              <h2 className="font-heading text-3xl text-brand-dark">
                What this stay offers
              </h2>
              {unit.amenities.length ? (
                <>
                  <ul className="mt-4 grid gap-x-8 gap-y-2.5 text-ink sm:grid-cols-2">
                    {(showAllAmenities
                      ? unit.amenities
                      : unit.amenities.slice(0, AMENITY_PREVIEW)
                    ).map((amenity) => (
                      <li key={amenity} className="flex items-start gap-2.5">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="mt-0.5 size-5 shrink-0 text-brand"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                  {unit.amenities.length > AMENITY_PREVIEW && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      aria-expanded={showAllAmenities}
                      onClick={() => setShowAllAmenities((open) => !open)}
                    >
                      {showAllAmenities
                        ? "Show fewer"
                        : `Show all ${unit.amenities.length} amenities`}
                    </Button>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  Amenities will be listed here soon.
                </p>
              )}
            </section>
            <section className="border-t border-rule-strong pt-6">
              <h2 className="font-heading text-3xl text-brand-dark">
                House policy
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-ink-muted">Check-in</dt>
                  <dd className="font-semibold text-brand-dark">
                    {CHECK_IN_TIME}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-ink-muted">Check-out</dt>
                  <dd className="font-semibold text-brand-dark">
                    {CHECK_OUT_TIME}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-ink-muted">
                See the{" "}
                <Link className="text-brand underline" to="/house-rules">
                  house rules
                </Link>{" "}
                for everything else.
              </p>
            </section>
          </div>

          <Card
            id="booking-panel"
            className="space-y-5 p-5 lg:sticky lg:top-24 lg:p-6"
          >
            <p className="font-heading text-3xl tabular-nums text-brand-dark">
              {hasGuestTiers(unit) ? "From " : ""}
              {formatCurrency(unit.price_per_night)}
              <span className="font-sans text-sm text-ink-muted"> / night</span>
            </p>
            <h2 className="font-heading text-2xl text-brand-dark">
              Check your dates
            </h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  id="guest-count-label"
                  className="text-sm font-medium text-ink"
                >
                  Guests
                </p>
                <p className="text-sm text-ink-muted">Up to {unit.capacity}</p>
              </div>
              <div
                role="group"
                aria-labelledby="guest-count-label"
                className="flex items-center gap-3"
              >
                <Button
                  variant="outline"
                  className="size-11 !px-0"
                  aria-label="Fewer guests"
                  disabled={guests <= 1}
                  onClick={() => updateGuests(guests - 1)}
                >
                  −
                </Button>
                <output
                  aria-live="polite"
                  className="w-6 text-center text-lg font-semibold tabular-nums text-brand-dark"
                >
                  {guests}
                </output>
                <Button
                  variant="outline"
                  className="size-11 !px-0"
                  aria-label="More guests"
                  disabled={guests >= unit.capacity}
                  onClick={() => updateGuests(guests + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div aria-busy={blockedLoading}>
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={minDate}
                minAdvanceDays={minAdvance}
                blockedRanges={blocked}
                onChange={updateDates}
              />
            </div>
            <dl className="grid grid-cols-2 divide-x divide-rule overflow-hidden rounded-control border border-rule-strong text-sm">
              <div className="p-3">
                <dt className="text-ink-muted">Check-in</dt>
                <dd className="font-semibold text-brand-dark">
                  {checkIn ? formatStayDate(checkIn) : "Select a date"}
                </dd>
              </div>
              <div className="p-3">
                <dt className="text-ink-muted">Check-out</dt>
                <dd className="font-semibold text-brand-dark">
                  {checkOut ? formatStayDate(checkOut) : "Select a date"}
                </dd>
              </div>
            </dl>
            {blockedError && (
              <p
                role="alert"
                className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
              >
                We couldn’t load blocked dates for this stay.{" "}
                <button
                  type="button"
                  className="font-medium text-brand underline"
                  onClick={() => setBlockedRetry((v) => v + 1)}
                >
                  Retry
                </button>
              </p>
            )}
            <div aria-live="polite" className="space-y-3">
              {checking && (
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
                  />
                  Checking those dates…
                </p>
              )}
              {checkError && (
                <p
                  role="alert"
                  className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
                >
                  {checkError}{" "}
                  {checkOut && (
                    <button
                      type="button"
                      className="font-medium text-brand underline"
                      onClick={() => void runCheck(checkIn, checkOut, guests)}
                    >
                      Try again
                    </button>
                  )}
                </p>
              )}
              {available !== null && (
                <div
                  className={`rounded-card border p-4 ${available ? "border-success-200 bg-success-50" : "border-warning-200 bg-warning-50"}`}
                >
                  <p
                    className={`font-semibold ${available ? "text-success-700" : "text-warning-800"}`}
                  >
                    {available
                      ? "These dates are available"
                      : "These dates aren’t available"}
                  </p>
                  {available ? (
                    <div className="mt-2 space-y-1 text-sm text-ink">
                      <p>
                        {nights} {nights === 1 ? "night" : "nights"} ×{" "}
                        {formatCurrency(nightlyRate(unit, guests))} ={" "}
                        <strong>{formatCurrency(priceEstimate)}</strong>
                      </p>
                      <p>
                        Down payment due now:{" "}
                        <strong>{formatCurrency(deposit)}</strong>
                      </p>
                      <p>
                        Remainder due at check-in:{" "}
                        <strong>
                          {formatCurrency(Math.max(0, priceEstimate - deposit))}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-5 text-ink">
                      Please choose another date range or explore another stay.
                    </p>
                  )}
                </div>
              )}
            </div>
            {available && !isStaff && (
              <Link
                to={`/reservations/request/${unit.id}?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}&guests=${guests}`}
                className={buttonClass("primary", "w-full")}
              >
                Request this stay
              </Link>
            )}
            <p className="text-sm text-ink-muted">
              {formatCurrency(deposit)} non-refundable down payment is needed to
              confirm your stay. A {formatCurrency(SECURITY_DEPOSIT)} security
              deposit and {formatCurrency(CLEANING_DEPOSIT)} cleaning deposit
              are collected at check-in (information only). See the{" "}
              <Link className="text-brand underline" to="/house-rules">
                house rules
              </Link>
              .
            </p>
            {!unit.is_active && (
              <p className="text-sm text-warning-800">
                This stay isn’t accepting requests right now.
              </p>
            )}
          </Card>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-sticky border-t border-rule bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-raised lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <p className="min-w-0 whitespace-nowrap font-heading text-xl tabular-nums text-brand-dark">
              {formatCurrency(unit.price_per_night)}
              <span className="font-sans text-sm text-ink-muted"> / night</span>
            </p>
            <Button
              type="button"
              onClick={() =>
                document
                  .getElementById("booking-panel")
                  ?.scrollIntoView({ behavior: "auto", block: "start" })
              }
            >
              Check dates
            </Button>
          </div>
        </div>
        <Modal
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={`${unit.name} photo ${galleryIndex + 1} of ${images.length}`}
        >
          <div className="space-y-3">
            {image && (
              <StayImage
                src={image}
                alt={`${unit.name}, photo ${galleryIndex + 1}`}
                fit="contain"
                className="aspect-4/3 max-h-[65vh] w-full rounded-control"
              />
            )}
            {images.length > 1 && (
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => moveGallery(-1)}>
                  Previous photo
                </Button>
                <Button variant="outline" onClick={() => moveGallery(1)}>
                  Next photo
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
