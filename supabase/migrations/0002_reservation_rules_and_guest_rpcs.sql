-- Restrict guest reservation writes to reviewed RPCs and enforce booking rules.
-- The confirmed-date exclusion constraint is deliberately a separate migration;
-- apply it only after the verified overlap query returns no rows.

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE check_out <= check_in
  ) THEN
    RAISE EXCEPTION 'Cannot add reservation date check: check_out <= check_in rows exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE num_guests <= 0
  ) THEN
    RAISE EXCEPTION 'Cannot add reservation guest check: num_guests <= 0 rows exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE guest_id IS NULL AND NULLIF(BTRIM(manual_guest_name), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add reservation guest identity check: guest and manual guest name are both missing';
  END IF;
END;
$preflight$;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND conname = 'reservations_check_out_after_check_in'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT reservations_check_out_after_check_in
      CHECK (check_out > check_in);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND conname = 'reservations_num_guests_positive'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT reservations_num_guests_positive
      CHECK (num_guests > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND conname = 'reservations_guest_identity_present'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT reservations_guest_identity_present
      CHECK (guest_id IS NOT NULL OR NULLIF(BTRIM(manual_guest_name), '') IS NOT NULL);
  END IF;
END;
$constraints$;

CREATE INDEX IF NOT EXISTS reservations_unit_dates_idx
  ON public.reservations (unit_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS reservations_guest_id_idx
  ON public.reservations (guest_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx
  ON public.reservations (status);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_booked_ranges(
  p_unit_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (check_in date, check_out date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT r.check_in, r.check_out
  FROM public.reservations AS r
  WHERE p_from < p_to
    AND r.unit_id = p_unit_id
    AND r.status = 'confirmed'::public.reservation_status
    AND r.check_in < p_to
    AND r.check_out > p_from;
$function$;

CREATE OR REPLACE FUNCTION public.check_availability(
  p_unit_id uuid,
  p_check_in date,
  p_check_out date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT p_check_in < p_check_out
    AND EXISTS (
      SELECT 1 FROM public.units AS u
      WHERE u.id = p_unit_id AND u.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.get_booked_ranges(p_unit_id, p_check_in, p_check_out)
    );
$function$;

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
  v_deposit_amount numeric;
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

  SELECT br.min_advance_days, br.deposit_amount
  INTO v_min_advance_days, v_deposit_amount
  FROM public.booking_rules AS br
  ORDER BY br.id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking rules are not configured'
      USING ERRCODE = '55000';
  END IF;

  v_earliest_check_in :=
    (now() AT TIME ZONE 'Asia/Manila')::date
    + GREATEST(v_min_advance_days, 1);

  IF p_check_in < v_earliest_check_in THEN
    RAISE EXCEPTION 'Check-in does not meet the minimum advance booking rule'
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

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_guest_id uuid := auth.uid();
BEGIN
  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to cancel a reservation'
      USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = v_guest_id
      AND p.role = 'guest'::public.user_role
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'An active guest account is required to cancel a reservation'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled'::public.reservation_status
  WHERE id = p_reservation_id
    AND guest_id = v_guest_id
    AND status = 'pending'::public.reservation_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the owner can cancel a pending reservation'
      USING ERRCODE = '42501';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_reservation(p_reservation_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to confirm a reservation'
      USING ERRCODE = '42501';
  END IF;

  SELECT r.* INTO v_reservation
  FROM public.reservations AS r
  WHERE r.id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_reservation.status <> 'pending'::public.reservation_status THEN
    RAISE EXCEPTION 'Only pending reservations can be confirmed'
      USING ERRCODE = '55000';
  END IF;

  IF v_reservation.source = 'staysync'::public.reservation_source
     AND (v_reservation.paid_at IS NULL
          OR NULLIF(BTRIM(v_reservation.payment_reference), '') IS NULL) THEN
    RAISE EXCEPTION 'Paid date and payment reference are required for StaySync reservations'
      USING ERRCODE = '23514';
  END IF;

  -- Serialize confirmations per unit so the overlap check remains safe even
  -- before the exclusion-constraint migration has been applied.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_reservation.unit_id::text, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.reservations AS r
    WHERE r.unit_id = v_reservation.unit_id
      AND r.id <> v_reservation.id
      AND r.status = 'confirmed'::public.reservation_status
      AND daterange(r.check_in, r.check_out, '[)')
          && daterange(v_reservation.check_in, v_reservation.check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'The reservation dates overlap an existing confirmed reservation'
      USING ERRCODE = '23P01';
  END IF;

  UPDATE public.reservations
  SET status = 'confirmed'::public.reservation_status,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = v_reservation.id
  RETURNING * INTO v_reservation;

  RETURN v_reservation;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_booked_ranges(uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_availability(uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_reservation_request(uuid, date, date, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_reservation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_reservation(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_booked_ranges(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation_request(uuid, date, date, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reservation(uuid) TO authenticated;

-- Staff retain their existing direct-write policy for manual Airbnb records,
-- but every transition to confirmed must still satisfy payment and audit rules.
CREATE OR REPLACE FUNCTION public.guard_reservation_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_confirming_now boolean;
  v_payment_fields_changed boolean;
BEGIN
  IF NEW.status = 'confirmed'::public.reservation_status THEN
    IF TG_OP = 'INSERT' THEN
      v_confirming_now := true;
      v_payment_fields_changed := true;
    ELSE
      v_confirming_now := OLD.status IS DISTINCT FROM NEW.status;
      v_payment_fields_changed :=
        OLD.paid_at IS DISTINCT FROM NEW.paid_at
        OR OLD.payment_reference IS DISTINCT FROM NEW.payment_reference;
    END IF;

    IF NEW.source = 'staysync'::public.reservation_source
       AND (v_confirming_now OR v_payment_fields_changed)
       AND (NEW.paid_at IS NULL
            OR NULLIF(BTRIM(NEW.payment_reference), '') IS NULL) THEN
      RAISE EXCEPTION 'Paid date and payment reference are required for StaySync reservations'
        USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF OLD.status = 'confirmed'::public.reservation_status THEN
        NEW.reviewed_by := OLD.reviewed_by;
        NEW.reviewed_at := OLD.reviewed_at;
      ELSE
        IF auth.uid() IS NULL THEN
          RAISE EXCEPTION 'An authenticated staff member must confirm the reservation'
            USING ERRCODE = '42501';
        END IF;
        NEW.reviewed_by := auth.uid();
        NEW.reviewed_at := now();
      END IF;
    ELSE
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'An authenticated staff member must confirm the reservation'
          USING ERRCODE = '42501';
      END IF;
      NEW.reviewed_by := auth.uid();
      NEW.reviewed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS reservations_confirmation_guard ON public.reservations;
CREATE TRIGGER reservations_confirmation_guard
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_reservation_confirmation();

-- Remove permissive guest write paths, including duplicate policies discovered
-- in the verification output. Staff retain res_staff_write for manual Airbnb entry.
DROP POLICY IF EXISTS res_insert_guest ON public.reservations;
DROP POLICY IF EXISTS reservations_insert_own_or_staff ON public.reservations;
DROP POLICY IF EXISTS res_cancel_own ON public.reservations;
DROP POLICY IF EXISTS reservations_update_own_or_staff ON public.reservations;

DROP POLICY IF EXISTS res_select_own ON public.reservations;
DROP POLICY IF EXISTS res_select_staff ON public.reservations;
DROP POLICY IF EXISTS reservations_select_own_or_staff ON public.reservations;
CREATE POLICY reservations_select_owner_or_staff
  ON public.reservations FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR public.is_staff());
