import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StayImage } from "@/components/public/StayImage";
import { formatCurrency } from "@/lib/format";
import { guestTierLines } from "@/lib/pricing";
import type { Unit } from "@/lib/types";

/**
 * The one unit card used on the landing page and the stays list: photo, weave
 * edge, name, price, guests, per-tier prices, amenities, then one call to
 * action. Page-specific rows (availability badge, description) go in children.
 */
export function UnitCard({
  unit,
  to,
  as: Tag = "li",
  headingLevel = 3,
  children,
}: {
  unit: Unit;
  to: string;
  as?: "li" | "article";
  headingLevel?: 2 | 3;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const tiers = guestTierLines(unit);
  return (
    <Tag>
      <Link
        to={to}
        className="card-link group flex h-full flex-col overflow-hidden rounded-card border bg-surface"
      >
        <div className="overflow-hidden bg-brand-light">
          <StayImage src={unit.image_urls[0]} alt="" ratio="card" />
        </div>
        <div aria-hidden="true" className="weave-band weave-band--thin" />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <Heading className="text-2xl text-brand-dark transition-colors duration-ui ease-ui group-hover:text-brand">
              {unit.name}
            </Heading>
            <p className="mt-2 inline-block border-b-2 border-mango font-heading text-xl tabular-nums text-brand-dark">
              {formatCurrency(unit.price_per_night)}
              <span className="font-sans text-sm text-ink-muted"> / night</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Up to {unit.capacity} {unit.capacity === 1 ? "guest" : "guests"}
            </p>
            {tiers.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                {tiers.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          {children}
          {unit.amenities.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {unit.amenities.slice(0, 3).map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-control bg-brand-light px-2 py-1 text-sm text-brand-dark"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex justify-end border-t border-rule pt-4">
            <span className="inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-sm font-medium text-on-fill transition-colors duration-ui ease-ui group-hover:bg-brand-dark">
              View and book
            </span>
          </div>
        </div>
      </Link>
    </Tag>
  );
}
