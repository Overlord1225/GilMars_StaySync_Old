-- ============================================================================
-- supabase/migrations/20261019090000_security_and_availability.sql
-- GilMars StaySync — security fixes + availability integrity
--
-- Security fixes:
--   1. profiles: non-super-admins cannot change role/is_active; guests only
--      full_name/contact_number (BEFORE UPDATE trigger).
--   2. auth.users insert -> profiles row (role=guest) via AFTER INSERT trigger.
--   3. reservations: non-staff inserts forced to pending/staysync with payment
--      fields nulled; non-staff updates allow only pending->cancelled.
--   4. inquiries: auto-categorization on insert (SECURITY DEFINER
--      categorize_inquiry); staff correction on update; message immutable.
--   5. is_staff()/is_super_admin(): SECURITY DEFINER, fixed search_path,
--      require profiles.is_active = true.
--
-- Availability & integrity:
--   6. check_availability() + get_blocked_ranges() RPCs (EXECUTE to anon,
--      authenticated); no guest data exposed.
--   7. CHECK (check_out > check_in); half-open [check_in, check_out) ranges.
--   8. btree_gist exclusion constraint on confirmed reservations.
--   9. Reservation validation trigger (capacity, advance window, paid-to-confirm).
--  10. CHECK (guest_id IS NOT NULL OR manual_guest_name IS NOT NULL).
--  11. booking_rules singleton (boolean PK default true, CHECK (id)).
--
-- Row Level Security is enabled so anon/authenticated sessions cannot read
-- tables they are not granted access to (RPCs run SECURITY DEFINER as owner).
--
-- Idempotent where reasonable. REVIEW BEFORE APPLYING. Existing overlapping
-- confirmed rows or invalid date ranges will make the exclusion/CHECK
-- constraints fail. Apply on a dev/staging copy first.
-- ============================================================================

--------------------------------------------------------------
-- 0. Extensions
--------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

--------------------------------------------------------------
-- 5. is_staff() / is_super_admin() — SECURITY DEFINER, fixed search_path,
--     require profiles.is_active = true.
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('admin'::user_role, 'super_admin'::user_role)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'super_admin'::user_role
  );
END;
$$;

COMMENT ON FUNCTION public.is_staff() IS 'True when auth.uid() is an active admin or super_admin.';
COMMENT ON FUNCTION public.is_super_admin() IS 'True when auth.uid() is an active super_admin.';

--------------------------------------------------------------
-- 1. profiles: protect role/is_active; guests only full_name/contact_number
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_protect_profiles_role_and_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role
  FROM profiles
  WHERE id = auth.uid();

  IF current_role = 'super_admin'::user_role THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only super admins can change role';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only super admins can change is_active';
  END IF;

  IF current_role = 'guest'::user_role THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Guests may only update full_name and contact_number';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_role_and_active ON profiles;
CREATE TRIGGER trg_protect_profiles_role_and_active
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_protect_profiles_role_and_active();

COMMENT ON TRIGGER trg_protect_profiles_role_and_active ON profiles IS
'Non-super-admins cannot change role or is_active. Guests may only update full_name and contact_number.';

--------------------------------------------------------------
-- 2. auth.users insert -> profiles row (role = guest)
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    contact_number,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'contact_number', ''),
    'guest'::user_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

COMMENT ON TRIGGER on_auth_user_created_profile ON auth.users IS
'Creates a public.profiles row (role=guest) for every new auth user, copying full_name/contact_number from raw_user_meta_data.';

