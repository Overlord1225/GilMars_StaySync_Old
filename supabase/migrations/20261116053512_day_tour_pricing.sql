-- Day tours: a same-day visit (no overnight stay) with its own price tiers.
--
-- A day tour is stored as a one-night half-open range [D, D+1), so it blocks the whole
-- date and the existing reservations_no_confirmed_overlap exclusion constraint already
-- stops it from overlapping a confirmed stay. A stay checking out on D does not clash
-- (check-out is exclusive). Same booking rules, down payment and expiry as overnight.
--
-- Units get optional day-tour prices (NULL day_tour_price = day tours not offered).
-- Tiers mirror the overnight ones: 1-2 guests, 3 guests, 4 guests, then a fee per guest above 4.

ALTER TABLE public.units
  ADD COLUMN day_tour_price numeric CHECK (day_tour_price IS NULL OR day_tour_price >= 0),
  ADD COLUMN day_tour_price_3_guests numeric CHECK (day_tour_price_3_guests IS NULL OR day_tour_price_3_guests >= 0),
  ADD COLUMN day_tour_price_4_guests numeric CHECK (day_tour_price_4_guests IS NULL OR day_tour_price_4_guests >= 0),
  ADD COLUMN day_tour_extra_guest_fee numeric CHECK (day_tour_extra_guest_fee IS NULL OR day_tour_extra_guest_fee >= 0);

ALTER TABLE public.reservations
  ADD COLUMN stay_type text NOT NULL DEFAULT 'overnight',
  ADD CONSTRAINT reservations_stay_type_valid CHECK (stay_type IN ('overnight', 'day_tour')),
  ADD CONSTRAINT reservations_day_tour_one_day CHECK (stay_type = 'overnight' OR check_out = check_in + 1);

-- GilMars day-tour rates, applied to every existing unit (the demo units mirror the real ones).
UPDATE public.units
SET day_tour_price = 1599,
    day_tour_price_3_guests = 2099,
    day_tour_price_4_guests = 2599,
    day_tour_extra_guest_fee = 300;

-- Replace the RPC with a version that takes the stay type. The old 5-argument signature is
-- dropped so calls with five arguments resolve to the new function (stay type defaults to overnight).
DROP FUNCTION public.create_reservation_request(uuid, date, date, integer, text);

CREATE FUNCTION public.create_reservation_request(
  p_unit_id uuid,
  p_check_in date,
  p_check_out date,
  p_num_guests integer,
  p_notes text DEFAULT NULL,
  p_stay_type text DEFAULT 'overnight'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_guest_id uuid := auth.uid();
  v_capacity integer;
  v_day_tour_price numeric;
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

  IF p_stay_type IS NULL OR p_stay_type NOT IN ('overnight', 'day_tour') THEN
    RAISE EXCEPTION 'Stay type must be overnight or day_tour'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in'
      USING ERRCODE = '22007';
  END IF;

  IF p_stay_type = 'day_tour' AND p_check_out <> p_check_in + 1 THEN
    RAISE EXCEPTION 'A day tour covers a single day'
      USING ERRCODE = '22023';
  END IF;

  IF p_num_guests IS NULL OR p_num_guests <= 0 THEN
    RAISE EXCEPTION 'Number of guests must be greater than zero'
      USING ERRCODE = '22023';
  END IF;

  SELECT u.capacity, u.day_tour_price INTO v_capacity, v_day_tour_price
  FROM public.units AS u
  WHERE u.id = p_unit_id AND u.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit is unavailable'
      USING ERRCODE = '22023';
  END IF;

  IF p_stay_type = 'day_tour' AND v_day_tour_price IS NULL THEN
    RAISE EXCEPTION 'Day tours are not offered for this unit'
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
    deposit_amount,
    stay_type
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
    v_deposit_amount,
    p_stay_type
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_reservation_request(uuid, date, date, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation_request(uuid, date, date, integer, text, text) TO authenticated;

-- The staff calendar needs the stay type to price and label day tours. The return type
-- changes, so the function is dropped and recreated (same body plus stay_type).
DROP FUNCTION public.get_calendar_month(uuid, date);

CREATE FUNCTION public.get_calendar_month(
  p_unit_id uuid,
  p_month date
)
RETURNS TABLE (
  id uuid,
  unit_id uuid,
  check_in date,
  check_out date,
  num_guests integer,
  status public.reservation_status,
  source public.reservation_source,
  guest_id uuid,
  guest_display_name text,
  manual_guest_name text,
  notes text,
  deposit_amount numeric,
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  stay_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to view the calendar'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.unit_id,
    r.check_in,
    r.check_out,
    r.num_guests,
    r.status,
    r.source,
    r.guest_id,
    COALESCE(p.full_name, r.manual_guest_name) AS guest_display_name,
    r.manual_guest_name,
    r.notes,
    r.deposit_amount,
    r.payment_method,
    r.payment_reference,
    r.paid_at,
    r.stay_type
  FROM public.reservations AS r
  LEFT JOIN public.profiles AS p ON p.id = r.guest_id
  WHERE r.unit_id = p_unit_id
    AND r.status <> 'rejected'::public.reservation_status
    AND r.status <> 'cancelled'::public.reservation_status
    AND r.check_in < (date_trunc('month', p_month) + interval '1 month')::date
    AND r.check_out > date_trunc('month', p_month)::date;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_calendar_month(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_calendar_month(uuid, date) TO authenticated;
