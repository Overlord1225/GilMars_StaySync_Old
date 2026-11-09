-- Auto-expire stale pending StaySync requests. Pending requests never block
-- dates, so this only tidies the list. A request that already has a payment
-- reference is waiting on staff to verify it, so it never expires.
-- Staff trigger it on read via expire_stale_requests(); no cron needed.

ALTER TABLE public.booking_rules
  ADD COLUMN IF NOT EXISTS pending_expiry_hours integer NOT NULL DEFAULT 48,
  ADD CONSTRAINT booking_rules_pending_expiry_hours_positive
    CHECK (pending_expiry_hours >= 1);

CREATE OR REPLACE FUNCTION public.expire_stale_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_hours integer;
  v_count integer;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to expire requests' USING ERRCODE = '42501';
  END IF;

  SELECT pending_expiry_hours INTO v_hours FROM public.booking_rules WHERE id = true;
  IF v_hours IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled'::public.reservation_status,
      notes = CONCAT_WS(
        E'\n', notes,
        'Expired automatically: no payment reference within ' || v_hours || ' hours.'
      )
  WHERE status = 'pending'::public.reservation_status
    AND source = 'staysync'::public.reservation_source
    AND paid_at IS NULL
    AND NULLIF(BTRIM(payment_reference), '') IS NULL
    AND created_at < now() - make_interval(hours => v_hours);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_stale_requests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_requests() TO authenticated;
