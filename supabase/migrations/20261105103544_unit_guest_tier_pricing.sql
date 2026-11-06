-- Guest-count pricing per night. NULL tier = use price_per_night.
-- price_per_night is the rate for 1 or 2 guests.
ALTER TABLE public.units
  ADD COLUMN price_3_guests numeric CHECK (price_3_guests IS NULL OR price_3_guests >= 0),
  ADD COLUMN price_4_guests numeric CHECK (price_4_guests IS NULL OR price_4_guests >= 0),
  ADD COLUMN extra_guest_fee numeric CHECK (extra_guest_fee IS NULL OR extra_guest_fee >= 0);

-- Admin "Add stay" inserts without an id; the live table had no defaults.
ALTER TABLE public.units
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();
