-- Keyword must start at a word boundary ("book" matches "booking", not "notebook";
-- "issue" does not match "tissue"). Anything that is not a letter or digit,
-- including "_", becomes a space. Keep aligned with src/lib/categorize.ts.
-- Scoring and tie priority are unchanged from 20261109025148.

CREATE OR REPLACE FUNCTION public.categorize_inquiry_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_text text;
  v_category public.inquiry_category;
BEGIN
  v_text := ' ' || BTRIM(REGEXP_REPLACE(
    REGEXP_REPLACE(LOWER(COALESCE(NEW.subject, '') || ' ' || COALESCE(NEW.message, '')), '[^[:alnum:][:space:]]+', ' ', 'g'),
    '[[:space:]]+', ' ', 'g'
  ));

  WITH matched AS (
    SELECT ik.category, ik.weight
    FROM public.inquiry_keywords AS ik
    CROSS JOIN LATERAL (
      SELECT BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(ik.keyword), '[^[:alnum:][:space:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'
      )) AS normalized_keyword
    ) AS nk
    WHERE ik.is_active = true
      AND nk.normalized_keyword <> ''
      AND POSITION(' ' || nk.normalized_keyword IN v_text) > 0
  ), scores AS (
    SELECT category, SUM(weight)::bigint AS score
    FROM matched
    GROUP BY category
  )
  SELECT s.category INTO v_category
  FROM scores AS s
  ORDER BY
    s.score DESC,
    ARRAY_POSITION(
      ARRAY['complaint', 'booking_request', 'availability_inquiry', 'general_question']::public.inquiry_category[],
      s.category
    )
  LIMIT 1;

  NEW.category := COALESCE(v_category, 'general_question'::public.inquiry_category);
  NEW.original_category := NEW.category;
  NEW.category_source := 'auto'::public.category_source;
  NEW.status := 'new'::public.inquiry_status;
  NEW.corrected_by := NULL;
  NEW.corrected_at := NULL;

  SELECT COALESCE(ARRAY_AGG(matches.keyword ORDER BY matches.keyword), ARRAY[]::text[])
  INTO NEW.matched_keywords
  FROM (
    SELECT DISTINCT ik.keyword
    FROM public.inquiry_keywords AS ik
    CROSS JOIN LATERAL (
      SELECT BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(ik.keyword), '[^[:alnum:][:space:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'
      )) AS normalized_keyword
    ) AS nk
    WHERE ik.is_active = true
      AND nk.normalized_keyword <> ''
      AND POSITION(' ' || nk.normalized_keyword IN v_text) > 0
  ) AS matches;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.categorize_inquiry_before_insert() FROM PUBLIC, anon, authenticated;
