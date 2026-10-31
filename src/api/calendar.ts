import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUnitById } from "@/lib/db";
import {
  addMonths,
  buildCalendarDays,
  mapCalendarRow,
  type CalendarDay,
  type CalendarReservation,
} from "@/lib/calendar";
import type { Unit } from "@/lib/types";

export type CalendarMonthRow = {
  id: string;
  unit_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  source: "staysync" | "airbnb";
  guest_id: string | null;
  guest_display_name: string;
  manual_guest_name: string | null;
  notes: string | null;
  deposit_amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
};

export async function getCalendarMonth(
  unitId: string,
  month: string,
): Promise<CalendarMonthRow[]> {
  const { data, error } = await supabase.rpc("get_calendar_month", {
    p_unit_id: unitId,
    p_month: month,
  });
  if (error) throw error;
  return data ?? [];
}

export type UseCalendarMonthResult = {
  unit: Unit | null;
  year: number;
  month: number;
  days: CalendarDay[];
  reservations: CalendarReservation[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  nextMonth: () => { year: number; month: number };
  prevMonth: () => { year: number; month: number };
};

export function useCalendarMonth(options: {
  unitId: string | null;
  year: number;
  month: number;
}): UseCalendarMonthResult {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { unitId, year, month } = options;
    if (!unitId) {
      setDays([]);
      setReservations([]);
      setUnit(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const [rows, unitRow] = await Promise.all([
        getCalendarMonth(unitId, monthStart),
        getUnitById(unitId),
      ]);
      setDays(buildCalendarDays(year, month, rows));
      setReservations(rows.map(mapCalendarRow));
      setUnit(unitRow ?? null);
    } catch {
      setError(
        "We could not load the calendar. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [options.unitId, options.year, options.month]);

  useEffect(() => {
    void load();
  }, [load]);

  const nextMonth = useCallback(() => {
    const next = addMonths(
      `${options.year}-${String(options.month).padStart(2, "0")}-01`,
      1,
    );
    return { year: Number(next.slice(0, 4)), month: Number(next.slice(5, 7)) };
  }, [options.year, options.month]);

  const prevMonth = useCallback(() => {
    const prev = addMonths(
      `${options.year}-${String(options.month).padStart(2, "0")}-01`,
      -1,
    );
    return { year: Number(prev.slice(0, 4)), month: Number(prev.slice(5, 7)) };
  }, [options.year, options.month]);

  return {
    unit,
    year: options.year,
    month: options.month,
    days,
    reservations,
    loading,
    error,
    refetch: load,
    nextMonth,
    prevMonth,
  };
}
