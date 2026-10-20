-- Staff may deactivate/reactivate guest profiles without changing roles.
-- The existing profiles_update_staff_guests policy still limits staff updates
-- to rows whose role is guest before and after the update.

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_super_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only a super admin can change profile roles'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.is_active IS DISTINCT FROM OLD.is_active
       AND NOT (
         public.is_staff()
         AND OLD.role = 'guest'::public.user_role
         AND NEW.role = 'guest'::public.user_role
       ) THEN
      RAISE EXCEPTION 'Only staff can change guest account status'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS profiles_update_staff_guests ON public.profiles;
CREATE POLICY profiles_update_staff_guests
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_staff() AND role = 'guest'::public.user_role)
  WITH CHECK (role = 'guest'::public.user_role);
