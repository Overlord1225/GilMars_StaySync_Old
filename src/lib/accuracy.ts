export interface CategoryMetrics<C extends string> {
  category: C;
  total: number;
  correct: number;
  predictedTotal: number;
  /** correct / total, null when nothing was expected as this category. */
  recall: number | null;
  /** correct / predictedTotal, null when nothing was predicted as this category. */
  precision: number | null;
}

export function categoryMetrics<C extends string>(
  results: { expected: C; predicted: C }[],
  categories: C[],
): CategoryMetrics<C>[] {
  return categories.map((category) => {
    const total = results.filter((r) => r.expected === category).length;
    const predictedTotal = results.filter(
      (r) => r.predicted === category,
    ).length;
    const correct = results.filter(
      (r) => r.expected === category && r.predicted === category,
    ).length;
    return {
      category,
      total,
      correct,
      predictedTotal,
      recall: total ? correct / total : null,
      precision: predictedTotal ? correct / predictedTotal : null,
    };
  });
}
