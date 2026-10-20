-- StaySync hardening migration (consolidates remaining Part A items)
-- A-pre item 2: Recreate guest reservation insert/cancel policies
--   (dropped in 0009 but never recreated, leaving guests unable to request
--    or cancel their own reservations via direct table access)
-- A3: Guard guest reservation updates so guests can only cancel their own
--   pending reservations (no trigger existed for this)
-- A8: Seed booking_rules row (referenced by A4 validation and frontend)

-- ---------------------------------------------------------------------------
-- A-pre item 2: Recreate guest reservation policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS res_insert_guest ON public.reservations;
CREATE POLICY res_insert_guest ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid() AND status = 'pending' AND source = 'staysync');

DROP POLICY IF EXISTS res_cancel_own ON public.reservations;
CREATE POLICY res_cancel_own ON public.reservations
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid() AND status = 'pending')
  WITH CHECK (guest_id = auth.uid() AND status = 'cancelled');

-- ---------------------------------------------------------------------------
-- A3: Guard guest reservation updates
--   Guests may only change status (to cancelled) on their own pending rows.
--   All other columns are locked for non-staff users.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_reservation_guest_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_staff() THEN
    -- Guests can only change status and updated_at; every other column is locked
    IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM
       (to_jsonb(OLD) - 'status' - 'updated_at') THEN
      RAISE EXCEPTION 'Guests can only cancel a reservation';
    END IF;

    -- Guests can only set status to cancelled
    IF NEW.status <> 'cancelled'::public.reservation_status THEN
      RAISE EXCEPTION 'Guests can only set status to cancelled';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_reservation_guest_update ON public.reservations;
CREATE TRIGGER trg_guard_reservation_guest_update
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_guest_update();

-- ---------------------------------------------------------------------------
-- A8: Seed booking_rules (single row, id = true)
--   min_advance_days = 1 (no same-day booking)
--   deposit_amount = 1500 (PHP 1,500 deposit by GCash or bank transfer)
-- ---------------------------------------------------------------------------

INSERT INTO public.booking_rules (id, min_advance_days, deposit_amount, updated_at)
VALUES (true, 1, 1500, now())
ON CONFLICT (id) DO UPDATE
SET min_advance_days = EXCLUDED.min_advance_days,
    deposit_amount = EXCLUDED.deposit_amount,
    updated_at = now();