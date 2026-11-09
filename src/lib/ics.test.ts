import { describe, expect, it } from "vitest";
import { buildStayIcs } from "./ics";

describe("buildStayIcs", () => {
  const ics = buildStayIcs({
    id: "abc",
    unitName: "Building F, Unit 122",
    checkIn: "2026-12-30",
    checkOut: "2027-01-02",
    stamp: "20261109T000000Z",
  });

  it("uses all-day dates with check-out as the exclusive end", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261230");
    expect(ics).toContain("DTEND;VALUE=DATE:20270102");
  });

  it("escapes commas in the summary", () => {
    expect(ics).toContain("SUMMARY:Stay at Building F\\, Unit 122");
  });

  it("uses CRLF line endings", () => {
    expect(ics.split("\r\n").length).toBeGreaterThan(8);
  });
});
