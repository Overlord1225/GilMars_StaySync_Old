import { describe, expect, it } from "vitest";
import {
  dayTourRate,
  dayTourTierLines,
  nightlyRate,
  offersDayTour,
  stayTotal,
} from "./pricing";

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

const dayUnit = {
  ...unit,
  day_tour_price: 1599,
  day_tour_price_3_guests: 2099,
  day_tour_price_4_guests: 2599,
  day_tour_extra_guest_fee: 300,
};

describe("day tour pricing", () => {
  it("prices by guest count", () => {
    expect(dayTourRate(dayUnit, 1)).toBe(1599);
    expect(dayTourRate(dayUnit, 2)).toBe(1599);
    expect(dayTourRate(dayUnit, 3)).toBe(2099);
    expect(dayTourRate(dayUnit, 4)).toBe(2599);
  });
  it("adds the extra guest fee beyond 4", () => {
    expect(dayTourRate(dayUnit, 6)).toBe(3199);
  });
  it("is free of charge only when the unit has no day tours", () => {
    const none = {
      ...unit,
      day_tour_price: null,
      day_tour_price_3_guests: null,
      day_tour_price_4_guests: null,
      day_tour_extra_guest_fee: null,
    };
    expect(offersDayTour(none)).toBe(false);
    expect(offersDayTour(dayUnit)).toBe(true);
    expect(dayTourRate(none, 2)).toBe(0);
  });
  it("lists the tiers for display", () => {
    expect(dayTourTierLines(dayUnit)).toEqual([
      "1–2 guests PHP 1,599",
      "3 guests PHP 2,099",
      "4 guests PHP 2,599",
      "+PHP 300 per extra guest",
    ]);
  });
});

describe("stayTotal", () => {
  it("multiplies the nightly rate by nights for an overnight stay", () => {
    expect(stayTotal(dayUnit, 2, "overnight", 3)).toBe(3 * 1899);
  });
  it("charges the flat day-tour price once, whatever the night count", () => {
    expect(stayTotal(dayUnit, 2, "day_tour", 1)).toBe(1599);
    expect(stayTotal(dayUnit, 4, "day_tour", 1)).toBe(2599);
  });
  it("treats a missing stay type as overnight", () => {
    expect(stayTotal(dayUnit, 2, null, 2)).toBe(2 * 1899);
  });
});
