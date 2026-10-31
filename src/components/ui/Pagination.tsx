import { Button } from "./Button";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "items",
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (pageCount <= 1) return null;
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-text-muted">
        Page <span className="font-semibold text-text">{safePage}</span> of{" "}
        {pageCount} {label}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={safePage === pageCount}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
