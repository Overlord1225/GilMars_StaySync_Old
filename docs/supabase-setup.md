# Supabase Setup

## Project creation

1. Create a new Supabase project in the dashboard.
2. Copy the project ref and run: `npx supabase link --project-ref <REF>`
3. Run migrations: `npx supabase db push`
4. Run required seed: `npx supabase db execute --file supabase/seed-required.sql` (or via SQL editor)
5. Optional dev seed: `npx supabase db execute --file supabase/seed-dev.sql` (never on production)

## .env values

- VITE_SUPABASE_URL=https://<ref>.supabase.co
- VITE_SUPABASE_ANON_KEY=<anon key>

## Bucket setup

- Bucket `unit-images` is created by migration 0003 with RLS policies. Ensure it is public if needed.

## Auth settings and Google OAuth redirect URIs

- Enable Email provider.
- Enable Google provider; set client id/secret in dashboard.
- Redirect URIs: http://localhost:5173/auth/callback and https://<site>/auth/callback in both Google Cloud Console and Supabase.

## Email / SMTP (Resend)

- Provider: Resend (smtp.resend.com, port 587, user `resend`).
- Auth email uses `onboarding@resend.dev` as sender until a custom domain is verified; production sending requires a verified domain with SPF/DKIM/DMARC records.
- Set `RESEND_API_KEY` in your local `.env` (for `supabase start`) and in the Supabase Dashboard → Authentication → SMTP Settings (password field).
- Never commit `RESEND_API_KEY` to git.

## Promote first super admin

- After first user signs up, update profiles set role='super_admin', is_active=true where email=... via SQL editor.

## Recover from deleted project

- Create new project, link, push migrations, run seed-required, restore data from backup (backups/), update .env, redeploy.
