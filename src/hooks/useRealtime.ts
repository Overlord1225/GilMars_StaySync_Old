import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { applyRealtimeChange, type RealtimeHandler, type RealtimeRow } from "@/lib/applyRealtimeChange";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export { applyRealtimeChange };
export type { RealtimeHandler, RealtimeRow };

export function useRealtime<RowType extends RealtimeRow = RealtimeRow>(
  table: string,
  event: "INSERT" | "UPDATE" | "DELETE" | "*",
  handler: RealtimeHandler<RowType>,
  options?: { filter?: string },
) {
  const handlerRef = useRef<RealtimeHandler<RowType>>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`realtime:${table}:${event}:${options?.filter ?? "all"}`);
    channelRef.current = channel;

    channel
      .on("postgres_changes", { event, schema: "public", table, filter: options?.filter }, (payload) => {
        handlerRef.current(payload as RealtimePostgresChangesPayload<RowType>);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [table, event, options?.filter]);

  const unsubscribe = useCallback(() => {
    const channel = channelRef.current;
    if (channel) {
      supabase.removeChannel(channel);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

export function useReservationsRealtime<RowType extends RealtimeRow = RealtimeRow>(
  handler: RealtimeHandler<RowType>,
  options?: { filter?: string },
) {
  return useRealtime("reservations", "*", handler, options);
}

export function useInquiriesRealtime<RowType extends RealtimeRow = RealtimeRow>(
  handler: RealtimeHandler<RowType>,
  options?: { filter?: string },
) {
  return useRealtime("inquiries", "*", handler, options);
}

export function useUnitsRealtime<RowType extends RealtimeRow = RealtimeRow>(
  handler: RealtimeHandler<RowType>,
  options?: { filter?: string },
) {
  return useRealtime("units", "*", handler, options);
}
