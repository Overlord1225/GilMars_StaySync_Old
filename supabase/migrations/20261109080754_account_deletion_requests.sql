-- A guest can ask for their account to be deleted. Admins see the request and
-- act on it by hand (no automated deletion: reservation history must be kept
-- or removed deliberately). One open request per guest; the guest can
-- withdraw it, an admin clears it once handled.
CREATE TABLE public.account_deletion_requests (
  guest_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text CHECK (reason IS NULL OR char_length(reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY deletion_requests_select
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR public.is_admin());

CREATE POLICY deletion_requests_insert_guest
  ON public.account_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'guest'::public.user_role AND p.is_active
    )
  );

CREATE POLICY deletion_requests_delete
  ON public.account_deletion_requests FOR DELETE TO authenticated
  USING (guest_id = auth.uid() OR public.is_admin());

GRANT SELECT, INSERT, DELETE ON public.account_deletion_requests TO authenticated;
