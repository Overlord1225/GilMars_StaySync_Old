-- 0000_baseline_schema.sql
-- Baseline schema: objects referenced by migrations 0001-0013 but never created by them.

-- Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('guest','admin','super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','rejected','cancelled','completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.reservation_source AS ENUM ('staysync','airbnb');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.inquiry_category AS ENUM ('booking_request','availability_inquiry','general_question','complaint');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM ('new','in_progress','resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.category_source AS ENUM ('auto','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- (helper functions defined after tables)

-- Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  contact_number text,
  role public.user_role NOT NULL,
  is_active boolean NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  capacity integer NOT NULL,
  price_per_night numeric NOT NULL,
  amenities text[] NOT NULL,
  image_urls text[] NOT NULL,
  is_active boolean NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  guest_id uuid REFERENCES public.profiles(id),
  manual_guest_name text,
  source public.reservation_source NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  num_guests integer NOT NULL,
  status public.reservation_status NOT NULL,
  notes text,
  deposit_amount numeric,
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  rescheduled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  CONSTRAINT reservations_check_out_after_check_in CHECK (check_out > check_in),
  CONSTRAINT reservations_num_guests_positive CHECK (num_guests > 0),
  CONSTRAINT reservations_guest_identity_present CHECK (guest_id IS NOT NULL OR NULLIF(BTRIM(manual_guest_name), '') IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY,
  guest_id uuid NOT NULL REFERENCES public.profiles(id),
  unit_id uuid REFERENCES public.units(id),
  message text NOT NULL,
  subject text,
  category public.inquiry_category,
  category_source public.category_source NOT NULL,
  original_category public.inquiry_category,
  status public.inquiry_status NOT NULL,
  matched_keywords text[] NOT NULL,
  corrected_by uuid REFERENCES public.profiles(id),
  corrected_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.inquiry_keywords (
  id uuid PRIMARY KEY,
  category public.inquiry_category NOT NULL,
  keyword text NOT NULL,
  language text,
  weight integer NOT NULL,
  is_active boolean NOT NULL,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.booking_rules (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  min_advance_days integer NOT NULL,
  deposit_amount numeric NOT NULL,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.test_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  expected_category public.inquiry_category NOT NULL,
  language text NOT NULL,
  created_at timestamptz
);

-- audit_log created by 0012; include minimal for FK references
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_email text NOT NULL,
  actor_role public.user_role NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  target_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin') AND p.is_active);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.is_active);
$$;

CREATE OR REPLACE FUNCTION public.manila_today()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Manila')::date;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- View
CREATE OR REPLACE VIEW public.live_categorization_stats AS
SELECT NULL::numeric AS auto_accept_pct, NULL::bigint AS corrected, NULL::bigint AS total_inquiries;

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'guest', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_units BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_reservations BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_inquiries BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_booking_rules BEFORE UPDATE ON public.booking_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- booking_rules default row
INSERT INTO public.booking_rules (id, min_advance_days, deposit_amount, updated_at)
VALUES (true, 1, 1500, now())
ON CONFLICT (id) DO UPDATE SET min_advance_days = EXCLUDED.min_advance_days, deposit_amount = EXCLUDED.deposit_amount, updated_at = now();

-- storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-images','unit-images', true)
ON CONFLICT (id) DO NOTHING;
