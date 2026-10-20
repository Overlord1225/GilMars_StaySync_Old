-- Align the profile shape with the current app, which no longer collects
-- contact numbers, and remove permissive policies found in the live schema.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS contact_number;

-- Keep the single combined policy used by the application for profile reads.
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;

-- Keep the combined owner/staff reservation read policy. Reservation writes
-- continue to go through the validated RPCs and staff-only workflow policies.
DROP POLICY IF EXISTS res_select_own ON public.reservations;
DROP POLICY IF EXISTS res_select_staff ON public.reservations;
DROP POLICY IF EXISTS reservations_select_own ON public.reservations;

-- Inquiry keywords are configuration data and must not be readable publicly.
DROP POLICY IF EXISTS inquiry_keywords_select_public ON public.inquiry_keywords;
ALTER TABLE public.inquiry_keywords ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON TABLE public.inquiry_keywords FROM anon;
GRANT SELECT ON TABLE public.inquiry_keywords TO authenticated;

-- The accuracy fixture set is for staff evaluation, not all signed-in users.
DROP POLICY IF EXISTS test_inquiries_select_authenticated ON public.test_inquiries;
DROP POLICY IF EXISTS test_inquiries_select_staff ON public.test_inquiries;
ALTER TABLE public.test_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON TABLE public.test_inquiries FROM anon;
GRANT SELECT ON TABLE public.test_inquiries TO authenticated;
CREATE POLICY test_inquiries_select_staff
  ON public.test_inquiries
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- The canonical rules_select_all policy already provides the intended public
-- read access. Remove the unrestricted duplicate for clarity.
DROP POLICY IF EXISTS booking_rules_select_public ON public.booking_rules;