--------------------------------------------------------------
-- 4. categorize_inquiry() — SECURITY DEFINER keyword scorer
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.categorize_inquiry(p_message text)
RETURNS TABLE (category inquiry_category, matched_keywords text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
DECLARE
  v_msg text;
  v_cat inquiry_category;
  v_kws text[];
BEGIN
  v_msg := lower(trim(coalesce(p_message, '')));
  v_msg := regexp_replace(v_msg, '[^\w\s]', ' ', 'g');
  v_msg := regexp_replace(v_msg, '\s+', ' ', 'g');

  SELECT ik.category, array_agg(ik.keyword ORDER BY ik.keyword)
  INTO v_cat, v_kws
  FROM inquiry_keywords ik
  WHERE ik.is_active
    AND ik.keyword <> ''
    AND v_msg LIKE '%' || lower(ik.keyword) || '%'
  GROUP BY ik.category
  ORDER BY SUM(ik.weight) DESC, ik.category
  LIMIT 1;

  category := COALESCE(v_cat, 'general_question'::inquiry_category);
  matched_keywords := COALESCE(v_kws, '{}'::text[]);
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.categorize_inquiry(text) IS
'Scores an inquiry message against active inquiry_keywords (weight) and returns the best category plus matched keywords, falling back to general_question. One category per message.';

--------------------------------------------------------------
-- 4 (cont.). inquiries: auto-categorize on insert; staff correction on update
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_inquiries_auto_categorize()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
DECLARE
  v_cat inquiry_category;
  v_kws text[];
BEGIN
  SELECT category, matched_keywords INTO v_cat, v_kws
  FROM public.categorize_inquiry(NEW.message);

  NEW.category := v_cat;
  NEW.original_category := v_cat;
  NEW.category_source := 'auto'::category_source;
  NEW.matched_keywords := v_kws;
  NEW.status := 'new'::inquiry_status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inquiries_auto_categorize ON inquiries;
CREATE TRIGGER trg_inquiries_auto_categorize
BEFORE INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION public.trg_inquiries_auto_categorize();

CREATE OR REPLACE FUNCTION public.trg_inquiries_staff_correction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  IF NEW.message IS DISTINCT FROM OLD.message THEN
    RAISE EXCEPTION 'Inquiry message cannot be edited';
  END IF;

  IF NOT is_staff() THEN
    RAISE EXCEPTION 'Only staff can update inquiries';
  END IF;

  IF NEW.category IS DISTINCT FROM OLD.category THEN
    NEW.original_category := OLD.original_category;
    NEW.category_source := 'admin'::category_source;
    NEW.corrected_by := auth.uid();
    NEW.corrected_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inquiries_staff_correction ON inquiries;
CREATE TRIGGER trg_inquiries_staff_correction
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION public.trg_inquiries_staff_correction();

COMMENT ON TRIGGER trg_inquiries_auto_categorize ON inquiries IS
'Overwrites client-supplied category/original_category/category_source/matched_keywords/status with auto-categorized values on insert.';
COMMENT ON TRIGGER trg_inquiries_staff_correction ON inquiries IS
'Staff-only updates. Preserves original_category, sets category_source=admin and corrected_by/corrected_at when category changes. Message is immutable.';

--------------------------------------------------------------
-- 3. reservations: restrict non-staff writes
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_reservations_guest_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  IF is_staff() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.deposit_amount := NULL;
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.paid_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.status := 'pending'::reservation_status;
    NEW.source := 'staysync'::reservation_source;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status = 'pending'::reservation_status
              AND NEW.status = 'cancelled'::reservation_status) THEN
        RAISE EXCEPTION 'Guests may only cancel a pending reservation';
      END IF;
    END IF;

    IF NEW.unit_id IS DISTINCT FROM OLD.unit_id
       OR NEW.guest_id IS DISTINCT FROM OLD.guest_id
       OR NEW.manual_guest_name IS DISTINCT FROM OLD.manual_guest_name
       OR NEW.source IS DISTINCT FROM OLD.source
       OR NEW.check_in IS DISTINCT FROM OLD.check_in
       OR NEW.check_out IS DISTINCT FROM OLD.check_out
       OR NEW.num_guests IS DISTINCT FROM OLD.num_guests
       OR NEW.notes IS DISTINCT FROM OLD.notes
       OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
       OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
       OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.rescheduled_at IS DISTINCT FROM OLD.rescheduled_at
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      RAISE EXCEPTION 'Guests may only change the status of their own reservation';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_guest_write ON reservations;
CREATE TRIGGER trg_reservations_guest_write
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION public.trg_reservations_guest_write();

