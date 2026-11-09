-- Maximum stay length and maximum booking window for guest requests.
-- Defaults: 30 nights, 365 days ahead. Staff airbnb entries and date blocks
-- are not limited. create_reservation_request is otherwise unchanged from the
-- live definition (0002).

ALTER TABLE public.booking_rules
  ADD COLUMN IF NOT EXISTS max_stay_nights integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_advance_days integer NOT NULL DEFAULT 365,
  ADD CONSTRAINT booking_rules_max_stay_nights_positive CHECK (max_stay_nights >= 1),
  ADD CONSTRAINT booking_rules_max_advance_days_positive CHECK (max_advance_days >= 1);

CREATE OR REPLACE FUNCTION public.create_reservation_request(
  p_unit_id uuid,
  p_check_in date,
  p_check_out date,
  p_num_guests integer,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_guest_id uuid := auth.uid();
  v_capacity integer;
  v_min_advance_days integer;
  v_max_stay_nights integer;
  v_max_advance_days integer;
  v_deposit_amount numeric;
  v_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
  v_earliest_check_in date;
  v_reservation_id uuid;
BEGIN
  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to request a reservation'
      USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = v_guest_id
      AND p.role = 'guest'::public.user_role
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'An active guest account is required to request a reservation'
      USING ERRCODE = '42501';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in'
      USING ERRCODE = '22007';
  END IF;

  IF p_num_guests IS NULL OR p_num_guests <= 0 THEN
    RAISE EXCEPTION 'Number of guests must be greater than zero'
      USING ERRCODE = '22023';
  END IF;

  SELECT u.capacity INTO v_capacity
  FROM public.units AS u
  WHERE u.id = p_unit_id AND u.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit is unavailable'
      USING ERRCODE = '22023';
  END IF;

  IF p_num_guests > v_capacity THEN
    RAISE EXCEPTION 'Number of guests exceeds unit capacity'
      USING ERRCODE = '22023';
  END IF;

  SELECT br.min_advance_days, br.deposit_amount, br.max_stay_nights, br.max_advance_days
  INTO v_min_advance_days, v_deposit_amount, v_max_stay_nights, v_max_advance_days
  FROM public.booking_rules AS br
  ORDER BY br.id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking rules are not configured'
      USING ERRCODE = '55000';
  END IF;

  v_earliest_check_in := v_today + GREATEST(v_min_advance_days, 1);

  IF p_check_in < v_earliest_check_in THEN
    RAISE EXCEPTION 'Check-in does not meet the minimum advance booking rule'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_in > v_today + v_max_advance_days THEN
    RAISE EXCEPTION 'Check-in is beyond the maximum booking window'
      USING ERRCODE = '22023';
  END IF;

  IF (p_check_out - p_check_in) > v_max_stay_nights THEN
    RAISE EXCEPTION 'The stay is longer than the maximum number of nights'
      USING ERRCODE = '22023';
  END IF;

  IF NOT public.check_availability(p_unit_id, p_check_in, p_check_out) THEN
    RAISE EXCEPTION 'The requested dates are unavailable'
      USING ERRCODE = '23P01';
  END IF;

  INSERT INTO public.reservations (
    unit_id,
    guest_id,
    source,
    check_in,
    check_out,
    num_guests,
    status,
    notes,
    deposit_amount
  )
  VALUES (
    p_unit_id,
    v_guest_id,
    'staysync'::public.reservation_source,
    p_check_in,
    p_check_out,
    p_num_guests,
    'pending'::public.reservation_status,
    NULLIF(BTRIM(p_notes), ''),
    v_deposit_amount
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$function$;
