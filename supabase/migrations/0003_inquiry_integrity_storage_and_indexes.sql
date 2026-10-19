-- Server-side inquiry categorization, restricted staff edits, housekeeping,
-- query indexes, and unit image storage access.

CREATE OR REPLACE FUNCTION public.categorize_inquiry_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_normalized_message text;
  v_category public.inquiry_category;
BEGIN
  v_normalized_message := BTRIM(REGEXP_REPLACE(
    REGEXP_REPLACE(LOWER(COALESCE(NEW.message, '')), '[[:punct:]]+', ' ', 'g'),
    '[[:space:]]+', ' ', 'g'
  ));

  SELECT ik.category
  INTO v_category
  FROM public.inquiry_keywords AS ik
  CROSS JOIN LATERAL (
    SELECT BTRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(ik.keyword), '[[:punct:]]+', ' ', 'g'),
      '[[:space:]]+', ' ', 'g'
    )) AS normalized_keyword
  ) AS nk
  WHERE ik.is_active = true
    AND nk.normalized_keyword <> ''
    AND POSITION(nk.normalized_keyword IN v_normalized_message) > 0
  GROUP BY ik.category
  ORDER BY
    SUM(ik.weight) DESC,
    CASE ik.category
      WHEN 'complaint'::public.inquiry_category THEN 1
      WHEN 'booking_request'::public.inquiry_category THEN 2
      WHEN 'availability_inquiry'::public.inquiry_category THEN 3
      WHEN 'general_question'::public.inquiry_category THEN 4
    END ASC
  LIMIT 1;

  v_category := COALESCE(v_category, 'general_question'::public.inquiry_category);

  NEW.category := v_category;
  NEW.original_category := v_category;
  NEW.category_source := 'auto'::public.category_source;
  NEW.status := 'new'::public.inquiry_status;
  NEW.corrected_by := NULL;
  NEW.corrected_at := NULL;

  SELECT COALESCE(
    ARRAY_AGG(matches.keyword ORDER BY matches.category_priority, matches.keyword),
    ARRAY[]::text[]
  )
  INTO NEW.matched_keywords
  FROM (
    SELECT DISTINCT
      ik.keyword,
      CASE ik.category
        WHEN 'complaint'::public.inquiry_category THEN 1
        WHEN 'booking_request'::public.inquiry_category THEN 2
        WHEN 'availability_inquiry'::public.inquiry_category THEN 3
        WHEN 'general_question'::public.inquiry_category THEN 4
      END AS category_priority
    FROM public.inquiry_keywords AS ik
    CROSS JOIN LATERAL (
      SELECT BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(ik.keyword), '[[:punct:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'
      )) AS normalized_keyword
    ) AS nk
    WHERE ik.is_active = true
      AND nk.normalized_keyword <> ''
      AND POSITION(nk.normalized_keyword IN v_normalized_message) > 0
  ) AS matches;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS inquiries_categorize_before_insert ON public.inquiries;
CREATE TRIGGER inquiries_categorize_before_insert
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.categorize_inquiry_before_insert();

CREATE OR REPLACE FUNCTION public.guard_staff_inquiry_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to update an inquiry'
      USING ERRCODE = '42501';
  END IF;

  IF (TO_JSONB(NEW) - ARRAY[
        'category', 'status', 'category_source', 'corrected_by',
        'corrected_at', 'updated_at'
      ]::text[])
     IS DISTINCT FROM
     (TO_JSONB(OLD) - ARRAY[
        'category', 'status', 'category_source', 'corrected_by',
        'corrected_at', 'updated_at'
      ]::text[]) THEN
    RAISE EXCEPTION 'Staff may only update inquiry category and status'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.category IS DISTINCT FROM OLD.category THEN
    NEW.category_source := 'admin'::public.category_source;
    NEW.corrected_by := auth.uid();
    NEW.corrected_at := now();
  ELSIF NEW.category_source IS DISTINCT FROM OLD.category_source
     OR NEW.corrected_by IS DISTINCT FROM OLD.corrected_by
     OR NEW.corrected_at IS DISTINCT FROM OLD.corrected_at THEN
    RAISE EXCEPTION 'Inquiry correction metadata can only change with category'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS inquiries_guard_staff_update ON public.inquiries;
DROP TRIGGER IF EXISTS a_inquiries_guard_staff_update ON public.inquiries;
CREATE TRIGGER a_inquiries_guard_staff_update
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_staff_inquiry_update();

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Replace permissive duplicate policies discovered in the verification output.
DROP POLICY IF EXISTS inq_insert_guest ON public.inquiries;
DROP POLICY IF EXISTS inquiries_insert_own_or_staff ON public.inquiries;
CREATE POLICY inquiries_insert_owner_or_staff
  ON public.inquiries FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS inq_select_own ON public.inquiries;
DROP POLICY IF EXISTS inq_select_staff ON public.inquiries;
DROP POLICY IF EXISTS inquiries_select_own_or_staff ON public.inquiries;
CREATE POLICY inquiries_select_owner_or_staff
  ON public.inquiries FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS inq_staff_update ON public.inquiries;
DROP POLICY IF EXISTS inquiries_update_staff_only ON public.inquiries;
CREATE POLICY inquiries_update_staff_only
  ON public.inquiries FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Keep updated_at consistent for every table with that column.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DO $updated_at_triggers$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'profiles', 'units', 'reservations', 'inquiries', 'booking_rules'
  ] LOOP
    EXECUTE FORMAT(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'set_updated_at_' || v_table,
      v_table
    );
    EXECUTE FORMAT(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      'set_updated_at_' || v_table,
      v_table
    );
  END LOOP;
END;
$updated_at_triggers$;

CREATE INDEX IF NOT EXISTS inquiries_status_category_created_idx
  ON public.inquiries (status, category, created_at);
CREATE INDEX IF NOT EXISTS inquiries_guest_id_idx
  ON public.inquiries (guest_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-images', 'unit-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS unit_images_public_read ON storage.objects;
CREATE POLICY unit_images_public_read
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'unit-images');

DROP POLICY IF EXISTS unit_images_staff_write ON storage.objects;
CREATE POLICY unit_images_staff_write
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'unit-images' AND public.is_staff())
  WITH CHECK (bucket_id = 'unit-images' AND public.is_staff());
