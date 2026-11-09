import { describe, expect, it } from "vitest";
import { availabilityCases, isAvailable } from "./availability";

describe("availability", () => {
  it("lets pending stays not block but confirmed stays block", () => {
    const dates = ["2026-11-10", "2026-11-12"] as const;
    const stay = { check_in: "2026-11-10", check_out: "2026-11-12" };
    expect(isAvailable(dates, [{ ...stay, status: "pending" }])).toBe(true);
    expect(isAvailable(dates, [{ ...stay, status: "confirmed" }])).toBe(false);
  });

  it.each(availabilityCases)("$label", (testCase) => {
    expect(isAvailable(testCase.requested, testCase.existing)).toBe(
      testCase.expectedAvailable,
    );
  });
});
