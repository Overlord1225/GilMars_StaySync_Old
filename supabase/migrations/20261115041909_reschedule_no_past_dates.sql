-- Emergency reschedule must not move a stay into the past.
-- Staff may still pick today (Asia/Manila) because the tool exists for emergencies;
-- the guest-facing minimum-advance rule does not apply here.
-- CREATE OR REPLACE keeps the existing grants.

CREATE OR REPLACE FUNCTION public.reschedule_reservation(
  p_reservation_id uuid,
  p_new_check_in date,
  p_new_check_out date,
  p_new_unit_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_reservation public.reservations%ROWTYPE;
  v_unit_id uuid;
  v_capacity integer;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to reschedule a reservation' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(BTRIM(p_reason), '') IS NULL OR p_new_check_out <= p_new_check_in THEN
    RAISE EXCEPTION 'A reason and valid new dates are required' USING ERRCODE = '22023';
  END IF;
  IF p_new_check_in < (now() AT TIME ZONE 'Asia/Manila')::date THEN
    RAISE EXCEPTION 'New check-in cannot be in the past' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_reservation FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR v_reservation.status <> 'confirmed'::public.reservation_status THEN
    RAISE EXCEPTION 'Only confirmed reservations can be rescheduled' USING ERRCODE = '55000';
  END IF;
  v_unit_id := COALESCE(p_new_unit_id, v_reservation.unit_id);
  SELECT capacity INTO v_capacity FROM public.units WHERE id = v_unit_id AND is_active = true;
  IF v_capacity IS NULL OR v_reservation.num_guests > v_capacity THEN
    RAISE EXCEPTION 'The destination unit is unavailable or too small' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_unit_id::text, 0));

  UPDATE public.reservations
  SET unit_id = v_unit_id,
      check_in = p_new_check_in,
      check_out = p_new_check_out,
      rescheduled_at = now(),
      notes = CONCAT_WS(E'\n', notes, 'Emergency reschedule: ' || BTRIM(p_reason))
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$function$;
