-- Corrects the five earlier feature migrations of 2026-11-09: operational
-- writes belong to admins (is_admin()), not the super admin (see 0016). The
-- super admin keeps account management and dashboard reads only.

CREATE OR REPLACE FUNCTION public.add_date_block(
  p_unit_id uuid,
  p_reason text,
  p_start date,
  p_end date
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access is required to block dates' USING ERRCODE = '42501';
  END IF;
  IF NULLIF(BTRIM(p_reason), '') IS NULL OR p_end <= p_start THEN
    RAISE EXCEPTION 'A reason and a valid date range are required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.units WHERE id = p_unit_id AND is_active = true) THEN
    RAISE EXCEPTION 'Choose an active unit' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_unit_id::text, 0));
  INSERT INTO public.reservations (
    unit_id, guest_id, manual_guest_name, source, check_in, check_out,
    num_guests, status, reviewed_by, reviewed_at
  ) VALUES (
    p_unit_id, NULL, BTRIM(p_reason), 'block'::public.reservation_source,
    p_start, p_end, 1, 'confirmed'::public.reservation_status, auth.uid(), now()
  ) RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.expire_stale_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_hours integer;
  v_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access is required to expire requests' USING ERRCODE = '42501';
  END IF;

  SELECT pending_expiry_hours INTO v_hours FROM public.booking_rules WHERE id = true;
  IF v_hours IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled'::public.reservation_status,
      notes = CONCAT_WS(
        E'\n', notes,
        'Expired automatically: no payment reference within ' || v_hours || ' hours.'
      )
  WHERE status = 'pending'::public.reservation_status
    AND source = 'staysync'::public.reservation_source
    AND paid_at IS NULL
    AND NULLIF(BTRIM(payment_reference), '') IS NULL
    AND created_at < now() - make_interval(hours => v_hours);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- reservation_staff_notes: admins only
DROP POLICY reservation_staff_notes_select_staff ON public.reservation_staff_notes;
DROP POLICY reservation_staff_notes_insert_staff ON public.reservation_staff_notes;
CREATE POLICY reservation_staff_notes_select_admin
  ON public.reservation_staff_notes FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY reservation_staff_notes_insert_admin
  ON public.reservation_staff_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND staff_id = auth.uid());

-- reply_templates: admins only
DROP POLICY reply_templates_select_staff ON public.reply_templates;
DROP POLICY reply_templates_insert_staff ON public.reply_templates;
DROP POLICY reply_templates_delete_staff ON public.reply_templates;
CREATE POLICY reply_templates_select_admin
  ON public.reply_templates FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY reply_templates_insert_admin
  ON public.reply_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());
CREATE POLICY reply_templates_delete_admin
  ON public.reply_templates FOR DELETE TO authenticated
  USING (public.is_admin());

-- unit_stay_info: admins write; admins and confirmed guests read
DROP POLICY unit_stay_info_select ON public.unit_stay_info;
DROP POLICY unit_stay_info_insert_staff ON public.unit_stay_info;
DROP POLICY unit_stay_info_update_staff ON public.unit_stay_info;
DROP POLICY unit_stay_info_delete_staff ON public.unit_stay_info;
CREATE POLICY unit_stay_info_select
  ON public.unit_stay_info FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.unit_id = unit_stay_info.unit_id
        AND r.guest_id = auth.uid()
        AND r.status = 'confirmed'::public.reservation_status
    )
  );
CREATE POLICY unit_stay_info_insert_admin
  ON public.unit_stay_info FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY unit_stay_info_update_admin
  ON public.unit_stay_info FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY unit_stay_info_delete_admin
  ON public.unit_stay_info FOR DELETE TO authenticated
  USING (public.is_admin());
