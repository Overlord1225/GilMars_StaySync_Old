-- seed-required.sql: safe to run in any environment (production included).
-- Contains default rows required for the application to function.

-- booking_rules default row
INSERT INTO public.booking_rules (id, min_advance_days, deposit_amount, updated_at)
VALUES (true, 1, 1000, now())
ON CONFLICT (id) DO UPDATE
SET min_advance_days = EXCLUDED.min_advance_days,
    deposit_amount = EXCLUDED.deposit_amount,
    updated_at = now();

-- default inquiry keywords (same rows as seed.sql). Idempotent: skips rows that
-- already exist by id or by category and keyword.
WITH default_keywords (id, category, keyword, language, weight) AS (
  VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid, 'booking_request'::public.inquiry_category, 'book', 'en', 2),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'booking_request'::public.inquiry_category, 'reservation', 'en', 2),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'booking_request'::public.inquiry_category, 'mag book', 'fil', 2),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'booking_request'::public.inquiry_category, 'pa reserve', 'fil', 2),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'booking_request'::public.inquiry_category, 'magpa-book', 'fil', 2),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'availability_inquiry'::public.inquiry_category, 'available', 'en', 2),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'availability_inquiry'::public.inquiry_category, 'availability', 'en', 2),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'availability_inquiry'::public.inquiry_category, 'bakante', 'fil', 2),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'availability_inquiry'::public.inquiry_category, 'may bakante', 'fil', 2),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'availability_inquiry'::public.inquiry_category, 'open dates', 'en', 1),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'general_question'::public.inquiry_category, 'question', 'en', 1),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'general_question'::public.inquiry_category, 'information', 'en', 1),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'general_question'::public.inquiry_category, 'paano', 'fil', 1),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'general_question'::public.inquiry_category, 'magkano', 'fil', 1),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'general_question'::public.inquiry_category, 'how much', 'en', 1),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'complaint'::public.inquiry_category, 'complaint', 'en', 2),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'complaint'::public.inquiry_category, 'problem', 'en', 2),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'complaint'::public.inquiry_category, 'issue', 'en', 1),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'complaint'::public.inquiry_category, 'reklamo', 'fil', 2),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'complaint'::public.inquiry_category, 'sira', 'fil', 2),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'complaint'::public.inquiry_category, 'hindi gumagana', 'fil', 2)
)
INSERT INTO public.inquiry_keywords (id, category, keyword, language, weight, is_active)
SELECT dk.id, dk.category, dk.keyword, dk.language, dk.weight, true
FROM default_keywords AS dk
WHERE NOT EXISTS (
  SELECT 1 FROM public.inquiry_keywords AS existing
  WHERE existing.id = dk.id
     OR (existing.category = dk.category AND LOWER(existing.keyword) = LOWER(dk.keyword))
);

