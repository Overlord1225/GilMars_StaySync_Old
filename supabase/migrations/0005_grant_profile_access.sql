-- Allow signed-in clients to read profiles through the existing row-level
-- policies, and edit only their name and contact number. Role and active-state
-- changes remain protected by the profile trigger and super-admin policy.

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, role, is_active)
  ON TABLE public.profiles TO authenticated;
