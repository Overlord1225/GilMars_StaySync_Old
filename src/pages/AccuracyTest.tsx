import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getActiveKeywords, getTestInquiries } from "@/lib/db";
import { isOverlapping } from "@/lib/dates";
import { categorize, type Keyword } from "@/lib/categorize";
import type { InquiryCategory } from "@/lib/types";

const categories: InquiryCategory[] = [
  "booking_request",
  "availability_inquiry",
  "general_question",
  "complaint",
];
const overlapExamples = [
  {
    label: "Back-to-back stay",
    current: ["2026-11-10", "2026-11-12"],
    existing: ["2026-11-12", "2026-11-14"],
    expected: false,
  },
  {
    label: "Same dates",
    current: ["2026-11-10", "2026-11-12"],
    existing: ["2026-11-10", "2026-11-12"],
    expected: true,
  },
  {
    label: "Partial overlap",
    current: ["2026-11-11", "2026-11-14"],
    existing: ["2026-11-12", "2026-11-16"],
    expected: true,
  },
  {
    label: "Separate future dates",
    current: ["2030-01-01", "2030-01-04"],
    existing: ["2030-02-01", "2030-02-03"],
    expected: false,
  },
] as const;
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
        "Accuracy test data could not be loaded. Check super-admin access and seed data.",
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
  const categoryRates = categories.map((category) => {
    const subset = results.filter((row) => row.expected_category === category);
    return {
      category,
      total: subset.length,
      correct: subset.filter((row) => row.predicted === category).length,
    };
  });

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
        description="Run the current active keyword rules against the labeled test messages."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Accuracy test" },
        ]}
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
              <p className="text-sm text-text-muted">Overall accuracy</p>
              <p className="font-heading text-4xl font-bold text-brand">
                {accuracy}%
              </p>
            </div>
            <p className="text-sm text-text-muted">
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
                <p className="text-sm capitalize text-text-muted">
                  {item.category.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-brand-dark">
                  {item.total
                    ? Math.round((item.correct / item.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-text-muted">
                  {item.correct} / {item.total} correct
                </p>
              </Card>
            ))}
          </div>
          <Card>
            <h2 className="font-heading text-xl font-semibold text-brand-dark">
              Confusion table
            </h2>
            <p className="mb-3 text-sm text-text-muted">
              Rows show expected category; columns show predicted category.
            </p>
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
                    <tr className="border-t border-border" key={row.expected}>
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
            <h2 className="mb-3 font-heading text-xl font-semibold text-brand-dark">
              Misclassified messages
            </h2>
            <div className="space-y-3">
              {results
                .filter((row) => row.expected_category !== row.predicted)
                .map((row) => (
                  <article
                    key={row.id}
                    className="rounded-control bg-cream p-3"
                  >
                    <p className="text-sm leading-5">{row.message}</p>
                    <p className="mt-2 text-xs capitalize text-text-muted">
                      {row.language} · expected:{" "}
                      {row.expected_category.replaceAll("_", " ")} · predicted:{" "}
                      {row.predicted.replaceAll("_", " ")}
                    </p>
                  </article>
                ))}
              {results.every(
                (row) => row.expected_category === row.predicted,
              ) && (
                <p className="text-sm text-text-muted">
                  No misclassified messages.
                </p>
              )}
            </div>
          </Card>
        </>
      )}
      <Card>
        <h2 className="font-heading text-xl font-semibold text-brand-dark">
          Overlap behavior examples
        </h2>
        <p className="mb-3 text-sm text-text-muted">
          Half-open date ranges count an overlap when check-in is before the
          other check-out and check-out is after the other check-in.
        </p>
        <ul className="space-y-2">
          {overlapExamples.map((example) => {
            const actual = isOverlapping(
              example.current[0],
              example.current[1],
              example.existing[0],
              example.existing[1],
            );
            return (
              <li
                key={example.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-cream p-3 text-sm"
              >
                <span>{example.label}</span>
                <span
                  className={
                    actual === example.expected
                      ? "text-success-700"
                      : "text-danger-700"
                  }
                >
                  {actual ? "overlap" : "no overlap"} ·{" "}
                  {actual === example.expected ? "pass" : "fail"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
