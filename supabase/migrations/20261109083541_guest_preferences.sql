-- Display-only guest preferences: how the guest likes to be reached and a short
-- arrival note (for example "arriving after 10 PM"). Nothing is sent to the
-- guest from this; staff read it. A guest manages their own row, admins read.
CREATE TABLE public.guest_preferences (
  guest_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_preference text NOT NULL DEFAULT 'any'
    CHECK (contact_preference IN ('any', 'email', 'facebook', 'instagram')),
  arrival_note text CHECK (arrival_note IS NULL OR char_length(arrival_note) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_preferences_select
  ON public.guest_preferences FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR public.is_admin());

CREATE POLICY guest_preferences_insert_own
  ON public.guest_preferences FOR INSERT TO authenticated
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'guest'::public.user_role AND p.is_active
    )
  );

CREATE POLICY guest_preferences_update_own
  ON public.guest_preferences FOR UPDATE TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.guest_preferences TO authenticated;
