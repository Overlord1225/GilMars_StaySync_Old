-- reservations.id had no default, so create_reservation_request failed with 23502.
ALTER TABLE public.reservations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
