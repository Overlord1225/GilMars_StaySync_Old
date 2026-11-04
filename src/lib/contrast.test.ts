import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const css = readFileSync("src/index.css", "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`missing token --color-${name}`);
  return match[1].trim();
}

describe("design token contrast", () => {
  it("ink on paper is at least 7:1", () => {
    expect(contrastRatio(token("ink"), token("paper"))).toBeGreaterThanOrEqual(
      7,
    );
  });
  it("ink-muted on paper is at least 4.5:1", () => {
    expect(
      contrastRatio(token("ink-muted"), token("paper")),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("ink-muted on surface is at least 4.5:1", () => {
    expect(
      contrastRatio(token("ink-muted"), token("surface")),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("brand on paper is at least 4.5:1", () => {
    expect(
      contrastRatio(token("brand"), token("paper")),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("white text on brand is at least 4.5:1", () => {
    expect(
      contrastRatio(token("surface"), token("brand")),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("rule-strong on paper is at least 3:1", () => {
    expect(
      contrastRatio(token("rule-strong"), token("paper")),
    ).toBeGreaterThanOrEqual(3);
  });
  it("old token names alias the new ones", () => {
    expect(token("text")).toBe("var(--color-ink)");
    expect(token("text-muted")).toBe("var(--color-ink-muted)");
    expect(token("mist")).toBe("var(--color-paper)");
    expect(token("border")).toBe("var(--color-rule)");
  });
});
