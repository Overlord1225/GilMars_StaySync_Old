-- Tracked staff operations used by the reservation workspace.
-- These RPCs enforce staff access and keep booking/payment transitions atomic.

CREATE OR REPLACE FUNCTION public.record_deposit(
  p_reservation_id uuid,
  p_method text,
  p_reference text,
  p_amount numeric DEFAULT NULL,
  p_paid_at timestamptz DEFAULT now()
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
    RAISE EXCEPTION 'Staff access is required to record a deposit' USING ERRCODE = '42501';
  END IF;
  IF p_method NOT IN ('GCash', 'Bank transfer') THEN
    RAISE EXCEPTION 'Payment method must be GCash or Bank transfer' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(BTRIM(p_reference), '') IS NULL THEN
    RAISE EXCEPTION 'A payment reference is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_reservation FROM public.reservations
  WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR v_reservation.status <> 'pending'::public.reservation_status
     OR v_reservation.source <> 'staysync'::public.reservation_source THEN
    RAISE EXCEPTION 'Only pending StaySync requests can have a deposit recorded' USING ERRCODE = '55000';
  END IF;
  IF p_amount IS NOT NULL AND p_amount <> v_reservation.deposit_amount THEN
    RAISE EXCEPTION 'The payment amount must match the configured deposit' USING ERRCODE = '23514';
  END IF;

  UPDATE public.reservations
  SET payment_method = p_method,
      payment_reference = BTRIM(p_reference),
      paid_at = COALESCE(p_paid_at, now())
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_deposit_reference(
  p_reservation_id uuid,
  p_method text,
  p_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_guest_id uuid := auth.uid();
BEGIN
  IF v_guest_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_guest_id AND role = 'guest'::public.user_role AND is_active = true
  ) THEN
    RAISE EXCEPTION 'An active guest account is required' USING ERRCODE = '42501';
  END IF;
  IF p_method NOT IN ('GCash', 'Bank transfer') OR NULLIF(BTRIM(p_reference), '') IS NULL THEN
    RAISE EXCEPTION 'Choose a payment method and enter the payment reference' USING ERRCODE = '22023';
  END IF;
  UPDATE public.reservations
  SET payment_method = p_method, payment_reference = BTRIM(p_reference)
  WHERE id = p_reservation_id
    AND guest_id = v_guest_id
    AND source = 'staysync'::public.reservation_source
    AND status = 'pending'::public.reservation_status;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only your pending StaySync request can receive a payment reference' USING ERRCODE = '42501';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_reservation(p_reservation_id uuid, p_note text DEFAULT NULL)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to reject a reservation' USING ERRCODE = '42501';
  END IF;
  UPDATE public.reservations
  SET status = 'rejected'::public.reservation_status,
      notes = CASE WHEN NULLIF(BTRIM(p_note), '') IS NULL THEN notes
        ELSE CONCAT_WS(E'\n', notes, 'Staff rejection note: ' || BTRIM(p_note)) END,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = p_reservation_id
    AND status = 'pending'::public.reservation_status
  RETURNING * INTO v_reservation;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only pending reservations can be rejected' USING ERRCODE = '55000';
  END IF;
  RETURN v_reservation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_airbnb_booking(
  p_unit_id uuid,
  p_guest_name text,
  p_check_in date,
  p_check_out date,
  p_num_guests integer DEFAULT 1,
  p_notes text DEFAULT NULL,
  p_booked_at timestamptz DEFAULT now()
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_capacity integer;
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to add an Airbnb booking' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(BTRIM(p_guest_name), '') IS NULL OR p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Guest name and a valid date range are required' USING ERRCODE = '22023';
  END IF;
  SELECT capacity INTO v_capacity FROM public.units WHERE id = p_unit_id AND is_active = true;
  IF v_capacity IS NULL OR p_num_guests < 1 OR p_num_guests > v_capacity THEN
    RAISE EXCEPTION 'Choose an active unit and a guest count within its capacity' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_unit_id::text, 0));
  INSERT INTO public.reservations (
    unit_id, guest_id, manual_guest_name, source, check_in, check_out,
    num_guests, status, notes, reviewed_by, reviewed_at, created_at
  ) VALUES (
    p_unit_id, NULL, BTRIM(p_guest_name), 'airbnb'::public.reservation_source,
    p_check_in, p_check_out, p_num_guests, 'confirmed'::public.reservation_status,
    NULLIF(BTRIM(p_notes), ''), auth.uid(), now(), COALESCE(p_booked_at, now())
  ) RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.staff_update_reservation_status(
  p_reservation_id uuid,
  p_status public.reservation_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to update a reservation' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('cancelled'::public.reservation_status, 'completed'::public.reservation_status) THEN
    RAISE EXCEPTION 'Staff may use this action only to cancel or complete a reservation' USING ERRCODE = '22023';
  END IF;
  UPDATE public.reservations SET status = p_status
  WHERE id = p_reservation_id AND status = 'confirmed'::public.reservation_status;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only confirmed reservations can be cancelled or completed' USING ERRCODE = '55000';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_deposit(uuid, text, text, numeric, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_deposit_reference(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_reservation(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_airbnb_booking(uuid, text, date, date, integer, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reschedule_reservation(uuid, date, date, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.staff_update_reservation_status(uuid, public.reservation_status) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_deposit(uuid, text, text, numeric, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_deposit_reference(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_reservation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_airbnb_booking(uuid, text, date, date, integer, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_reservation(uuid, date, date, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_reservation_status(uuid, public.reservation_status) TO authenticated;
