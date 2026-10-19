-- SAMPLE DATA ONLY. Review and edit before applying to any shared environment.
-- The unit names, descriptions, rates, amenities, and inquiry terms below are illustrative.

INSERT INTO public.units (
  id, name, description, capacity, price_per_night, amenities, image_urls, is_active
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Sample Unit - Amihan', 'Sample one-bedroom stay.', 2, 1800, ARRAY['Wi-Fi', 'Air conditioning'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000002', 'Sample Unit - Habagat', 'Sample family room.', 4, 2600, ARRAY['Wi-Fi', 'Kitchen'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000003', 'Sample Unit - Liwayway', 'Sample garden room.', 2, 2000, ARRAY['Wi-Fi', 'Garden'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000004', 'Sample Unit - Dapithapon', 'Sample group suite.', 6, 3800, ARRAY['Wi-Fi', 'Kitchen', 'Air conditioning'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000005', 'Sample Unit - Tala', 'Sample compact room.', 2, 1600, ARRAY['Wi-Fi'], ARRAY[]::text[], true)
ON CONFLICT (id) DO NOTHING;

WITH sample_keywords (id, category, keyword, language, weight) AS (
  VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid, 'booking_request'::public.inquiry_category, 'book', 'en', 2),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'booking_request'::public.inquiry_category, 'reservation', 'en', 2),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'booking_request'::public.inquiry_category, 'mag book', 'tl', 2),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'booking_request'::public.inquiry_category, 'pa reserve', 'tl', 2),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'booking_request'::public.inquiry_category, 'magpa-book', 'tl', 2),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'availability_inquiry'::public.inquiry_category, 'available', 'en', 2),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'availability_inquiry'::public.inquiry_category, 'availability', 'en', 2),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'availability_inquiry'::public.inquiry_category, 'bakante', 'tl', 2),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'availability_inquiry'::public.inquiry_category, 'may bakante', 'tl', 2),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'availability_inquiry'::public.inquiry_category, 'open dates', 'en', 1),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'general_question'::public.inquiry_category, 'question', 'en', 1),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'general_question'::public.inquiry_category, 'information', 'en', 1),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'general_question'::public.inquiry_category, 'paano', 'tl', 1),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'general_question'::public.inquiry_category, 'magkano', 'tl', 1),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'general_question'::public.inquiry_category, 'how much', 'en', 1),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'complaint'::public.inquiry_category, 'complaint', 'en', 2),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'complaint'::public.inquiry_category, 'problem', 'en', 2),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'complaint'::public.inquiry_category, 'issue', 'en', 1),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'complaint'::public.inquiry_category, 'reklamo', 'tl', 2),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'complaint'::public.inquiry_category, 'sira', 'tl', 2),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'complaint'::public.inquiry_category, 'hindi gumagana', 'tl', 2)
)
INSERT INTO public.inquiry_keywords (id, category, keyword, language, weight, is_active)
SELECT sk.id, sk.category, sk.keyword, sk.language, sk.weight, true
FROM sample_keywords AS sk
WHERE NOT EXISTS (
  SELECT 1 FROM public.inquiry_keywords AS existing
  WHERE existing.id = sk.id
     OR (existing.category = sk.category AND LOWER(existing.keyword) = LOWER(sk.keyword))
);
