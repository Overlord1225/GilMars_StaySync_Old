import { describe, expect, it } from "vitest";
import { categorize, normalizeText, type Keyword } from "./categorize";

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

  const kw = (category: Keyword["category"], keyword: string): Keyword => ({
    category,
    keyword,
    language: "en",
    weight: 2,
  });
  const allKeywords = [
    kw("complaint", "complaint"),
    kw("booking_request", "book"),
    kw("availability_inquiry", "available"),
    kw("general_question", "question"),
  ];

  it("breaks ties by priority: complaint first", () => {
    expect(categorize("complaint and book", allKeywords).category).toBe(
      "complaint",
    );
  });

  it("breaks ties by priority: booking over availability", () => {
    expect(categorize("book and available", allKeywords).category).toBe(
      "booking_request",
    );
  });

  it("breaks ties by priority: availability over general", () => {
    expect(categorize("available question", allKeywords).category).toBe(
      "availability_inquiry",
    );
  });

  it("breaks a three-way tie by priority", () => {
    expect(categorize("book available question", allKeywords).category).toBe(
      "booking_request",
    );
  });

  it("uses general_question when nothing matches", () => {
    expect(categorize("hello there", allKeywords).category).toBe(
      "general_question",
    );
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
