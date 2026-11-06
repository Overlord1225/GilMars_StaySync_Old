-- Audit log hardening.
-- 1. Staff could insert audit_log rows directly with any actor_email/actor_role/action.
--    Writes now go through log_staff_action(), which derives the actor from auth.uid().
-- 2. Trigger functions were callable over /rest/v1/rpc; revoke EXECUTE (triggers still fire).
-- 3. Pin search_path on manila_today.

CREATE OR REPLACE FUNCTION public.log_staff_action(
  p_action text,
  p_target_table text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_target_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_action IS NULL OR char_length(p_action) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'invalid action';
  END IF;

  INSERT INTO public.audit_log
    (actor_id, actor_email, actor_role, action, target_table, target_id, target_details)
  SELECT p.id, p.email, p.role, p_action, p_target_table, p_target_id, p_target_details
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.is_active AND p.role IN ('admin', 'super_admin');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_staff_action(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_staff_action(text, text, uuid, jsonb) TO authenticated;

DROP POLICY IF EXISTS audit_log_insert_staff ON public.audit_log;
REVOKE INSERT ON TABLE public.audit_log FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_reservation_guest_update() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.manila_today() SET search_path = '';
