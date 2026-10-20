import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type RealtimeHandler = (payload: unknown) => void;

export function useRealtime(table: string, event: "INSERT" | "UPDATE" | "DELETE" | "*", handler: RealtimeHandler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`realtime:${table}:${event}`);
    channelRef.current = channel;

    channel
      .on("postgres_changes", { event, schema: "public", table }, (payload) => {
        handlerRef.current(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [table, event]);

  const unsubscribe = useCallback(() => {
    const channel = channelRef.current;
    if (channel) {
      supabase.removeChannel(channel);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

export function useReservationsRealtime(handler: RealtimeHandler) {
  return useRealtime("reservations", "*", handler);
}

export function useInquiriesRealtime(handler: RealtimeHandler) {
  return useRealtime("inquiries", "*", handler);
}

export function useUnitsRealtime(handler: RealtimeHandler) {
  return useRealtime("units", "*", handler);
}