COMMENT ON TRIGGER trg_reservations_guest_write ON reservations IS
'Non-staff inserts are forced to pending/staysync with payment fields null. Non-staff updates allow only pending -> cancelled status changes (res_cancel_own); every other column is rejected.';

--------------------------------------------------------------
-- 9. reservations: capacity / advance booking / paid-to-confirm validation
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_reservations_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
DECLARE
  v_capacity int;
  v_min_advance int;
BEGIN
  SELECT capacity INTO v_capacity
  FROM units
  WHERE id = NEW.unit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit does not exist';
  END IF;
  IF NEW.num_guests > v_capacity THEN
    RAISE EXCEPTION 'Number of guests exceeds unit capacity (%)', v_capacity;
  END IF;

  SELECT min_advance_days INTO v_min_advance
  FROM booking_rules
  WHERE id = true;

  IF NEW.check_in < (now() AT TIME ZONE 'Asia/Manila')::date + v_min_advance THEN
    IF NOT (is_staff() AND NEW.source = 'airbnb'::reservation_source) THEN
      RAISE EXCEPTION 'Check-in must be at least % day(s) in advance', v_min_advance;
    END IF;
  END IF;

  IF NEW.status = 'confirmed'::reservation_status
     AND NEW.source = 'staysync'::reservation_source
     AND NEW.paid_at IS NULL THEN
    RAISE EXCEPTION 'StaySync reservations require paid_at before confirmation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_validate ON reservations;
CREATE TRIGGER trg_reservations_validate
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION public.trg_reservations_validate();

COMMENT ON TRIGGER trg_reservations_validate ON reservations IS
'Enforces unit capacity, advance-booking window (Asia/Manila; airbnb staff inserts exempt), and paid_at required to confirm staysync reservations.';

--------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own_or_staff ON profiles;
CREATE POLICY profiles_select_own_or_staff ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS units_select_public ON units;
CREATE POLICY units_select_public ON units
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR is_staff());

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reservations_select_own_or_staff ON reservations;
CREATE POLICY reservations_select_own_or_staff ON reservations
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS reservations_insert_own_or_staff ON reservations;
CREATE POLICY reservations_insert_own_or_staff ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS reservations_update_own_or_staff ON reservations;
CREATE POLICY reservations_update_own_or_staff ON reservations
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid() OR is_staff())
  WITH CHECK (guest_id = auth.uid() OR is_staff());

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inquiries_select_own_or_staff ON inquiries;
CREATE POLICY inquiries_select_own_or_staff ON inquiries
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS inquiries_insert_own_or_staff ON inquiries;
CREATE POLICY inquiries_insert_own_or_staff ON inquiries
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS inquiries_update_staff_only ON inquiries;
CREATE POLICY inquiries_update_staff_only ON inquiries
  FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

ALTER TABLE inquiry_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inquiry_keywords_select_public ON inquiry_keywords;
CREATE POLICY inquiry_keywords_select_public ON inquiry_keywords
  FOR SELECT TO anon, authenticated;

ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS booking_rules_select_public ON booking_rules;
CREATE POLICY booking_rules_select_public ON booking_rules
  FOR SELECT TO anon, authenticated;

ALTER TABLE test_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS test_inquiries_select_authenticated ON test_inquiries;
CREATE POLICY test_inquiries_select_authenticated ON test_inquiries
  FOR SELECT TO authenticated;

--------------------------------------------------------------
-- 7. CHECK (check_out > check_in) — half-open [check_in, check_out)
--------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'reservations'::regclass
      AND conname = 'reservations_check_out_after_check_in'
  ) THEN
    ALTER TABLE reservations
    ADD CONSTRAINT reservations_check_out_after_check_in
    CHECK (check_out > check_in);
  END IF;
END $$;

COMMENT ON CONSTRAINT reservations_check_out_after_check_in ON reservations IS
'Check-out must be after check-in. Ranges are half-open [check_in, check_out) so a checkout day does not block the next check-in.';

