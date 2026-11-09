-- Arrival details (exact address, check-in/out times, house rules) for a unit.
-- units is publicly readable, so this lives in its own table: staff manage it,
-- a guest can read it only for a unit where they hold a confirmed reservation.
CREATE TABLE public.unit_stay_info (
  unit_id uuid PRIMARY KEY REFERENCES public.units(id) ON DELETE CASCADE,
  info text NOT NULL CHECK (char_length(btrim(info)) BETWEEN 1 AND 3000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_stay_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY unit_stay_info_select
  ON public.unit_stay_info FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.unit_id = unit_stay_info.unit_id
        AND r.guest_id = auth.uid()
        AND r.status = 'confirmed'::public.reservation_status
    )
  );

CREATE POLICY unit_stay_info_insert_staff
  ON public.unit_stay_info FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY unit_stay_info_update_staff
  ON public.unit_stay_info FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY unit_stay_info_delete_staff
  ON public.unit_stay_info FOR DELETE TO authenticated
  USING (public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_stay_info TO authenticated;
