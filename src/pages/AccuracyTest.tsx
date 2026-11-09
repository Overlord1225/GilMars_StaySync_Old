import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getActiveKeywords, getTestInquiries } from "@/lib/db";
import { availabilityCases, isAvailable } from "@/lib/availability";
import { categoryMetrics } from "@/lib/accuracy";
import { categorize, type Keyword } from "@/lib/categorize";
import type { InquiryCategory } from "@/lib/types";

const categories: InquiryCategory[] = [
  "booking_request",
  "availability_inquiry",
  "general_question",
  "complaint",
];
export default function AccuracyTest() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [cases, setCases] = useState<
    {
      id: string;
      message: string;
      expected_category: InquiryCategory;
      language: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const load = useCallback(async () => {
    try {
      const [keywordRows, testRows] = await Promise.all([
        getActiveKeywords(),
        getTestInquiries(),
      ]);
      setKeywords(
        keywordRows.map((row) => ({
          category: row.category,
          keyword: row.keyword,
          language: row.language ?? "en",
          weight: row.weight,
        })),
      );
      setCases(testRows);
      setError("");
    } catch {
      setError(
        "Accuracy test data could not be loaded. Check admin access and seed data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, reload]);

  const results = useMemo(
    () =>
      cases.map((testCase) => ({
        ...testCase,
        predicted: categorize(testCase.message, keywords).category,
      })),
    [cases, keywords],
  );
  const accuracy = results.length
    ? Math.round(
        (results.filter((row) => row.expected_category === row.predicted)
          .length /
          results.length) *
          100,
      )
    : 0;
  const matrix = useMemo(
    () =>
      categories.map((expected) => ({
        expected,
        values: categories.map(
          (predicted) =>
            results.filter(
              (row) =>
                row.expected_category === expected &&
                row.predicted === predicted,
            ).length,
        ),
      })),
    [results],
  );
  const categoryRates = categoryMetrics(
    results.map((row) => ({
      expected: row.expected_category,
      predicted: row.predicted,
    })),
    categories,
  );
  const pct = (value: number | null) =>
    value === null ? "—" : `${Math.round(value * 100)}%`;

  const availabilityResults = availabilityCases.map((testCase) => {
    const actual = isAvailable(testCase.requested, testCase.existing);
    return { ...testCase, actual, pass: actual === testCase.expectedAvailable };
  });
  const availabilityPassed = availabilityResults.filter((r) => r.pass).length;

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-card" />
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Accuracy test unavailable"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            Try again
          </Button>
        }
      />
    );
  return (
    <section className="space-y-6">
      <PageHeader
        title="Accuracy test"
        actions={
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            Refresh data
          </Button>
        }
      />
      {!results.length ? (
        <EmptyState
          title="No labeled messages"
          description="Add labeled test_inquiries and active keywords before running the evaluation."
        />
      ) : (
        <>
          <Card className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-muted">Overall accuracy</p>
              <p className="font-heading text-4xl font-semibold text-brand">
                {accuracy}%
              </p>
            </div>
            <p className="text-sm text-ink-muted">
              {
                results.filter((row) => row.expected_category === row.predicted)
                  .length
              }{" "}
              correct out of {results.length}
            </p>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryRates.map((item) => (
              <Card key={item.category}>
                <p className="text-sm capitalize text-ink-muted">
                  {item.category.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-brand-dark">
                  {pct(item.recall)}
                </p>
                <p className="text-xs text-ink-muted">
                  Recall · {item.correct} / {item.total} correct
                </p>
                <p className="mt-2 text-lg font-semibold text-brand-dark">
                  {pct(item.precision)}
                </p>
                <p className="text-xs text-ink-muted">
                  Precision · {item.correct} / {item.predictedTotal} predicted
                </p>
              </Card>
            ))}
          </div>
          <Card>
            <h2 className="mb-3 font-heading text-xl text-brand-dark">
              Confusion table
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-152 w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">Expected ↓ / Predicted →</th>
                    {categories.map((category) => (
                      <th className="p-2 capitalize" key={category}>
                        {category.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr className="border-t border-rule" key={row.expected}>
                      <th className="p-2 text-left capitalize">
                        {row.expected.replaceAll("_", " ")}
                      </th>
                      {row.values.map((count, index) => (
                        <td className="p-2" key={categories[index]}>
                          {count}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 font-heading text-xl text-brand-dark">
              Misclassified messages
            </h2>
            <div className="divide-y divide-rule">
              {results
                .filter((row) => row.expected_category !== row.predicted)
                .map((row) => (
                  <article key={row.id} className="py-3 first:pt-0">
                    <p className="text-sm leading-5">{row.message}</p>
                    <p className="mt-2 text-xs capitalize text-ink-muted">
                      {row.language} · expected:{" "}
                      {row.expected_category.replaceAll("_", " ")} · predicted:{" "}
                      {row.predicted.replaceAll("_", " ")}
                    </p>
                  </article>
                ))}
              {results.every(
                (row) => row.expected_category === row.predicted,
              ) && (
                <p className="text-sm text-ink-muted">
                  No misclassified messages.
                </p>
              )}
            </div>
          </Card>
        </>
      )}
      <Card>
        <h2 className="font-heading text-xl text-brand-dark">
          Availability test
        </h2>
        <p className="mb-3 text-sm text-ink-muted">
          Check-out is exclusive: a confirmed stay blocks a request when its
          check-in is before the requested check-out and its check-out is after
          the requested check-in. Pending stays never block.
        </p>
        <p className="mb-3 text-sm">
          {availabilityPassed} of {availabilityResults.length} cases correct (
          {Math.round((availabilityPassed / availabilityResults.length) * 100)}
          %)
        </p>
        <ul className="divide-y divide-rule">
          {availabilityResults.map((row) => (
            <li
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span>{row.label}</span>
              <span
                className={row.pass ? "text-success-700" : "text-danger-700"}
              >
                expected {row.expectedAvailable ? "available" : "blocked"} · got{" "}
                {row.actual ? "available" : "blocked"} ·{" "}
                {row.pass ? "pass" : "fail"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
