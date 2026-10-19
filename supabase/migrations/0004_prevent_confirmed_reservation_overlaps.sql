-- Confirmed overlap preflight returned zero rows before this migration was added.
-- Prevent concurrent or direct staff writes from creating overlapping confirmed dates.

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND conname = 'reservations_no_confirmed_overlap'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT reservations_no_confirmed_overlap
      EXCLUDE USING gist (
        unit_id WITH =,
        daterange(check_in, check_out, '[)') WITH &&
      )
      WHERE (status = 'confirmed'::public.reservation_status);
  END IF;
END;
$constraint$;
