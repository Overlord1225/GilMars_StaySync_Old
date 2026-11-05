import { describe, expect, it } from "vitest";
import { nightlyRate } from "./pricing";

const unit = {
  price_per_night: 1899,
  price_3_guests: 2399,
  price_4_guests: 2899,
  extra_guest_fee: 500,
};

describe("nightlyRate", () => {
  it("prices by guest count", () => {
    expect(nightlyRate(unit, 1)).toBe(1899);
    expect(nightlyRate(unit, 2)).toBe(1899);
    expect(nightlyRate(unit, 3)).toBe(2399);
    expect(nightlyRate(unit, 4)).toBe(2899);
  });
  it("adds the extra guest fee beyond 4", () => {
    expect(nightlyRate(unit, 6)).toBe(3899);
  });
  it("falls back to the base rate without tiers", () => {
    const flat = {
      price_per_night: 2000,
      price_3_guests: null,
      price_4_guests: null,
      extra_guest_fee: null,
    };
    expect(nightlyRate(flat, 4)).toBe(2000);
    expect(nightlyRate(flat, 5)).toBe(2000);
  });
});
