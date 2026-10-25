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

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run Oxlint. |
| `npm test` | Run the Vitest suite. |

## Routes and roles

`/` is the sign-in landing page (also reachable at `/login`, which redirects to `/`). Public routes include `/`, `/units`, `/units/:id`, `/availability`, `/help`, `/register`, `/forgot-password`, and `/reset-password`.

Guest-facing routes (`/reservations/request/:id`, `/my-bookings`, `/my-inquiries`, `/inquire`, `/account`) are open to guests, admins, and super admins so staff can view and assist with guest bookings.

Staff routes under `/admin` include the dashboard, reservations, inquiries, units, guests, and staff management. Super-admin routes include `/super/accounts`, `/super/keywords`, `/super/booking-rules`, and `/tests/accuracy`. Staff account creation uses `supabase/functions/create-staff`; store its service-role key in Supabase Function secrets only.

## Implemented workflows

- Guests browse stays, inspect photos and amenities, check availability, submit reservation requests, submit deposit references, cancel pending requests, and track inquiry/reservation status.
- Staff review and update reservations, record deposit payments, add Airbnb reservations manually, reschedule emergencies, manage units and guest access, and work the inquiry inbox.
- Super admins manage staff accounts, booking rules, and inquiry keywords.
- Availability checks and reservation validation run through database functions. Only confirmed reservations block dates; check-out dates are exclusive.
- A database trigger categorizes inquiries from active weighted keywords. Ties and unmatched text resolve to `general_question`.
- Admins can upload unit photos to the `unit-images` Storage bucket.

## Database, seed data, and verification

Migrations are in `supabase/migrations/` (`0001` through `0011`). The linked Supabase project reported all versions as applied on 2026-10-20. Check migration history before applying anything; do not rerun these migrations solely because the files exist locally. Version `0006` is recorded remotely as `remove_profile_contact_number`, while the local filename is `0006_stop_collecting_profile_contact_number.sql`.

The read-only preflight is `supabase/verify_assumptions.sql`. Checks shared on 2026-10-20 confirmed the expected columns, staff helper functions, auth profile trigger, the checked policies for profiles/reservations/inquiries, and no existing overlapping confirmed reservations. The Storage bucket/policies and complete app workflows still need verification on a non-production project.

`supabase/seed.sql` contains illustrative sample units, inquiry keywords, and 52 labeled test inquiries. The sample units have empty photo URL arrays. Review seed data and use it only in development or test databases.

Manual security and workflow scenarios are in `supabase/tests/exploit_checks.md`. Run them only against a test project with test accounts; some scenarios attempt unauthorized writes or modify reservations.

Additional project references: [System.md](System.md), [Database.md](Database.md), and [PlanFixesAndImprovements.md](PlanFixesAndImprovements.md).

## Remaining work and limitations

- A monthly staff reservation calendar or timeline is not implemented; staff currently use a filtered list.
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
