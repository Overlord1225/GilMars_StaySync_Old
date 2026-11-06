-- inquiries.id had no default, so guest inserts failed with 23502.
ALTER TABLE public.inquiries
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
