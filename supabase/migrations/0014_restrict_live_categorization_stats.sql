CREATE OR REPLACE VIEW public.live_categorization_stats WITH (security_barrier = true) AS
SELECT NULL::numeric AS auto_accept_pct, NULL::bigint AS corrected, NULL::bigint AS total_inquiries
WHERE public.is_staff();
