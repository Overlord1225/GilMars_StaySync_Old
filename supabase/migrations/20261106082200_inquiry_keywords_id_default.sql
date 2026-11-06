-- inquiry_keywords.id had no default, so adding a keyword failed with 23502.
ALTER TABLE public.inquiry_keywords
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
