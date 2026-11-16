-- DB-side accuracy check for the thesis (paper section 4.6).
--
-- The Accuracy Test page runs the TypeScript mirrors (src/lib/availability.ts,
-- src/lib/categorize.ts). This script runs the SAME cases against the authoritative
-- database rules:
--   * availability  -> exclusion constraint reservations_no_confirmed_overlap
--   * categorization -> trigger categorize_inquiry_before_insert, using the active
--                       rows of inquiry_keywords and the labeled rows of test_inquiries
--
-- Safe to run on any environment: everything happens inside BEGIN ... ROLLBACK,
-- on a throwaway unit, and nothing is kept. Run it as the postgres role (SQL editor
-- or psql). It needs at least one active admin or super_admin profile, because the
-- confirmation guard trigger requires auth.uid() for confirmed rows.
--
-- Not covered here (enforced in RPCs, not in the constraint or trigger): same-day,
-- minimum advance days, maximum stay and booking window.
--
-- The final SELECT is the report. Use a runner that prints the SELECT result before
-- the ROLLBACK (psql does; some editors show only the last statement).

BEGIN;

CREATE TEMP TABLE acc_results (
  section text NOT NULL,
  ord integer NOT NULL,
  label text NOT NULL,
  expected text NOT NULL,
  actual text NOT NULL,
  pass boolean NOT NULL
) ON COMMIT DROP;

DO $check$
DECLARE
  v_actor uuid;
  v_unit uuid := gen_random_uuid();
  c record;
  t record;
  v_actual text;
  v_category text;
  v_ord integer := 0;
BEGIN
  SELECT id INTO v_actor
  FROM public.profiles
  WHERE role IN ('admin', 'super_admin') AND is_active = true
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No active admin or super_admin profile found; create one first';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor, 'role', 'authenticated')::text,
    true
  );

  INSERT INTO public.units (id, name, description, capacity, price_per_night, amenities, image_urls, is_active)
  VALUES (v_unit, 'ACCURACY CHECK UNIT (rolled back)', 'Throwaway unit', 4, 1, ARRAY[]::text[], ARRAY[]::text[], false);

  -- Availability: same 10 cases as paper Table 7. The requested stay is inserted as
  -- confirmed; an exclusion violation means "not available".
  FOR c IN
    SELECT *
    FROM (VALUES
      (1,  'Back-to-back: requested starts on existing check-out', DATE '2026-11-12', DATE '2026-11-14', DATE '2026-11-10', DATE '2026-11-12', 'confirmed', 'available'),
      (2,  'Back-to-back: requested ends on existing check-in',    DATE '2026-11-10', DATE '2026-11-12', DATE '2026-11-12', DATE '2026-11-14', 'confirmed', 'available'),
      (3,  'Exact same dates',                                     DATE '2026-11-10', DATE '2026-11-12', DATE '2026-11-10', DATE '2026-11-12', 'confirmed', 'not available'),
      (4,  'Partial overlap at the start of the existing stay',    DATE '2026-11-08', DATE '2026-11-11', DATE '2026-11-10', DATE '2026-11-14', 'confirmed', 'not available'),
      (5,  'Partial overlap at the end of the existing stay',      DATE '2026-11-13', DATE '2026-11-16', DATE '2026-11-10', DATE '2026-11-14', 'confirmed', 'not available'),
      (6,  'Requested stay inside an existing stay',               DATE '2026-11-11', DATE '2026-11-12', DATE '2026-11-10', DATE '2026-11-14', 'confirmed', 'not available'),
      (7,  'Existing stay inside the requested stay',              DATE '2026-11-08', DATE '2026-11-16', DATE '2026-11-10', DATE '2026-11-12', 'confirmed', 'not available'),
      (8,  'No overlap',                                           DATE '2026-12-01', DATE '2026-12-04', DATE '2026-11-10', DATE '2026-11-12', 'confirmed', 'available'),
      (9,  'Booking more than 6 months ahead',                     DATE '2027-07-10', DATE '2027-07-13', DATE '2027-07-11', DATE '2027-07-12', 'confirmed', 'not available'),
      (10, 'Pending booking on the same dates does not block',     DATE '2026-11-10', DATE '2026-11-12', DATE '2026-11-10', DATE '2026-11-12', 'pending',   'available')
    ) AS cases (n, label, req_in, req_out, ex_in, ex_out, ex_status, expected)
    ORDER BY n
  LOOP
    DELETE FROM public.reservations WHERE unit_id = v_unit;

    INSERT INTO public.reservations (id, unit_id, manual_guest_name, source, check_in, check_out, num_guests, status)
    VALUES (gen_random_uuid(), v_unit, 'accuracy check', 'airbnb', c.ex_in, c.ex_out, 1, c.ex_status::public.reservation_status);

    BEGIN
      INSERT INTO public.reservations (id, unit_id, manual_guest_name, source, check_in, check_out, num_guests, status)
      VALUES (gen_random_uuid(), v_unit, 'accuracy check', 'airbnb', c.req_in, c.req_out, 1, 'confirmed');
      v_actual := 'available';
    EXCEPTION WHEN exclusion_violation THEN
      v_actual := 'not available';
    END;

    INSERT INTO acc_results VALUES ('availability', c.n, c.label, c.expected, v_actual, c.expected = v_actual);
  END LOOP;

  -- Categorization: every labeled test inquiry goes through the real BEFORE INSERT trigger.
  FOR t IN SELECT message, expected_category FROM public.test_inquiries ORDER BY expected_category, message LOOP
    v_ord := v_ord + 1;
    INSERT INTO public.inquiries (id, guest_id, message, category_source, status, matched_keywords)
    VALUES (gen_random_uuid(), v_actor, t.message, 'auto', 'new', ARRAY[]::text[])
    RETURNING category::text INTO v_category;

    INSERT INTO acc_results
    VALUES ('categorization', v_ord, left(t.message, 70), t.expected_category::text, v_category, t.expected_category::text = v_category);
  END LOOP;
