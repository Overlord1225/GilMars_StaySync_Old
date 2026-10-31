CREATE OR REPLACE FUNCTION public.get_calendar_month(
  p_unit_id uuid,
  p_month date
)
RETURNS TABLE (
  id uuid,
  unit_id uuid,
  check_in date,
  check_out date,
  num_guests integer,
  status public.reservation_status,
  source public.reservation_source,
  guest_id uuid,
  guest_display_name text,
  manual_guest_name text,
  notes text,
  deposit_amount numeric,
  payment_method text,
  payment_reference text,
  paid_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access is required to view the calendar'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.unit_id,
    r.check_in,
    r.check_out,
    r.num_guests,
    r.status,
    r.source,
    r.guest_id,
    COALESCE(p.full_name, r.manual_guest_name) AS guest_display_name,
    r.manual_guest_name,
    r.notes,
    r.deposit_amount,
    r.payment_method,
    r.payment_reference,
    r.paid_at
  FROM public.reservations AS r
  LEFT JOIN public.profiles AS p ON p.id = r.guest_id
  WHERE r.unit_id = p_unit_id
    AND r.status <> 'rejected'::public.reservation_status
    AND r.status <> 'cancelled'::public.reservation_status
    AND r.check_in < (date_trunc('month', p_month) + interval '1 month')::date
    AND r.check_out > date_trunc('month', p_month)::date;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_calendar_month(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_calendar_month(uuid, date) TO authenticated;
