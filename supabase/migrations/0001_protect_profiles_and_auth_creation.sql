-- Protect privileged profile fields and make auth-user profile creation explicit.
-- Verified preconditions: public.is_super_admin() exists; auth.users currently uses
-- on_auth_user_created -> public.handle_new_user().

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.is_active IS DISTINCT FROM OLD.is_active)
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only a super admin can change profile role or active status'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- The existing trigger already ignores user-provided role metadata. Recreate it
-- with a pinned search_path and explicit guest/active defaults for clarity.
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
    contact_number,
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
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'contact_number'), ''),
    'guest'::public.user_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
