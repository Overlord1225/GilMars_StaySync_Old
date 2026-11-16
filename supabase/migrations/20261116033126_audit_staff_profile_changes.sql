-- Write audit rows from the database when staff change another account.
--
-- Until now the browser wrote these rows in a second call after the profile
-- update, and ignored a failed call. A closed tab or a network error left a
-- change with no audit row. This trigger logs in the same transaction as the
-- change, so the two cannot drift apart.
--
-- One row per changed field, action 'staff.<field>' (role, is_active,
-- full_name, email), with target_details {previous, updates}, the same shape
-- the browser used. The actor comes from auth.uid(), never from the caller.
--
-- Logged only when the actor is an active admin or super admin changing a
-- different account. Not logged: a person editing their own profile, and
-- changes made with no signed-in user (service role, handle_new_user).
--
-- Not covered here:
--   * Staff creation. The create-staff Edge Function runs with the service
--     role, so there is no actor to record. The browser still logs staff.create.
--   * Password reset. No staff-side reset exists in the app yet.
--
-- After applying, remove the browser-side auditLog() calls for role, status
-- and guest deactivation (StaffManagement updateStaff, AdminGuests
-- changeStatus), or each change is logged twice.

CREATE OR REPLACE FUNCTION public.audit_staff_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = NEW.id THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_actor
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND p.is_active
    AND p.role IN ('admin', 'super_admin');

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.audit_log
      (actor_id, actor_email, actor_role, action, target_table, target_id, target_details)
    VALUES (
      v_actor.id, v_actor.email, v_actor.role, 'staff.role', 'profiles', NEW.id,
      jsonb_build_object(
        'previous', jsonb_build_object('role', OLD.role, 'is_active', OLD.is_active),
        'updates', jsonb_build_object('role', NEW.role)
      )
    );
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    INSERT INTO public.audit_log
      (actor_id, actor_email, actor_role, action, target_table, target_id, target_details)
    VALUES (
      v_actor.id, v_actor.email, v_actor.role, 'staff.is_active', 'profiles', NEW.id,
      jsonb_build_object(
        'previous', jsonb_build_object('role', OLD.role, 'is_active', OLD.is_active),
        'updates', CASE
          WHEN NEW.is_active THEN jsonb_build_object('is_active', true)
          ELSE jsonb_build_object(
            'is_active', false,
            'deactivation_reason', NEW.deactivation_reason
          )
        END
      )
    );
  END IF;

  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    INSERT INTO public.audit_log
      (actor_id, actor_email, actor_role, action, target_table, target_id, target_details)
    VALUES (
      v_actor.id, v_actor.email, v_actor.role, 'staff.full_name', 'profiles', NEW.id,
      jsonb_build_object(
        'previous', jsonb_build_object('full_name', OLD.full_name),
        'updates', jsonb_build_object('full_name', NEW.full_name)
      )
    );
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    INSERT INTO public.audit_log
      (actor_id, actor_email, actor_role, action, target_table, target_id, target_details)
    VALUES (
      v_actor.id, v_actor.email, v_actor.role, 'staff.email', 'profiles', NEW.id,
      jsonb_build_object(
        'previous', jsonb_build_object('email', OLD.email),
        'updates', jsonb_build_object('email', NEW.email)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_staff_profile_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_audit_staff_changes ON public.profiles;
CREATE TRIGGER profiles_audit_staff_changes
  AFTER UPDATE OF role, is_active, full_name, email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_staff_profile_changes();
