import { describe, expect, it } from "vitest";
import { monthBounds, monthMetrics, type MetricRow } from "./metrics";

const row = (over: Partial<MetricRow>): MetricRow => ({
  unit_id: "u1",
  check_in: "2026-11-01",
  check_out: "2026-11-03",
  status: "confirmed",
  source: "staysync",
  num_guests: 2,
  ...over,
});

describe("monthBounds", () => {
  it("handles year end and February", () => {
    expect(monthBounds("2026-12-15")).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
    expect(monthBounds("2028-02-10").end).toBe("2028-03-01");
  });
});

describe("monthMetrics", () => {
  const rate = () => 2000;
  const run = (rows: MetricRow[]) => {
    const [entry] = monthMetrics(
      rows,
      ["u1"],
      "2026-11-01",
      "2026-12-01",
      rate,
    );
    if (!entry) throw new Error("expected one entry");
    return entry;
  };

  it("counts only the nights inside the month (check-out exclusive)", () => {
    const result = run([
      row({ check_in: "2026-11-28", check_out: "2026-12-03" }),
    ]);
    expect(result.directNights).toBe(3); // Nov 28, 29, 30
    expect(result.directRevenue).toBe(6000);
  });

  it("ignores pending and cancelled stays", () => {
    expect(
      run([row({ status: "pending" }), row({ status: "cancelled" })])
        .directNights,
    ).toBe(0);
  });

  it("splits sources and removes blocked nights from the denominator", () => {
    const result = run([
      row({ check_in: "2026-11-01", check_out: "2026-11-06" }),
      row({
        source: "airbnb",
        check_in: "2026-11-06",
        check_out: "2026-11-11",
      }),
      row({ source: "block", check_in: "2026-11-11", check_out: "2026-11-21" }),
    ]);
    expect(result).toMatchObject({
      directNights: 5,
      airbnbNights: 5,
      blockedNights: 10,
      occupancyPct: 50, // 10 booked / 20 available
      directRevenue: 10000,
    });
  });
});
