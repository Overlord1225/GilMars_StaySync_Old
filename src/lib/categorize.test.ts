import { describe, expect, it } from "vitest";
import { categorize, normalizeText } from "./categorize";

describe("categorize", () => {
  it("normalizes text and matches active keyword phrases by substring", () => {
    expect(normalizeText("  Available ba?!  ")).toBe("available ba");
    expect(
      categorize("Hello, available ba po?", [
        {
          category: "availability_inquiry",
          keyword: "available ba",
          language: "tl",
          weight: 2,
        },
      ]).category,
    ).toBe("availability_inquiry");
  });

  it("adds keyword weights by category", () => {
    const result = categorize("Please book and reserve", [
      {
        category: "booking_request",
        keyword: "book",
        language: "en",
        weight: 2,
      },
      {
        category: "booking_request",
        keyword: "reserve",
        language: "en",
        weight: 3,
      },
      { category: "complaint", keyword: "please", language: "en", weight: 1 },
    ]);
    expect(result.category).toBe("booking_request");
    expect(result.score).toBe(5);
    expect(result.matchedKeywords).toEqual(["book", "reserve", "please"]);
  });

  it("uses general_question for ties and unmatched messages", () => {
    const tie = categorize("available and complaint", [
      {
        category: "availability_inquiry",
        keyword: "available",
        language: "en",
        weight: 2,
      },
      {
        category: "complaint",
        keyword: "complaint",
        language: "en",
        weight: 2,
      },
    ]);
    expect(tie.category).toBe("general_question");
    expect(categorize("hello there", []).category).toBe("general_question");
  });

  it("includes subject text when categorizing", () => {
    const result = categorize(
      "I need help",
      [
        {
          category: "booking_request",
          keyword: "book",
          language: "en",
          weight: 2,
        },
      ],
      "Booking request",
    );
    expect(result.category).toBe("booking_request");
  });
});