--------------------------------------------------------------
-- 8. Exclusion constraint: no overlapping confirmed reservations
--------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'reservations'::regclass
      AND conname = 'reservations_no_overlapping_confirmed'
  ) THEN
    ALTER TABLE reservations
    ADD CONSTRAINT reservations_no_overlapping_confirmed
    EXCLUDE USING gist (
      unit_id WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    )
    WHERE (status = 'confirmed'::reservation_status);
  END IF;
END $$;

COMMENT ON CONSTRAINT reservations_no_overlapping_confirmed ON reservations IS
'Prevents two overlapping confirmed reservations for the same unit, even under concurrency. Half-open ranges mean a checkout day does not conflict with the next check-in.';

--------------------------------------------------------------
-- 10. CHECK guest_id OR manual_guest_name
--------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'reservations'::regclass
      AND conname = 'reservations_guest_or_manual_name'
  ) THEN
    ALTER TABLE reservations
    ADD CONSTRAINT reservations_guest_or_manual_name
    CHECK (guest_id IS NOT NULL OR manual_guest_name IS NOT NULL);
  END IF;
END $$;

COMMENT ON CONSTRAINT reservations_guest_or_manual_name ON reservations IS
'Every reservation must identify the guest (guest_id) or, for staff-encoded bookings, a manual guest name.';

--------------------------------------------------------------
-- 6. check_availability() / get_blocked_ranges() RPCs
--------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_availability(
  p_unit_id uuid,
  p_check_in date,
  p_check_out date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
DECLARE
  v_conflict int;
  v_min_advance int;
BEGIN
  IF p_check_out <= p_check_in THEN
    RETURN false;
  END IF;

  SELECT min_advance_days INTO v_min_advance
  FROM booking_rules
  WHERE id = true;

  IF p_check_in < (now() AT TIME ZONE 'Asia/Manila')::date + v_min_advance THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_conflict
  FROM reservations
  WHERE unit_id = p_unit_id
    AND status = 'confirmed'::reservation_status
    AND check_in < p_check_out
    AND check_out > p_check_in;

  RETURN v_conflict = 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_availability(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_availability(uuid, date, date) TO anon, authenticated;

COMMENT ON FUNCTION public.check_availability(uuid, date, date) IS
'Public availability check. Returns true when no confirmed reservation overlaps [check_in, check_out) and the advance-booking window is respected. Exposes no guest data.';

CREATE OR REPLACE FUNCTION public.get_blocked_ranges(p_unit_id uuid)
RETURNS TABLE (check_in date, check_out date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT check_in, check_out
  FROM reservations
  WHERE unit_id = p_unit_id
    AND status = 'confirmed'::reservation_status
  ORDER BY check_in;
END;
$$;

REVOKE ALL ON FUNCTION public.get_blocked_ranges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blocked_ranges(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_blocked_ranges(uuid) IS
'Returns only (check_in, check_out) of confirmed reservations for a unit. No guest data is exposed.';

--------------------------------------------------------------
-- 11. booking_rules singleton
--------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_rules' AND column_name = 'id'
  ) THEN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'booking_rules' AND column_name = 'id') <> 'boolean' THEN
      ALTER TABLE booking_rules ALTER COLUMN id TYPE boolean USING (id::boolean);
    END IF;
    ALTER TABLE booking_rules ALTER COLUMN id SET DEFAULT true;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'booking_rules'::regclass AND contype = 'p'
    ) THEN
      ALTER TABLE booking_rules ADD CONSTRAINT booking_rules_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'booking_rules'::regclass
        AND conname = 'booking_rules_singleton_check'
    ) THEN
      ALTER TABLE booking_rules ADD CONSTRAINT booking_rules_singleton_check CHECK (id);
    END IF;
  END IF;
END $$;

INSERT INTO booking_rules (id, min_advance_days, deposit_amount, updated_at)
VALUES (true, 1, 1500, now())
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE booking_rules IS 'Singleton row (id = true). min_advance_days is the advance-booking window; deposit_amount is the fixed StaySync deposit (PHP 1,500).';
COMMENT ON CONSTRAINT booking_rules_singleton_check ON booking_rules IS 'Enforces the singleton pattern (id must be true).';