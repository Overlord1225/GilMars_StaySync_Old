-- Security hardening follow-up to 0016.
-- 1. confirm_reservation was missed by 0016: super admins could still confirm.
-- 2. unit-images bucket: cap size and restrict MIME types.
-- 3. get_calendar_month: pin pg_temp in search_path like the other functions.

DO $patch$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO STRICT def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'confirm_reservation';

  IF position('public.is_staff()' IN def) = 0 THEN
    RAISE EXCEPTION 'public.confirm_reservation has no is_staff() check to replace';
  END IF;
  EXECUTE replace(def, 'public.is_staff()', 'public.is_admin()');
END
$patch$;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'unit-images';

ALTER FUNCTION public.get_calendar_month(uuid, date)
  SET search_path = public, pg_temp;
