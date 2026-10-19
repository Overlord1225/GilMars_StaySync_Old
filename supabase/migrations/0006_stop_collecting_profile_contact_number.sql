-- Stop copying contact numbers into new profiles while preserving existing values.
-- The application no longer collects or displays this field.
-- Existing values stay intact and clients can no longer update the legacy column.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
      'Guest'
    ),
    'guest'::public.user_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE UPDATE (contact_number) ON public.profiles FROM authenticated;
