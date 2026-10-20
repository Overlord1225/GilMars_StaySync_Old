import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type RealtimeHandler = (payload: unknown) => void;

export function useRealtime(table: string, event: "INSERT" | "UPDATE" | "DELETE" | "*", handler: RealtimeHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  let currentChannel: ReturnType<typeof supabase.channel> | null = null;

  useEffect(() => {
    currentChannel = supabase.channel(`realtime:${table}:${event}`);

    currentChannel
      .on("postgres_changes", { event, schema: "public", table }, (payload) => {
        handlerRef.current(payload);
      })
      .subscribe();

    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        currentChannel = null;
      }
    };
  }, [table, event]);

  const unsubscribe = useCallback(() => {
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
      currentChannel = null;
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