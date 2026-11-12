-- Retention: clear a guest's personal details 30 days after their last check-out.
-- Kept: the account email, and the stay record (dates, unit, source, status).
-- A guest is purged only if they have at least one reservation and every
-- reservation checked out 30+ days ago (check-out is exclusive, Asia/Manila).
-- Idempotent: already-cleared rows are skipped. Returns the number of guests purged.

-- Let the purge (runs as the function owner, never as a PostgREST role) update
-- inquiry text. Same pattern as prevent_profile_privilege_escalation (0015).
CREATE OR REPLACE FUNCTION public.guard_staff_inquiry_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Staff access is required to update an inquiry'
      USING ERRCODE = '42501';
  END IF;

  IF (TO_JSONB(NEW) - ARRAY[
        'category', 'status', 'category_source', 'corrected_by',
        'corrected_at', 'updated_at'
      ]::text[])
     IS DISTINCT FROM
     (TO_JSONB(OLD) - ARRAY[
        'category', 'status', 'category_source', 'corrected_by',
        'corrected_at', 'updated_at'
      ]::text[]) THEN
    RAISE EXCEPTION 'Staff may only update inquiry category and status'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.category IS DISTINCT FROM OLD.category THEN
    NEW.category_source := 'admin'::public.category_source;
    NEW.corrected_by := auth.uid();
    NEW.corrected_at := now();
  ELSIF NEW.category_source IS DISTINCT FROM OLD.category_source
     OR NEW.corrected_by IS DISTINCT FROM OLD.corrected_by
     OR NEW.corrected_at IS DISTINCT FROM OLD.corrected_at THEN
    RAISE EXCEPTION 'Inquiry correction metadata can only change with category'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_guest_personal_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_cutoff date := public.manila_today() - 30;
  v_ids uuid[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(p.id), ARRAY[]::uuid[]) INTO v_ids
  FROM public.profiles AS p
  WHERE p.role = 'guest'::public.user_role
    AND p.full_name <> 'Former guest'
    AND EXISTS (SELECT 1 FROM public.reservations AS r WHERE r.guest_id = p.id)
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations AS r
      WHERE r.guest_id = p.id AND r.check_out > v_cutoff
    );

  UPDATE public.profiles SET full_name = 'Former guest' WHERE id = ANY (v_ids);

  -- "[removed]" (not NULL): confirmed StaySync rows must keep a payment reference.
  UPDATE public.reservations
  SET notes = NULL,
      payment_reference = CASE WHEN payment_reference IS NULL THEN NULL ELSE '[removed]' END
  WHERE guest_id = ANY (v_ids)
    AND (notes IS NOT NULL OR payment_reference IS DISTINCT FROM '[removed]');

  -- Airbnb entries have no guest account; clear the typed-in name on the same schedule.
  UPDATE public.reservations
  SET manual_guest_name = 'Former guest',
      notes = NULL
  WHERE guest_id IS NULL
    AND check_out <= v_cutoff
    AND (manual_guest_name IS DISTINCT FROM 'Former guest' OR notes IS NOT NULL);

  UPDATE public.reservation_staff_notes AS n
  SET note = '[removed]'
  FROM public.reservations AS r
  WHERE n.reservation_id = r.id
    AND (r.guest_id = ANY (v_ids) OR (r.guest_id IS NULL AND r.check_out <= v_cutoff))
    AND n.note <> '[removed]';

  UPDATE public.inquiry_replies AS ir
  SET message = '[removed]'
  FROM public.inquiries AS i
  WHERE ir.inquiry_id = i.id AND i.guest_id = ANY (v_ids) AND ir.message <> '[removed]';

  UPDATE public.inquiries
  SET message = '[removed]', subject = NULL
  WHERE guest_id = ANY (v_ids) AND (message <> '[removed]' OR subject IS NOT NULL);

  UPDATE public.guest_preferences SET arrival_note = NULL
  WHERE guest_id = ANY (v_ids) AND arrival_note IS NOT NULL;

  UPDATE public.account_deletion_requests SET reason = NULL
  WHERE guest_id = ANY (v_ids) AND reason IS NOT NULL;

  RETURN COALESCE(ARRAY_LENGTH(v_ids, 1), 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_guest_personal_data() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 03:00 Asia/Manila = 19:00 UTC. Same job name replaces the schedule.
SELECT cron.schedule(
  'purge-guest-personal-data',
  '0 19 * * *',
  $$SELECT public.purge_guest_personal_data()$$
);
