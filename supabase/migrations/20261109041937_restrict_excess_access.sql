-- Remove privileges the app never uses. RLS stays as the second layer.

-- inquiry_replies was created after the blanket revoke in 20261104101151, so it
-- kept Supabase's default ALL grants (TRUNCATE ignores RLS).
REVOKE ALL ON public.inquiry_replies FROM anon, authenticated;
GRANT SELECT, INSERT ON public.inquiry_replies TO authenticated;

-- View of live stats; the app never queries it.
REVOKE ALL ON public.live_categorization_stats FROM anon, authenticated;

-- Default grants with no matching RLS policy.
REVOKE DELETE ON public.inquiry_keywords FROM authenticated;
REVOKE INSERT, DELETE ON public.booking_rules FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.test_inquiries FROM authenticated;

-- Guests cancel through cancel_reservation (SECURITY DEFINER), staff through RPCs.
REVOKE UPDATE ON public.reservations FROM authenticated;
DROP POLICY IF EXISTS res_cancel_own ON public.reservations;

-- Role helpers are only needed inside RLS policies. anon keeps is_staff()
-- because units_select_visible calls it.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Future tables must be granted explicitly instead of inheriting ALL.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
