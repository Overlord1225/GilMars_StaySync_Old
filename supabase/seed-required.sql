-- seed-required.sql: safe to run in any environment (production included).
-- Contains default rows required for the application to function.

-- booking_rules default row
INSERT INTO public.booking_rules (id, min_advance_days, deposit_amount, updated_at)
VALUES (true, 1, 1500, now())
ON CONFLICT (id) DO UPDATE
SET min_advance_days = EXCLUDED.min_advance_days,
    deposit_amount = EXCLUDED.deposit_amount,
    updated_at = now();

-- default inquiry keywords (extracted from seed.sql)

