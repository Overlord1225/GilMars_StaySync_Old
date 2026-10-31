import { describe, expect, it } from "vitest";
import { isOverlapping, isValidRange, nightsBetween } from "./dates";

describe("reservation date ranges", () => {
  it("allows back-to-back half-open stays", () => {
    expect(
      isOverlapping("2026-11-10", "2026-11-12", "2026-11-12", "2026-11-14"),
    ).toBe(false);
  });

  it("detects same-date and partial overlaps", () => {
    expect(
      isOverlapping("2026-11-10", "2026-11-12", "2026-11-10", "2026-11-12"),
    ).toBe(true);
    expect(
      isOverlapping("2026-11-10", "2026-11-14", "2026-11-12", "2026-11-16"),
    ).toBe(true);
  });

  it("validates departure and computes nights excluding checkout", () => {
    expect(isValidRange("2026-11-10", "2026-11-12")).toBe(true);
    expect(isValidRange("2026-11-10", "2026-11-10")).toBe(false);
    expect(nightsBetween("2026-11-10", "2026-11-12")).toBe(2);
  });
});
