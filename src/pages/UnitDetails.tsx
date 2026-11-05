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
import { hasGuestTiers, nightlyRate } from "../lib/pricing";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { DateRangePicker } from "../components/public/DateRangePicker";
import { StayImage } from "../components/public/StayImage";
import type { BookingRule, Unit } from "../lib/types";
import { useAuth } from "@/features/auth/useAuth";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "@/lib/policies";

export default function UnitDetails() {
  const { user } = useAuth();
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const touchStartX = useRef<number | null>(null);
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
  const priceEstimate =
    unit && nights > 0 ? nights * nightlyRate(unit, guests) : 0;

  function updateDates(start: string, end: string) {
    setCheckIn(start);
    setCheckOut(end);
    setAvailable(null);
    setCheckError(null);
  }

  async function handleCheckAvailability() {
    if (!id || !unit || !checkIn || !checkOut) return;
    if (guests > unit.capacity) {
      setCheckError(
        `This stay fits up to ${unit.capacity} ${unit.capacity === 1 ? "guest" : "guests"}.`,
      );
      return;
    }
    setChecking(true);
    setCheckError(null);
    setAvailable(null);
    try {
      setAvailable(await queryAvailability(id, checkIn, checkOut));
    } catch {
      setCheckError("We couldn’t check those dates. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  const moveGallery = (direction: number) => {
    if (!images.length) return;
    setGalleryIndex(
      (index) => (index + direction + images.length) % images.length,
    );
  };
  const retryLoad = () => {
    setError(null);
    setRetry((value) => value + 1);
  };
  const handleTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return;
    const distance = endX - touchStartX.current;
    if (Math.abs(distance) > 45) moveGallery(distance < 0 ? 1 : -1);
    touchStartX.current = null;
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
        <PageHeader
          title={unit.name}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Stays", href: "/units" },
            { label: unit.name },
          ]}
        />
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:gap-9">
          <div className="space-y-6">
            <section
              aria-label={`${unit.name} photo gallery`}
              className="space-y-3"
            >
              <div
                className="group relative aspect-4/3 overflow-hidden rounded-card bg-brand-light"
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) =>
                  handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)
                }
              >
                <button
                  type="button"
                  className="size-full cursor-zoom-in text-left"
                  onClick={() => image && setLightboxOpen(true)}
                  aria-label={
                    image
                      ? `Open photo ${galleryIndex + 1} of ${images.length} in full screen`
                      : "No photo available"
                  }
                  disabled={!image}
                >
                  {image ? (
                    <StayImage
                      src={image}
                      alt={`${unit.name}, photo ${galleryIndex + 1} of ${images.length}`}
                      priority={galleryIndex === 0}
                      className="size-full"
                    />
                  ) : (
                    <StayImage alt={unit.name} className="size-full" />
                  )}
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() => moveGallery(-1)}
                      className="absolute left-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-brand shadow-soft hover:bg-surface"
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
                      className="absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-brand shadow-soft hover:bg-surface"
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
                      className="absolute bottom-3 right-3 rounded-full bg-brand-dark/85 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Photo {galleryIndex + 1} of {images.length}
                    </span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div
                  aria-label="Choose a photo"
                  className="flex gap-2 overflow-x-auto pb-1"
                >
                  {images.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      aria-label={`Show photo ${index + 1}`}
                      aria-current={index === galleryIndex ? "true" : undefined}
                      onClick={() => setGalleryIndex(index)}
                      className={`size-20 shrink-0 overflow-hidden rounded-control border-2 ${galleryIndex === index ? "border-brand" : "border-transparent opacity-75 hover:opacity-100"}`}
                    >
                      <StayImage src={photo} alt="" className="size-full" />
                    </button>
                  ))}
                </div>
              )}
            </section>
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
                  {hasGuestTiers(unit) && (
                    <dd className="mt-1 text-sm text-ink-muted">
                      1–2 guests {formatCurrency(unit.price_per_night)}
                      {unit.price_3_guests != null &&
                        ` · 3 guests ${formatCurrency(unit.price_3_guests)}`}
                      {unit.price_4_guests != null &&
                        ` · 4 guests ${formatCurrency(unit.price_4_guests)}`}
                      {unit.extra_guest_fee != null &&
                        ` · +${formatCurrency(unit.extra_guest_fee)} per extra guest`}
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
                <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {unit.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-3 text-sm text-ink"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5 shrink-0 text-brand"
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
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  Amenities will be listed here soon.
                </p>
              )}
            </section>
          </div>

          <Card
            id="booking-panel"
            className="space-y-5 p-5 lg:sticky lg:top-24 lg:p-6"
          >
            <h2 className="font-heading text-3xl text-brand-dark">
              Check your dates
            </h2>
            <div className="space-y-3">
              <label
                htmlFor="guest-count"
                className="block text-sm font-medium text-ink"
              >
                Number of guests
              </label>
              <input
                id="guest-count"
                type="number"
                min="1"
                max={unit.capacity}
                value={guests}
                onChange={(event) => {
                  setGuests(Math.max(1, Number(event.target.value) || 1));
                  setAvailable(null);
                }}
                className="min-h-11 w-full rounded-control border border-rule-strong bg-surface px-3.5 text-ink"
              />
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={minDate}
                minAdvanceDays={minAdvance}
                blockedRanges={blocked}
                onChange={updateDates}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !unit.is_active ||
                !checkIn ||
                !checkOut ||
                checking ||
                nights < 1 ||
                blockedError ||
                blockedLoading
              }
              loading={checking}
              onClick={handleCheckAvailability}
            >
              Check availability
            </Button>
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
            {checkError && (
              <p
                role="alert"
                className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
              >
                {checkError}
              </p>
            )}
            {available !== null && (
              <div
                aria-live="polite"
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
                      {nights} {nights === 1 ? "night" : "nights"}:{" "}
                      {formatStayDate(checkIn)} to{" "}
                      {formatStayDate(checkOut)}{" "}
                    </p>
                    <p>
                      Estimated stay:{" "}
                      <strong>{formatCurrency(priceEstimate)}</strong>
                    </p>
                    <p>
                      Down payment:{" "}
                      <strong>
                        {formatCurrency(rules?.deposit_amount ?? 1000)}
                      </strong>
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-5 text-ink">
                    Please choose another date range or explore another stay.
                    You can review booked nights in the calendar above.
                  </p>
                )}
              </div>
            )}
            {available && !isStaff && (
              <Link
                to={`/reservations/request/${unit.id}?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}&guests=${guests}`}
                className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-control bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Request this stay
              </Link>
            )}
            <ul className="space-y-1 text-sm text-ink-muted">
              <li>
                Book at least {minAdvance} {minAdvance === 1 ? "day" : "days"}{" "}
                ahead. Check-out isn’t counted as a night.
              </li>
              <li>
                A non-refundable down payment holds your dates once verified and
                confirmed.
              </li>
              <li>
                Check-in {CHECK_IN_TIME} · Check-out {CHECK_OUT_TIME}. See the{" "}
                <Link className="text-brand underline" to="/house-rules">
                  house rules
                </Link>
                .
              </li>
            </ul>
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
