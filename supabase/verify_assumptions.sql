-- Read-only Phase 1 preflight for GilMars StaySync.
-- Run in the Supabase SQL Editor and return all result sets before migrations are written.

-- 1. Verify the staff helper functions exist and inspect their definitions/security settings.
SELECT
  n.nspname AS function_schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS function_settings,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE p.proname IN ('is_staff', 'is_super_admin')
ORDER BY n.nspname, p.proname;

-- 2. List triggers attached to auth.users and inspect their trigger functions.
SELECT
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  pn.nspname AS function_schema,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  p.proconfig AS function_settings,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS tn ON tn.oid = c.relnamespace
JOIN pg_proc AS p ON p.oid = t.tgfoid
JOIN pg_namespace AS pn ON pn.oid = p.pronamespace
WHERE tn.nspname = 'auth'
  AND c.relname = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3. List the existing policies on the tables Phase 1 will harden.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'reservations', 'inquiries')
ORDER BY tablename, policyname;

-- 4. Confirm the required tables and columns are present before migration design.
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'units', 'reservations', 'inquiries',
    'inquiry_keywords', 'booking_rules'
  )
ORDER BY table_name, ordinal_position;

-- 5. Find any existing overlapping confirmed reservations.
-- Every returned row is a conflict that must be resolved before adding the exclusion constraint.
SELECT
  a.unit_id,
  a.id AS reservation_id_a,
  a.check_in AS check_in_a,
  a.check_out AS check_out_a,
  b.id AS reservation_id_b,
  b.check_in AS check_in_b,
  b.check_out AS check_out_b
FROM public.reservations AS a
JOIN public.reservations AS b
  ON b.unit_id = a.unit_id
 AND b.id > a.id
 AND daterange(a.check_in, a.check_out, '[)')
     && daterange(b.check_in, b.check_out, '[)')
WHERE a.status = 'confirmed'
  AND b.status = 'confirmed'
ORDER BY a.unit_id, a.check_in, b.check_in;
