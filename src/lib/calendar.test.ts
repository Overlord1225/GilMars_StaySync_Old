import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import {
  buildCalendarDays,
  daysInMonth,
  monthGrid,
  weekdayIndex,
  type CalendarMonthRow,
} from "./calendar";

function row(input: {
  id: string;
  checkIn: string;
  checkOut: string;
  status?: CalendarMonthRow["status"];
  source?: CalendarMonthRow["source"];
  guestName?: string;
}): CalendarMonthRow {
  return {
    id: input.id,
    unit_id: "10000000-0000-4000-8000-000000000001",
    check_in: input.checkIn,
    check_out: input.checkOut,
    num_guests: 2,
    status: input.status ?? "confirmed",
    source: input.source ?? "staysync",
    guest_id: "30000000-0000-4000-8000-000000000001",
    guest_display_name: input.guestName ?? "Guest",
    manual_guest_name: null,
    notes: null,
    deposit_amount: null,
    payment_method: null,
    payment_reference: null,
    paid_at: null,
  };
}

describe("month grid", () => {
  it("starts on a Monday and ends on a Sunday", () => {
    const grid = monthGrid(2026, 11);
    expect(weekdayIndex(grid[0]!)).toBe(0);
    expect(weekdayIndex(grid[grid.length - 1]!)).toBe(6);
  });

  it("covers the whole month with no gaps", () => {
    const grid = monthGrid(2026, 11);
    expect(grid[0]).toBe("2026-10-26");
    expect(grid.at(-1)).toBe("2026-12-06");
    expect(grid.length).toBe(42);
    expect(grid.every((date, index) => date === addDays(grid[0]!, index))).toBe(
      true,
    );
    expect(grid.filter((date) => date.startsWith("2026-11"))).toHaveLength(30);
  });

  it("includes leading and trailing days outside the month", () => {
    const days = buildCalendarDays(2026, 11, []);
    const november = days.filter((day) => day.monthOffset === 0);
    const october = days.filter((day) => day.monthOffset === -1);
    const december = days.filter((day) => day.monthOffset === 1);
    expect(november).toHaveLength(30);
    expect(october.length).toBeGreaterThan(0);
    expect(december.length).toBeGreaterThan(0);
    expect(november.every((day) => day.occupied === false)).toBe(true);
  });

  it("handles February in a leap year", () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    const grid = monthGrid(2028, 2);
    expect(grid).toContain("2028-02-29");
    expect(grid[0]).toBe("2028-01-31");
    expect(grid.at(-1)).toBe("2028-03-05");
    expect(grid.length).toBe(35);
  });

  it("handles February in a non-leap year", () => {
    expect(daysInMonth(2027, 2)).toBe(28);
    const grid = monthGrid(2027, 2);
    expect(grid).not.toContain("2027-02-29");
    expect(grid.at(-1)).toBe("2027-02-28");
    expect(grid.length).toBe(28);
  });
});

describe("weekday index (Monday first)", () => {
  it("maps Monday to 0 and Sunday to 6", () => {
    expect(weekdayIndex("2026-11-02")).toBe(0);
    expect(weekdayIndex("2026-11-01")).toBe(6);
  });
});

describe("occupancy per day (half-open ranges)", () => {
  it("occupies check-in through check-out minus one day", () => {
    const days = buildCalendarDays(2026, 11, [
      row({ id: "a", checkIn: "2026-11-05", checkOut: "2026-11-09" }),
    ]);
    const byDate = Object.fromEntries(days.map((day) => [day.date, day]));
    expect(byDate["2026-11-05"]!.occupied).toBe(true);
    expect(byDate["2026-11-08"]!.occupied).toBe(true);
    expect(byDate["2026-11-09"]!.occupied).toBe(false);
    expect(byDate["2026-11-04"]!.occupied).toBe(false);
    expect(byDate["2026-11-05"]!.reservations).toHaveLength(1);
    expect(byDate["2026-11-09"]!.reservations).toHaveLength(0);
  });

  it("marks the check-out day as free even when another reservation starts", () => {
    const days = buildCalendarDays(2026, 11, [
      row({
        id: "a",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guestName: "Departing",
      }),
      row({
        id: "b",
        checkIn: "2026-11-12",
        checkOut: "2026-11-15",
        guestName: "Arriving",
      }),
    ]);
    const byDate = Object.fromEntries(days.map((day) => [day.date, day]));
    const handover = byDate["2026-11-12"]!!;
    expect(handover.occupied).toBe(true);
    expect(handover.reservations.map((r) => r.id)).toEqual(["b"]);
    expect(handover.checkIns.map((r) => r.id)).toEqual(["b"]);
    expect(handover.checkOuts.map((r) => r.id)).toEqual(["a"]);
    expect(handover.backToBack).toBe(true);
    expect(byDate["2026-11-11"]!.occupied).toBe(true);
    expect(byDate["2026-11-11"]!.backToBack).toBe(false);
    expect(byDate["2026-11-11"]!.checkOuts).toHaveLength(0);
  });

  it("counts reservations spanning across the month boundary", () => {
    const days = buildCalendarDays(2026, 11, [
      row({
        id: "a",
        checkIn: "2026-10-28",
        checkOut: "2026-11-03",
        guestName: "Early",
      }),
      row({
        id: "b",
        checkIn: "2026-10-30",
        checkOut: "2026-11-01",
        guestName: "Ends on first",
      }),
    ]);
    const byDate = Object.fromEntries(days.map((day) => [day.date, day]));
    expect(byDate["2026-11-01"]!.occupied).toBe(true);
    expect(byDate["2026-11-01"]!.reservations.map((r) => r.id)).toEqual(["a"]);
    expect(byDate["2026-11-01"]!.checkOuts.map((r) => r.id)).toEqual(["b"]);
    expect(byDate["2026-11-02"]!.occupied).toBe(true);
    expect(byDate["2026-11-03"]!.occupied).toBe(false);
    expect(byDate["2026-10-31"]!.monthOffset).toBe(-1);
  });

  it("ignores rejected and cancelled rows for occupancy", () => {
    const days = buildCalendarDays(2026, 11, [
      row({
        id: "a",
        checkIn: "2026-11-15",
        checkOut: "2026-11-18",
        status: "rejected",
      }),
      row({
        id: "b",
        checkIn: "2026-11-20",
        checkOut: "2026-11-22",
        status: "cancelled",
      }),
    ]);
    const byDate = Object.fromEntries(days.map((day) => [day.date, day]));
    expect(byDate["2026-11-16"]!.occupied).toBe(false);
    expect(byDate["2026-11-21"]!.occupied).toBe(false);
  });

  it("shows completed and pending stays as occupied", () => {
    const days = buildCalendarDays(2026, 11, [
      row({
        id: "a",
        checkIn: "2026-11-05",
        checkOut: "2026-11-07",
        status: "completed",
      }),
      row({
        id: "b",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        status: "pending",
      }),
    ]);
    const byDate = Object.fromEntries(days.map((day) => [day.date, day]));
    expect(byDate["2026-11-05"]!.occupied).toBe(true);
    expect(byDate["2026-11-10"]!.occupied).toBe(true);
  });
});
