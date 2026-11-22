import { useId, type ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

// The first column is the row header. Explicit roles keep the table semantics
// when the rows turn into stacked cards (display: block drops them in Safari).
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
  const captionId = useId();
  return (
    // A focusable, named region lets keyboard users scroll a wide table. The
    // layout switches on the table's own width, so a sidebar does not fool it.
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className={`@container w-full overflow-x-auto ${className}`.trim()}
    >
      <table
        role="table"
        className="w-full border-separate border-spacing-y-2 text-left text-sm @2xl:border-collapse @2xl:border-spacing-y-0"
      >
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead
          role="rowgroup"
          className="hidden border-b border-rule-strong text-sm font-semibold text-ink-muted @2xl:table-header-group"
        >
          <tr role="row">
            {columns.map((column) => (
              <th
                role="columnheader"
                scope="col"
                key={column.key}
                className={`px-4 py-2 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.length === 0 ? (
            <tr role="row">
              <td
                role="cell"
                colSpan={columns.length}
                className="rounded-card border border-rule bg-surface px-4 py-8 text-center text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                role="row"
                key={getRowKey(row)}
                className="block rounded-card border border-rule bg-surface p-3 @2xl:table-row @2xl:border-0 @2xl:border-b @2xl:bg-transparent @2xl:p-0 @2xl:transition-colors @2xl:duration-ui @2xl:ease-ui @2xl:hover:bg-brand-light/40"
              >
                {columns.map((column, index) => {
                  const Cell = index === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={column.key}
                      role={index === 0 ? "rowheader" : "cell"}
                      scope={index === 0 ? "row" : undefined}
                      data-label={column.header}
                      className={`tabular-nums grid grid-cols-[minmax(6rem,35%)_1fr] gap-3 border-b border-rule/70 py-2.5 text-left font-normal last:border-0 before:content-[attr(data-label)] before:text-xs before:font-semibold before:text-ink-muted @2xl:table-cell @2xl:border-0 @2xl:px-4 @2xl:py-3 @2xl:before:hidden ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </Cell>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
