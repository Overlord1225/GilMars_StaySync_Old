import { describe, expect, it } from "vitest";
import { categoryMetrics } from "./accuracy";

describe("categoryMetrics", () => {
  const results = [
    { expected: "a", predicted: "a" },
    { expected: "a", predicted: "b" },
    { expected: "b", predicted: "b" },
    { expected: "b", predicted: "b" },
    { expected: "c", predicted: "b" },
  ];
  const [a, b, c, d] = categoryMetrics(results, ["a", "b", "c", "d"]);

  it("computes recall and precision", () => {
    expect(a).toMatchObject({ correct: 1, total: 2, predictedTotal: 1 });
    expect(a?.recall).toBe(0.5);
    expect(a?.precision).toBe(1);
    expect(b?.recall).toBe(1);
    expect(b?.precision).toBe(0.5);
  });

  it("returns null precision when nothing was predicted", () => {
    expect(c?.recall).toBe(0);
    expect(c?.precision).toBeNull();
  });

  it("returns null recall when nothing was expected", () => {
    expect(d?.recall).toBeNull();
    expect(d?.precision).toBeNull();
  });
});
