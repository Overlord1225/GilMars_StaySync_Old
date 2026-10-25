-- StaySync audit log migration (0012)
-- Records staff actions for accountability and compliance.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_email text NOT NULL,
  actor_role public.user_role NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  target_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select_staff
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY audit_log_insert_staff
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND actor_id = auth.uid());

REVOKE ALL ON TABLE public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.audit_log TO authenticated;

-- Index for common queries
CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action);