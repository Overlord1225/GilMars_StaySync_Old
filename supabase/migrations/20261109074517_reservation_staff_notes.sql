-- Staff-only internal notes on a reservation. Guests can read their own
-- reservations row, so notes live in a separate table that only staff can read.
CREATE TABLE public.reservation_staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  note text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reservation_staff_notes_reservation_id_idx
  ON public.reservation_staff_notes (reservation_id, created_at);

ALTER TABLE public.reservation_staff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY reservation_staff_notes_select_staff
  ON public.reservation_staff_notes FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY reservation_staff_notes_insert_staff
  ON public.reservation_staff_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND staff_id = auth.uid());

GRANT SELECT, INSERT ON public.reservation_staff_notes TO authenticated;
