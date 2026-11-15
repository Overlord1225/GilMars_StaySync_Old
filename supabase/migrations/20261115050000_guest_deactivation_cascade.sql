-- Deactivating a guest now also:
--   * rejects their pending reservations and cancels their confirmed ones that
--     have not ended yet (check_out >= today, Asia/Manila). Past and completed
--     stays are untouched.
--   * blocks them from sending inquiries.
-- Reservations were already blocked for inactive guests in create_reservation_request.
-- Reactivation does not restore anything; the guest must book again.

CREATE OR REPLACE FUNCTION public.is_active_guest()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role = 'guest'::public.user_role
      AND p.is_active = true
  );
$function$;

REVOKE ALL ON FUNCTION public.is_active_guest() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_guest() TO authenticated;

DROP POLICY IF EXISTS inquiries_insert_owner_or_staff ON public.inquiries;
CREATE POLICY inquiries_insert_owner_or_staff ON public.inquiries
  FOR INSERT TO authenticated
  WITH CHECK (
    (guest_id = auth.uid() AND public.is_active_guest())
    OR public.is_admin()
  );

CREATE OR REPLACE FUNCTION public.close_reservations_on_guest_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
  v_note text := 'Closed automatically: guest account deactivated.';
BEGIN
  IF OLD.is_active AND NOT NEW.is_active AND NEW.role = 'guest'::public.user_role THEN
    UPDATE public.reservations
    SET status = CASE status
          WHEN 'pending'::public.reservation_status THEN 'rejected'::public.reservation_status
          ELSE 'cancelled'::public.reservation_status
        END,
        notes = CONCAT_WS(E'\n', notes, v_note)
    WHERE guest_id = NEW.id
      AND status IN ('pending'::public.reservation_status, 'confirmed'::public.reservation_status)
      AND check_out >= v_today;
  END IF;
  RETURN NEW;
END;
$function$;

-- AFTER trigger: runs only once the update (and its authorization checks) succeeded.
DROP TRIGGER IF EXISTS profiles_close_reservations_on_deactivation ON public.profiles;
CREATE TRIGGER profiles_close_reservations_on_deactivation
  AFTER UPDATE OF is_active ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.close_reservations_on_guest_deactivation();
