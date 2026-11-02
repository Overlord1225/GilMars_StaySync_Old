-- Super admin only manages accounts (guests and admins) and views dashboard
-- data. Day-to-day writes (reservations, inquiries, units, booking rules,
-- keywords) belong to admins. Reads stay on is_staff() so the super admin
-- dashboard works, and audit_log / guest-profile policies are unchanged.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active);
$$;

-- Booking rules and keywords
DROP POLICY IF EXISTS rules_update_super_admin ON public.booking_rules;
DROP POLICY IF EXISTS rules_update_admin ON public.booking_rules;
CREATE POLICY rules_update_admin ON public.booking_rules
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS keywords_insert_super_admin ON public.inquiry_keywords;
DROP POLICY IF EXISTS keywords_insert_admin ON public.inquiry_keywords;
CREATE POLICY keywords_insert_admin ON public.inquiry_keywords
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS keywords_update_super_admin ON public.inquiry_keywords;
DROP POLICY IF EXISTS keywords_update_admin ON public.inquiry_keywords;
CREATE POLICY keywords_update_admin ON public.inquiry_keywords
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Units
DROP POLICY IF EXISTS units_insert_staff ON public.units;
CREATE POLICY units_insert_staff ON public.units
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS units_update_staff ON public.units;
CREATE POLICY units_update_staff ON public.units
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS units_delete_staff ON public.units;
CREATE POLICY units_delete_staff ON public.units
  FOR DELETE TO authenticated USING (public.is_admin());

-- Inquiries (select stays owner-or-staff)
DROP POLICY IF EXISTS inquiries_insert_owner_or_staff ON public.inquiries;
CREATE POLICY inquiries_insert_owner_or_staff ON public.inquiries
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS inquiries_update_staff_only ON public.inquiries;
CREATE POLICY inquiries_update_staff_only ON public.inquiries
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Unit image uploads
DROP POLICY IF EXISTS unit_images_staff_write ON storage.objects;
CREATE POLICY unit_images_staff_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'unit-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'unit-images' AND public.is_admin());

-- Write functions: swap the is_staff() gate for is_admin(). The live
-- definition is patched in place so signatures, SECURITY DEFINER and
-- search_path stay exactly as deployed.
DO $patch$
DECLARE
  fn text;
  def text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'record_deposit', 'reject_reservation', 'add_airbnb_booking',
    'reschedule_reservation', 'staff_update_reservation_status',
    'guard_staff_inquiry_update', 'guard_reservation_guest_update'
  ] LOOP
    SELECT pg_get_functiondef(p.oid) INTO STRICT def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = fn;

    IF position('public.is_staff()' IN def) = 0 THEN
      RAISE EXCEPTION 'public.% has no is_staff() check to replace', fn;
    END IF;
    EXECUTE replace(def, 'public.is_staff()', 'public.is_admin()');
  END LOOP;
END
$patch$;
