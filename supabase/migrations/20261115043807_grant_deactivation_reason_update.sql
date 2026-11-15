-- authenticated only has column-level UPDATE on profiles (full_name, is_active, role).
-- The deactivation reason is written in the same UPDATE as is_active, so it needs the
-- grant too. Safe: apply_profile_deactivation_reason() resets the value on any update
-- that does not change is_active, and prevent_profile_privilege_escalation() still
-- decides who may change is_active, so a normal user cannot set or rewrite a reason.
-- deactivated_at is set only by the trigger and stays ungranted.
GRANT UPDATE (deactivation_reason) ON public.profiles TO authenticated;
