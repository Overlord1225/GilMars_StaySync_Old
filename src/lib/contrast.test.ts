/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const css = readFileSync("src/index.css", "utf8");
const darkBlock =
  css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? "";

function token(name: string, theme: "light" | "dark" = "light"): string {
  const pattern = new RegExp(`--color-${name}:\s*([^;]+);`);
  const value =
    (theme === "dark" ? darkBlock.match(pattern)?.[1] : undefined) ??
    css.match(pattern)?.[1];
  if (!value) throw new Error(`missing token --color-${name}`);
  return value.trim();
}

// [foreground, background, minimum ratio]
const pairs: [string, string, number][] = [
  ["ink", "paper", 7],
  ["ink", "surface", 7],
  ["ink-muted", "paper", 4.5],
  ["ink-muted", "surface", 4.5],
  ["brand", "paper", 4.5],
  ["brand", "surface", 4.5],
  ["brand-dark", "paper", 4.5],
  ["brand-dark", "surface", 4.5],
  ["brand-dark", "brand-light", 4.5],
  ["on-fill", "brand", 4.5],
  ["on-fill", "brand-dark", 4.5],
  ["on-fill", "danger-700", 4.5],
  ["on-band", "band", 4.5],
  ["on-mango", "mango", 4.5],
  ["rule-strong", "paper", 3],
  ["rule-strong", "surface", 3],
  ["success-700", "success-50", 4.5],
  ["warning-800", "warning-50", 4.5],
  ["warning-900", "warning-50", 4.5],
  ["danger-700", "danger-50", 4.5],
  ["danger-700", "surface", 4.5],
  ["danger-800", "danger-50", 4.5],
  ["status-pending", "warning-50", 4.5],
  ["status-confirmed", "success-50", 4.5],
  ["status-rejected", "danger-50", 4.5],
  ["status-cancelled", "status-cancelled-bg", 4.5],
  ["status-completed", "brand-light", 4.5],
  ["focus-ring", "paper", 3],
  ["focus-ring", "surface", 3],
];

describe.each(["light", "dark"] as const)("%s theme contrast", (theme) => {
  it.each(pairs)("%s on %s is at least %s:1", (fg, bg, min) => {
    expect(
      contrastRatio(token(fg, theme), token(bg, theme)),
    ).toBeGreaterThanOrEqual(min);
  });
});

describe("design tokens", () => {
  it("dark theme block exists", () => {
    expect(darkBlock).not.toBe("");
  });
  it("pre-redo token names are removed", () => {
    expect(css).not.toMatch(/--color-(mist|text|text-muted|border):/);
  });
});
