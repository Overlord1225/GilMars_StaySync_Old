# StaySync

StaySync is a web reservation and inquiry-management system for GilMars Airbnb and a Software Engineering 2 capstone project at Our Lady of Fatima University.

The app uses React, TypeScript, Vite, Tailwind CSS, and Supabase. Supabase provides authentication, PostgreSQL, Row Level Security (RLS), Storage, and an Edge Function. The browser uses only the Supabase project URL and public client key. Never put a service-role key in frontend code or Vite environment variables.

## Requirements

- Node.js 22 or newer
- npm
- A Supabase project configured with this repository's database schema and migrations

## Run locally

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Copy `.env.example` to `.env` and set the public project credentials:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-public-key
   ```

   In PowerShell, use `Copy-Item .env.example .env`.

3. Start the development server:

   ```sh
   npm run dev
   ```

Open the local URL printed by Vite. The app needs valid Supabase credentials.

## Useful commands

| Command                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the development server.                        |
| `npm run build`        | Type-check and create a production build in `dist/`. |
| `npm run preview`      | Preview the production build locally.                |
| `npm run typecheck`    | Type-check without emitting.                         |
| `npm run lint`         | Run Oxlint.                                          |
| `npm test`             | Run the Vitest suite.                                |
| `npm run format:check` | Check Prettier formatting (also run in CI).          |

## Routes and roles

`/` is the sign-in landing page (also reachable at `/login`, which redirects to `/`). Public routes include `/`, `/units`, `/units/:id`, `/availability`, `/help`, `/register`, `/forgot-password`, and `/reset-password`.

Each role stays in its own area. Guest routes (`/reservations/request/:id`, `/my-bookings`, `/my-inquiries`, `/inquire`, `/account`) are guest-only.

Admin (staff) routes under `/admin`: dashboard, `reservations`, `calendar`, `inquiries`, `units`, `guests`, `keywords`, `booking-rules`, `account`. `/tests/accuracy` is also admin-only.

Super-admin (owner) routes under `/super`: dashboard (reservation, inquiry and unit charts), `accounts` (guest and admin accounts in tabs), `account`. Super admins manage accounts only; they cannot change reservations, units, keywords or rules.

Staff account creation uses `supabase/functions/create-staff`. It checks that the caller is an active super admin, validates input, and uses a service-role key stored in Supabase Function secrets only.

## Implemented workflows

- Guests browse stays, inspect photos and amenities, check availability, submit reservation requests, submit deposit references, cancel pending requests, and track inquiry/reservation status.
- Staff review and update reservations, record deposit payments, add Airbnb reservations manually, reschedule emergencies, manage units and guest access, and work the inquiry inbox.
- Super admins manage guest and staff accounts and view dashboard charts. Admins manage booking rules and inquiry keywords.
- Availability checks and reservation validation run through database functions. Only confirmed reservations block dates; check-out dates are exclusive.
- A database trigger categorizes inquiries from active weighted keywords. Ties and unmatched text resolve to `general_question`.
- Admins can upload unit photos to the `unit-images` Storage bucket.

## Database, seed data, and verification

Migrations are in `supabase/migrations/` (`0000` through `0017`). Versions up to `0012` were reported applied on 2026-10-20; confirm `0013`-`0017` against the remote history before applying. Check migration history before applying anything; do not rerun these migrations solely because the files exist locally. Version `0006` is recorded remotely as `remove_profile_contact_number`, while the local filename is `0006_stop_collecting_profile_contact_number.sql`.

The read-only preflight is `supabase/verify_assumptions.sql`. Checks shared on 2026-10-20 confirmed the expected columns, staff helper functions, auth profile trigger, the checked policies for profiles/reservations/inquiries, and no existing overlapping confirmed reservations. The Storage bucket/policies and complete app workflows still need verification on a non-production project.

`supabase/seed.sql` contains illustrative sample units, inquiry keywords, and 52 labeled test inquiries. The sample units have empty photo URL arrays. Review seed data and use it only in development or test databases.

Manual security and workflow scenarios are in `supabase/tests/exploit_checks.md`. Run write scenarios only inside a transaction that is rolled back (BEGIN ... ROLLBACK); some scenarios attempt unauthorized writes or modify reservations.

Additional project references: none found in repo (System.md, Database.md, PlanFixesAndImprovements.md do not exist).

## Security notes

- Authorization lives in RLS and RPCs; client checks are UX only.
- Unit photos: JPEG, PNG or WebP, max 5 MB (client check plus bucket limits from `0017`).
- `vercel.json` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
- `npm audit` reports no known vulnerabilities.

## Remaining work and limitations

- Audit log entries are written from the browser, so staff can forge or skip them; move logging into RPCs or triggers.
- Admins can file inquiries on a guest's behalf, and deactivated guests can still insert inquiries or cancel reservations directly; RPCs enforce `is_active`, table policies do not.
- `create-staff` allows any origin (CORS `*`); it relies on a bearer token, not cookies.
- No Content-Security-Policy yet; other security headers are set in `vercel.json`.
- Booking status changes do not trigger app email or SMS notifications.
- Removing a photo from a stay unlinks its URL but does not delete the Storage object.
- Keyword matching can misclassify typos or ambiguous messages. It is rule-based and does not use machine learning or NLP.
- Payments are recorded as external GCash or bank-transfer deposits; the app does not process payments.
- Airbnb reservations are entered manually; Airbnb calendar sync is not implemented.
- Multi-property support and refund tracking are out of scope.

## Project layout

- `src/pages/` - route-level screens
- `src/components/` - shared UI, layout, auth, and public components
- `src/features/auth/` - auth state, role checks, and redirects
- `src/lib/` - Supabase client, database types, date helpers, and shared utilities
- `supabase/migrations/` - ordered SQL migrations
- `supabase/functions/` - Supabase Edge Functions
- `supabase/seed.sql` - illustrative development seed data
