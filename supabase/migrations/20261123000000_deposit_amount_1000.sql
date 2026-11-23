-- The GilMars down payment is PHP 1,000. The baseline (0000) and hardening (0011)
-- migrations seeded 1,500, and only seed-required.sql corrected it afterwards.
-- Set the value in the migration chain so a rebuilt database matches production.
-- Idempotent: production already holds 1000.

UPDATE public.booking_rules
SET deposit_amount = 1000,
    updated_at = now()
WHERE id = true
  AND deposit_amount <> 1000;
