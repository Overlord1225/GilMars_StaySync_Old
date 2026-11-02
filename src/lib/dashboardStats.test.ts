import { describe, expect, it } from "vitest";
import {
  confirmedByUnit,
  inquiriesByCategory,
  reservationsByMonth,
  statusSplit,
} from "./dashboardStats";
import type { Inquiry, Reservation, Unit } from "./types";

const res = (check_in: string, status: Reservation["status"], unit_id = "u1") =>
  ({ check_in, status, unit_id }) as Reservation;

describe("dashboardStats", () => {
  it("builds a 6 month window across a year boundary", () => {
    const rows = reservationsByMonth(
      [res("2026-12-05", "confirmed"), res("2026-08-01", "pending")],
      "2027-01-15",
    );
    expect(rows.map((r) => r.month)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
    expect(rows[4]?.confirmed).toBe(1);
    expect(rows[0]?.pending).toBe(1);
  });

  it("skips zero statuses", () => {
    expect(statusSplit([res("2026-01-01", "pending")])).toEqual([
      { status: "pending", count: 1 },
    ]);
  });

  it("counts null category as general_question", () => {
    const rows = inquiriesByCategory([
      { category: null } as Inquiry,
      { category: "complaint" } as Inquiry,
    ]);
    expect(rows.find((r) => r.category === "general_question")?.count).toBe(1);
    expect(rows.find((r) => r.category === "booking_request")?.count).toBe(0);
  });

  it("keeps units with no bookings", () => {
    const units = [
      { id: "u1", name: "A" },
      { id: "u2", name: "B" },
    ] as Unit[];
    expect(
      confirmedByUnit(
        [res("2026-01-01", "confirmed"), res("2026-01-02", "pending")],
        units,
      ),
    ).toEqual([
      { unit: "A", count: 1 },
      { unit: "B", count: 0 },
    ]);
  });
});