END;
$check$;

SELECT section, label, expected, actual, result
FROM (
  -- Summary first
  SELECT 1 AS s, 0 AS ord, 'summary' AS section, 'availability pass rate' AS label,
         '' AS expected,
         COUNT(*) FILTER (WHERE pass) || ' of ' || COUNT(*) || ' (' || ROUND(100.0 * COUNT(*) FILTER (WHERE pass) / NULLIF(COUNT(*), 0), 2) || '%)' AS actual,
         '' AS result
  FROM acc_results WHERE section = 'availability'
  UNION ALL
  SELECT 1, 1, 'summary', 'categorization accuracy', '',
         COUNT(*) FILTER (WHERE pass) || ' of ' || COUNT(*) || ' (' || ROUND(100.0 * COUNT(*) FILTER (WHERE pass) / NULLIF(COUNT(*), 0), 2) || '%)',
         ''
  FROM acc_results WHERE section = 'categorization'
  UNION ALL
  SELECT 1, 2 + array_position(ARRAY['booking_request', 'availability_inquiry', 'general_question', 'complaint'], k.category),
         'summary', k.category || ' precision / recall', '',
         COALESCE(ROUND(100.0 * m.tp / NULLIF(m.tp + m.fp, 0), 2)::text, 'n/a') || '% / ' ||
         COALESCE(ROUND(100.0 * m.tp / NULLIF(m.tp + m.fn, 0), 2)::text, 'n/a') || '%',
         'tp=' || m.tp || ' fp=' || m.fp || ' fn=' || m.fn
  FROM unnest(ARRAY['booking_request', 'availability_inquiry', 'general_question', 'complaint']) AS k(category)
  CROSS JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE r.expected = k.category AND r.actual = k.category) AS tp,
      COUNT(*) FILTER (WHERE r.expected <> k.category AND r.actual = k.category) AS fp,
      COUNT(*) FILTER (WHERE r.expected = k.category AND r.actual <> k.category) AS fn
    FROM acc_results AS r
    WHERE r.section = 'categorization'
  ) AS m
  UNION ALL
  -- Detail rows
  SELECT 2, ord, section, label, expected, actual, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END
  FROM acc_results
) AS report
ORDER BY s, section, ord;

ROLLBACK;
