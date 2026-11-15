import type { Unit } from "./types";

export const DEFAULT_SITE_URL = "https://gil-mars-stay-sync-old.vercel.app";
export const SITE_NAME = "GilMars StaySync";

/** Origin without a trailing slash; falls back to the production URL. */
export function normalizeSiteUrl(raw?: string): string {
  const value = raw?.trim();
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/+$/, "");
}

/** Canonical URL for a path: no query string, hash or trailing slash. */
export function canonicalUrl(siteUrl: string, pathname: string): string {
  const path = (pathname.split(/[?#]/)[0] ?? "").replace(/\/+$/, "");
  return `${siteUrl}${path}`;
}

export function siteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: SITE_NAME,
    url: `${siteUrl}/`,
    image: `${siteUrl}/og-image.png`,
    address: { "@type": "PostalAddress", addressCountry: "PH" },
  };
}

export function unitJsonLd(siteUrl: string, unit: Unit) {
  const images = unit.image_urls.filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: unit.name,
    description: unit.description ?? undefined,
    url: `${siteUrl}/units/${unit.id}`,
    image: images.length ? images : undefined,
    address: { "@type": "PostalAddress", addressCountry: "PH" },
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: unit.capacity,
    },
    amenityFeature: unit.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    priceRange: `PHP ${unit.price_per_night}`,
  };
}

const INDEXABLE_EXACT = new Set([
  "/",
  "/units",
  "/help",
  "/privacy",
  "/terms",
  "/cancellation-policy",
  "/house-rules",
]);

/** Public marketing pages only. Auth, guest, admin and unknown routes stay out of search. */
export function isIndexablePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return INDEXABLE_EXACT.has(path) || /^\/units\/[^/]+$/.test(path);
}
