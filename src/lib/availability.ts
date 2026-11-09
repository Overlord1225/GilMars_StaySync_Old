import { isOverlapping } from "./dates";

export interface ExistingStay {
  check_in: string;
  check_out: string;
  status: "confirmed" | "pending";
}

export interface AvailabilityCase {
  label: string;
  requested: readonly [checkIn: string, checkOut: string];
  existing: ExistingStay[];
  expectedAvailable: boolean;
}

/** Only confirmed stays block dates; check-out is exclusive. */
export function isAvailable(
  requested: readonly [string, string],
  existing: ExistingStay[],
): boolean {
  return !existing.some(
    (stay) =>
      stay.status === "confirmed" &&
      isOverlapping(requested[0], requested[1], stay.check_in, stay.check_out),
  );
}

const confirmed = (check_in: string, check_out: string): ExistingStay => ({
  check_in,
  check_out,
  status: "confirmed",
});

// Extend this list to add availability test cases.
export const availabilityCases: AvailabilityCase[] = [
  {
    label: "Back-to-back: requested starts on existing check-out",
    requested: ["2026-11-12", "2026-11-14"],
    existing: [confirmed("2026-11-10", "2026-11-12")],
    expectedAvailable: true,
  },
  {
    label: "Back-to-back: requested ends on existing check-in",
    requested: ["2026-11-10", "2026-11-12"],
    existing: [confirmed("2026-11-12", "2026-11-14")],
    expectedAvailable: true,
  },
  {
    label: "Exact same dates",
    requested: ["2026-11-10", "2026-11-12"],
    existing: [confirmed("2026-11-10", "2026-11-12")],
    expectedAvailable: false,
  },
  {
    label: "Partial overlap at the start of the existing stay",
    requested: ["2026-11-08", "2026-11-11"],
    existing: [confirmed("2026-11-10", "2026-11-14")],
    expectedAvailable: false,
  },
  {
    label: "Partial overlap at the end of the existing stay",
    requested: ["2026-11-13", "2026-11-16"],
    existing: [confirmed("2026-11-10", "2026-11-14")],
    expectedAvailable: false,
  },
  {
    label: "Requested stay inside an existing stay",
    requested: ["2026-11-11", "2026-11-12"],
    existing: [confirmed("2026-11-10", "2026-11-14")],
    expectedAvailable: false,
  },
  {
    label: "Existing stay inside the requested stay",
    requested: ["2026-11-08", "2026-11-16"],
    existing: [confirmed("2026-11-10", "2026-11-12")],
    expectedAvailable: false,
  },
  {
    label: "No overlap",
    requested: ["2026-12-01", "2026-12-04"],
    existing: [confirmed("2026-11-10", "2026-11-12")],
    expectedAvailable: true,
  },
  {
    label: "Booking more than 6 months ahead",
    requested: ["2027-07-10", "2027-07-13"],
    existing: [confirmed("2027-07-11", "2027-07-12")],
    expectedAvailable: false,
  },
  {
    label: "Pending booking on the same dates does not block",
    requested: ["2026-11-10", "2026-11-12"],
    existing: [
      { check_in: "2026-11-10", check_out: "2026-11-12", status: "pending" },
    ],
    expectedAvailable: true,
  },
];
