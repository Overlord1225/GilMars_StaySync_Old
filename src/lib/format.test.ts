import { describe, expect, it } from "vitest";
import { formatExpiryDeadline } from "./format";

describe("formatExpiryDeadline", () => {
  it("adds the window and shows Manila time", () => {
    // 2026-12-01 02:00 UTC = 10:00 Manila; +24h = Wed, Dec 2, 10:00 AM.
    const text = formatExpiryDeadline("2026-12-01T02:00:00Z", 24);
    expect(text).toContain("Dec 2");
    expect(text).toMatch(/10:00\s?am/i);
  });
});
