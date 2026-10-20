-- Keep the database categorizer aligned with src/lib/categorize.ts.
-- Ties and unmatched messages both resolve to general_question.
-- Include subject text when present; the database trigger remains authoritative.

CREATE OR REPLACE FUNCTION public.categorize_inquiry_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_text text;
  v_max_score bigint;
  v_winner_count integer;
  v_category public.inquiry_category;
BEGIN
  v_text := BTRIM(REGEXP_REPLACE(
    REGEXP_REPLACE(LOWER(COALESCE(NEW.subject, '') || ' ' || COALESCE(NEW.message, '')), '[[:punct:]]+', ' ', 'g'),
    '[[:space:]]+', ' ', 'g'
  ));

  WITH matched AS (
    SELECT ik.category, ik.keyword, ik.weight
    FROM public.inquiry_keywords AS ik
    CROSS JOIN LATERAL (
      SELECT BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(ik.keyword), '[[:punct:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'
      )) AS normalized_keyword
    ) AS nk
    WHERE ik.is_active = true
      AND nk.normalized_keyword <> ''
      AND POSITION(nk.normalized_keyword IN v_text) > 0
  ), scores AS (
    SELECT category, SUM(weight)::bigint AS score
    FROM matched
    GROUP BY category
  )
  SELECT MAX(score), COUNT(*) FILTER (WHERE score = (SELECT MAX(score) FROM scores))
  INTO v_max_score, v_winner_count
  FROM scores;

  IF COALESCE(v_winner_count, 0) = 1 THEN
    WITH matched AS (
      SELECT ik.category, ik.weight
      FROM public.inquiry_keywords AS ik
      CROSS JOIN LATERAL (
        SELECT BTRIM(REGEXP_REPLACE(
          REGEXP_REPLACE(LOWER(ik.keyword), '[[:punct:]]+', ' ', 'g'),
          '[[:space:]]+', ' ', 'g'
        )) AS normalized_keyword
      ) AS nk
      WHERE ik.is_active = true
        AND nk.normalized_keyword <> ''
        AND POSITION(nk.normalized_keyword IN v_text) > 0
    )
    SELECT category INTO v_category
    FROM matched
    GROUP BY category
    HAVING SUM(weight)::bigint = v_max_score;
  ELSE
    v_category := 'general_question'::public.inquiry_category;
  END IF;

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
        REGEXP_REPLACE(LOWER(ik.keyword), '[[:punct:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'
      )) AS normalized_keyword
    ) AS nk
    WHERE ik.is_active = true
      AND nk.normalized_keyword <> ''
      AND POSITION(nk.normalized_keyword IN v_text) > 0
  ) AS matches;

  RETURN NEW;
END;
$function$;

-- Trigger invocation does not require client EXECUTE privileges.
REVOKE ALL ON FUNCTION public.categorize_inquiry_before_insert() FROM PUBLIC, anon, authenticated;
