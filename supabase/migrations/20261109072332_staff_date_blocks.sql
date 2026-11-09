-- Staff date blocks (maintenance, owner stay): a confirmed reservation with
-- source 'block'. The existing exclusion constraint, get_booked_ranges,
-- check_availability and get_calendar_month then treat it like any stay.
-- The reason is stored in manual_guest_name. A block is released with
-- staff_update_reservation_status(id, 'cancelled').

ALTER TYPE public.reservation_source ADD VALUE IF NOT EXISTS 'block';

CREATE OR REPLACE FUNCTION public.add_date_block(
  p_unit_id uuid,
  p_reason text,
  p_start date,
  p_end date
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to block dates' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(BTRIM(p_reason), '') IS NULL OR p_end <= p_start THEN
    RAISE EXCEPTION 'A reason and a valid date range are required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.units WHERE id = p_unit_id AND is_active = true) THEN
    RAISE EXCEPTION 'Choose an active unit' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_unit_id::text, 0));
  INSERT INTO public.reservations (
    unit_id, guest_id, manual_guest_name, source, check_in, check_out,
    num_guests, status, reviewed_by, reviewed_at
  ) VALUES (
    p_unit_id, NULL, BTRIM(p_reason), 'block'::public.reservation_source,
    p_start, p_end, 1, 'confirmed'::public.reservation_status, auth.uid(), now()
  ) RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$function$;

REVOKE ALL ON FUNCTION public.add_date_block(uuid, text, date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_date_block(uuid, text, date, date) TO authenticated;
