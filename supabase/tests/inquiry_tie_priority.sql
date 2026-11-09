-- Rollback test for 20261109025148_inquiry_tie_priority_order.sql.
-- Run as the postgres role (SQL editor or psql). Everything is rolled back.
--
-- Usage: paste the migration body at the marker below, or build one file:
--   cat supabase/migrations/20261109025148_inquiry_tie_priority_order.sql > combined.sql
--   (then append everything below the marker)
-- Expected: NOTICE "PASS ..." for every case, then ROLLBACK. Any mismatch raises
-- an exception; if that happens, run ROLLBACK; manually.

BEGIN;

-- >>> PASTE MIGRATION 20261109025148_inquiry_tie_priority_order.sql HERE <<<

-- Isolate from real keywords (reverted by ROLLBACK).
UPDATE public.inquiry_keywords SET is_active = false;

INSERT INTO public.inquiry_keywords (category, keyword, language, weight, is_active)
VALUES
  ('complaint',            'zztcomp',  'en', 2, true),
  ('booking_request',      'zztbook',  'en', 2, true),
  ('availability_inquiry', 'zztavail', 'en', 2, true),
  ('general_question',     'zztgen',   'en', 2, true),
  ('general_question',     'qqheavy',  'en', 3, true),
  ('complaint',            'zztdead',  'en', 5, false);

DO $test$
DECLARE
  r record;
  got text;
  v_guest uuid;
BEGIN
  SELECT id INTO v_guest FROM public.profiles LIMIT 1;
  IF v_guest IS NULL THEN
    RAISE EXCEPTION 'No profile row to use as guest_id; create one inside this transaction first.';
  END IF;

  FOR r IN
    SELECT * FROM (VALUES
      ('complaint vs booking',            'zztcomp zztbook',                    'complaint'),
      ('booking vs availability',         'zztbook zztavail',                   'booking_request'),
      ('availability vs general',         'zztavail zztgen',                    'availability_inquiry'),
      ('three-way tie',                   'zztbook zztavail zztgen',            'booking_request'),
      ('four-way tie',                    'zztcomp zztbook zztavail zztgen',    'complaint'),
      ('no match',                        'nothing relevant here',              'general_question'),
      ('higher score beats priority',     'zztcomp qqheavy',                    'general_question'),
      ('inactive keyword ignored',        'zztdead zztbook',                    'booking_request')
    ) AS t(name, msg, expected)
  LOOP
    INSERT INTO public.inquiries
      (guest_id, message, category_source, status, matched_keywords)
    VALUES (v_guest, r.msg, 'auto', 'new', '{}')
    RETURNING category::text INTO got;

    IF got IS DISTINCT FROM r.expected THEN
      RAISE EXCEPTION 'FAIL %: expected %, got %', r.name, r.expected, got;
    END IF;
    RAISE NOTICE 'PASS %: %', r.name, got;
  END LOOP;

  -- original_category must mirror category; matched_keywords must be filled.
  IF EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE message = 'zztcomp zztbook'
      AND (original_category IS DISTINCT FROM category
           OR matched_keywords <> ARRAY['zztbook', 'zztcomp'])
  ) THEN
    RAISE EXCEPTION 'FAIL original_category / matched_keywords';
  END IF;
  RAISE NOTICE 'PASS original_category and matched_keywords';
END
$test$;

ROLLBACK;
