-- submit_deposit_reference (guest adds a GCash/bank reference) was blocked by this
-- trigger: any non-status change by a non-admin raised "Guests can only cancel".
-- Allow payment_method and payment_reference; paid_at and everything else stay
-- locked, and status may only change to cancelled. Keeps the live is_admin() gate.
CREATE OR REPLACE FUNCTION public.guard_reservation_guest_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF (to_jsonb(NEW) - 'status' - 'updated_at' - 'payment_method' - 'payment_reference') IS DISTINCT FROM
       (to_jsonb(OLD) - 'status' - 'updated_at' - 'payment_method' - 'payment_reference') THEN
      RAISE EXCEPTION 'Guests can only cancel a reservation or add a payment reference';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status <> 'cancelled'::public.reservation_status THEN
      RAISE EXCEPTION 'Guests can only set status to cancelled';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_reservation_guest_update() FROM PUBLIC, anon, authenticated;
