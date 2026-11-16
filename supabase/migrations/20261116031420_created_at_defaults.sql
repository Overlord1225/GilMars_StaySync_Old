-- created_at had no default on these tables, so every new row stored NULL.
-- expire_stale_requests() filters on reservations.created_at, so pending
-- requests never expired, and the request page could not show the expiry time.
--
-- Existing rows are backfilled with now(): the true creation time is unknown.
-- Any pending request that exists today gets a fresh expiry window.
-- Columns stay nullable so database.types.ts does not change.

ALTER TABLE public.reservations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.inquiries ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.inquiry_keywords ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.reservations SET created_at = now() WHERE created_at IS NULL;
UPDATE public.inquiries SET created_at = now() WHERE created_at IS NULL;
UPDATE public.inquiry_keywords SET created_at = now() WHERE created_at IS NULL;
UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;
