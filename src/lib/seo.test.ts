import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_URL,
  canonicalUrl,
  isIndexablePath,
  normalizeSiteUrl,
  unitJsonLd,
} from "./seo";
import type { Unit } from "./types";

describe("normalizeSiteUrl", () => {
  it("falls back when empty", () => {
    expect(normalizeSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl("  ")).toBe(DEFAULT_SITE_URL);
  });
  it("strips trailing slashes", () => {
    expect(normalizeSiteUrl("https://example.com//")).toBe(
      "https://example.com",
    );
  });
});

describe("canonicalUrl", () => {
  it("drops query, hash and trailing slash", () => {
    expect(canonicalUrl("https://x.com", "/units/abc/?check_in=1#top")).toBe(
      "https://x.com/units/abc",
    );
  });
  it("root has no path", () => {
    expect(canonicalUrl("https://x.com", "/")).toBe("https://x.com");
  });
});

describe("unitJsonLd", () => {
  it("maps unit fields", () => {
    const unit = {
      id: "u1",
      name: "Building F Unit 122",
      description: null,
      capacity: 4,
      amenities: ["Wi-Fi"],
      image_urls: ["https://img/1.jpg", ""],
      price_per_night: 2000,
    } as Unit;
    const ld = unitJsonLd("https://x.com", unit);
    expect(ld.url).toBe("https://x.com/units/u1");
    expect(ld.image).toEqual(["https://img/1.jpg"]);
    expect(ld.occupancy.maxValue).toBe(4);
    expect(ld.amenityFeature[0]?.name).toBe("Wi-Fi");
  });
});

describe("isIndexablePath", () => {
  it("allows public pages", () => {
    for (const p of ["/", "/units", "/units/abc", "/units/abc/", "/help"])
      expect(isIndexablePath(p)).toBe(true);
  });
  it("blocks private and unknown pages", () => {
    for (const p of [
      "/login",
      "/admin",
      "/admin/units",
      "/my-bookings",
      "/nope",
    ])
      expect(isIndexablePath(p)).toBe(false);
  });
});
