-- RLS already blocks anon writes, but the default grants also gave anon and
-- authenticated TRUNCATE (which bypasses RLS), REFERENCES and TRIGGER, and gave
-- anon INSERT/UPDATE/DELETE. Remove what no client flow needs.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
