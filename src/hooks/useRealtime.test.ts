import { describe, expect, it } from "vitest";
import { applyRealtimeChange, type RealtimeRow } from "../lib/applyRealtimeChange";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const row = (id: string, created_at: string): RealtimeRow => ({ id, created_at });

const insertPayload = (record: RealtimeRow): RealtimePostgresChangesPayload<RealtimeRow> => ({
  eventType: "INSERT",
  new: record,
  old: {},
  schema: "public",
  table: "reservations",
  commit_timestamp: record.created_at ?? '',
  errors: [],
});

const updatePayload = (record: RealtimeRow): RealtimePostgresChangesPayload<RealtimeRow> => ({
  eventType: "UPDATE",
  new: record,
  old: row(record.id, "2026-01-01T00:00:00Z"),
  schema: "public",
  table: "reservations",
  commit_timestamp: record.created_at ?? '',
  errors: [],
});

const deletePayload = (record: RealtimeRow): RealtimePostgresChangesPayload<RealtimeRow> => ({
  eventType: "DELETE",
  new: {},
  old: record,
  schema: "public",
  table: "reservations",
  commit_timestamp: record.created_at ?? '',
  errors: [],
});

describe("applyRealtimeChange", () => {
  it("appends an INSERT row and keeps created_at descending", () => {
    const rows = [row("a", "2026-01-02T00:00:00Z")];
    expect(applyRealtimeChange(rows, insertPayload(row("b", "2026-01-03T00:00:00Z")))).toEqual([
      row("b", "2026-01-03T00:00:00Z"),
      row("a", "2026-01-02T00:00:00Z"),
    ]);
  });

  it("does not duplicate an existing id on INSERT", () => {
    const existing = row("a", "2026-01-01T00:00:00Z");
    expect(applyRealtimeChange([existing], insertPayload(row("a", "2026-01-05T00:00:00Z")))).toEqual([existing]);
  });

  it("replaces an existing row on UPDATE and re-sorts", () => {
    const rows = [row("a", "2026-01-01T00:00:00Z"), row("b", "2026-01-02T00:00:00Z")];
    expect(applyRealtimeChange(rows, updatePayload(row("a", "2026-01-03T00:00:00Z")))).toEqual([
      row("a", "2026-01-03T00:00:00Z"),
      row("b", "2026-01-02T00:00:00Z"),
    ]);
  });

  it("removes a row on DELETE using the old record", () => {
    const rows = [row("a", "2026-01-01T00:00:00Z"), row("b", "2026-01-02T00:00:00Z")];
    expect(applyRealtimeChange(rows, deletePayload(row("b", "2026-01-02T00:00:00Z")))).toEqual([
      row("a", "2026-01-01T00:00:00Z"),
    ]);
  });

  it("leaves the list unchanged for an unknown id", () => {
    const rows = [row("a", "2026-01-01T00:00:00Z")];
    expect(applyRealtimeChange(rows, updatePayload(row("z", "2026-01-05T00:00:00Z")))).toEqual(rows);
    expect(applyRealtimeChange(rows, deletePayload(row("z", "2026-01-05T00:00:00Z")))).toEqual(rows);
  });

  it("does not mutate the input list", () => {
    const rows = [row("a", "2026-01-01T00:00:00Z"), row("b", "2026-01-02T00:00:00Z")];
    const before = rows.slice();
    applyRealtimeChange(rows, deletePayload(row("b", "2026-01-02T00:00:00Z")));
    expect(rows).toEqual(before);
  });
});
