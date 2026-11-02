-- Restore the unit, profile, booking rule and keyword policies the app needs,
-- remove direct reservation inserts, and narrow table grants. The live schema
-- has drifted from the migrations, so every policy is dropped before creation.

-- ---------------------------------------------------------------------------
-- Units
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS units_select_visible ON public.units;
CREATE POLICY units_select_visible ON public.units
  FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_staff());

DROP POLICY IF EXISTS units_insert_staff ON public.units;
CREATE POLICY units_insert_staff ON public.units
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS units_update_staff ON public.units;
CREATE POLICY units_update_staff ON public.units
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS units_delete_staff ON public.units;
CREATE POLICY units_delete_staff ON public.units
  FOR DELETE TO authenticated
  USING (public.is_staff());

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select_own_or_staff ON public.profiles;
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_super_admin ON public.profiles;
CREATE POLICY profiles_update_super_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- The create-staff Edge Function sets role = 'admin' with the service-role
-- client. auth.uid() is null there, so is_super_admin() is false and the update
-- would fail. This function is not SECURITY DEFINER, so current_user is the API
-- role and clients cannot spoof it.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF current_user <> 'service_role' THEN
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
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Booking rules and inquiry keywords
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rules_select_all ON public.booking_rules;
CREATE POLICY rules_select_all ON public.booking_rules
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS rules_update_super_admin ON public.booking_rules;
CREATE POLICY rules_update_super_admin ON public.booking_rules
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS keywords_select_staff ON public.inquiry_keywords;
CREATE POLICY keywords_select_staff ON public.inquiry_keywords
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS keywords_insert_super_admin ON public.inquiry_keywords;
CREATE POLICY keywords_insert_super_admin ON public.inquiry_keywords
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS keywords_update_super_admin ON public.inquiry_keywords;
CREATE POLICY keywords_update_super_admin ON public.inquiry_keywords
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

GRANT SELECT ON public.booking_rules TO anon, authenticated;
GRANT UPDATE ON public.booking_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inquiry_keywords TO authenticated;

-- ---------------------------------------------------------------------------
-- Reservations: writes go through validated RPCs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS res_insert_guest ON public.reservations;

-- ---------------------------------------------------------------------------
-- Narrow table grants
-- ---------------------------------------------------------------------------

REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON public.units, public.reservations, public.inquiries
  FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON public.units, public.reservations, public.inquiries
  FROM anon;

REVOKE SELECT ON public.reservations, public.inquiries FROM anon;

REVOKE DELETE ON public.reservations, public.inquiries FROM authenticated;

REVOKE INSERT ON public.reservations FROM authenticated;
