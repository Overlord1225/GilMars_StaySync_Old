import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};
export function Table<T>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyMessage = "No items to show.",
  className = "",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  caption: string;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="hidden text-xs font-semibold uppercase tracking-wide text-text-muted md:table-header-group">
          <tr>
            {columns.map((column) => (
              <th
                scope="col"
                key={column.key}
                className={`px-4 py-2 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="rounded-card border border-border bg-surface px-4 py-8 text-center text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="block rounded-card border border-border bg-surface p-3 shadow-soft transition-shadow hover:shadow-raised md:table-row md:border-0 md:bg-transparent md:p-0 md:shadow-none"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    data-label={column.header}
                    className={`grid grid-cols-[minmax(6rem,35%)_1fr] gap-3 border-b border-border/70 py-2.5 last:border-0 before:content-[attr(data-label)] before:text-xs before:font-semibold before:text-text-muted md:table-cell md:border-0 md:bg-surface md:px-4 md:py-3 md:before:hidden ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
