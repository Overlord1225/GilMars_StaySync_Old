import { describe, expect, it } from "vitest";
import { buildCsv, csvCell } from "./csv";

describe("csv", () => {
  it("escapes quotes and prefixes formula leads", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("-1")).toBe(`"'-1"`);
    expect(csvCell("@x")).toBe(`"'@x"`);
    expect(csvCell(null)).toBe('""');
    expect(csvCell(5)).toBe('"5"');
  });
  it("joins rows with CRLF and keeps commas inside quotes", () => {
    expect(buildCsv(["a", "b"], [["x,y", 1]])).toBe('"a","b"\r\n"x,y","1"');
  });
});
