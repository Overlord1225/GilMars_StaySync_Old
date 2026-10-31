import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeRow = { id: string; created_at: string | null };

export type RealtimeHandler<RowType extends RealtimeRow = RealtimeRow> = (
  payload: RealtimePostgresChangesPayload<RowType>,
) => void;

function createdAtDesc<RowType extends RealtimeRow>(
  a: RowType,
  b: RowType,
): number {
  const aDate = a.created_at ?? "";
  const bDate = b.created_at ?? "";
  return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
}

/**
 * Pure reducer that applies one postgres_changes payload to a row list.
 * Handles INSERT / UPDATE / DELETE, never duplicates rows by id, and keeps
 * the list sorted by created_at descending.
 */
export function applyRealtimeChange<RowType extends RealtimeRow>(
  rows: RowType[],
  payload: RealtimePostgresChangesPayload<RowType>,
): RowType[] {
  const { eventType, new: record, old } = payload;
  const changed = (eventType === "DELETE" ? old : record) as
    RowType | undefined;
  if (!changed) return rows;

  let next: RowType[];
  switch (eventType) {
    case "INSERT":
      next = rows.some((row) => row.id === changed.id)
        ? rows
        : [...rows, changed];
      break;
    case "UPDATE":
      next = rows.map((row) => (row.id === changed.id ? changed : row));
      break;
    case "DELETE":
      next = rows.filter((row) => row.id !== changed.id);
      break;
    default:
      return rows;
  }

  return [...next].sort(createdAtDesc);
}
