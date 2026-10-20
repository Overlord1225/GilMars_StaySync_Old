# StaySync

StaySync is a web-based reservation and inquiry management system for GilMars Airbnb. It is a Software Engineering 2 capstone project at Our Lady of Fatima University.

The app is built with React, TypeScript, Vite, Tailwind CSS, and Supabase. Supabase provides authentication and the PostgreSQL database. The browser uses only the Supabase project URL and anon key; never put a service-role key in frontend environment variables.

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
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   In PowerShell, you can copy the example with `Copy-Item .env.example .env`.

3. Start the development server:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite. The app requires valid Supabase credentials to load.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run Oxlint. |
| `npm test` | Run the Vitest test suite. |

## Current routes and implementation status

Public and guest routes include the landing page (`/`), unit list and details (`/units`, `/units/:id`), availability (`/availability`), help (`/help`), registration and sign-in (`/register`, `/login`), password recovery, guest reservation requests, `/my-bookings`, `/my-inquiries`, `/inquire`, and `/account`. Guest pages are protected by role-aware route guards. Booking deposits and minimum advance days shown on guest screens load from `booking_rules`.

Admin routes are under `/admin`: dashboard, reservation review and payment recording, inquiry inbox and correction, unit management and photos, guest records, and staff management. Super admins also have keyword settings (`/super/keywords`), booking rules (`/super/booking-rules`), and the accuracy test (`/tests/accuracy`). Staff account creation calls the `create-staff` Edge Function; keep its service-role key in Supabase Function secrets, never in a Vite environment variable.

## Implemented workflows

The app now has a staff dashboard, reservation review and payment recording, inquiry inbox and correction, unit editing and image uploads, guest access management, staff account creation, keyword and booking-rule management, and inquiry/overlap evaluation. Verify these flows against a test Supabase project before using production data.

- Inquiry categories use active weighted keywords. Ties and unmatched messages resolve to `general_question`.
- Only confirmed reservations block dates; check-out dates are exclusive, so back-to-back stays remain valid.
- Staff can record deposits, confirm/reject requests, add Airbnb stays, reschedule emergencies, cancel, and complete bookings.
- Super admins manage staff accounts, keyword rules, booking rules, and evaluation data.

## Database

SQL migrations are in `supabase/migrations/` and should be reviewed and applied in numeric order to the intended Supabase project. Migrations `0001`-`0006` cover profile/signup protections, reservation rules, inquiry integrity, overlap protection, profile access, and the decision to omit new contact numbers. Migrations `0007`-`0009` align inquiry tie behavior, allow staff to update guest active status, and add staff reservation RPCs plus guest payment-reference submission. Check migration preconditions against the target schema before applying; the repository does not apply them automatically. The Supabase CLI configuration is in `supabase/config.toml`.

`supabase/seed.sql` contains illustrative sample units and inquiry keywords. Review it before running: the sample unit records are not real property information. Additional schema notes and security review materials are in `Database.md`, `supabase/verify_assumptions.sql`, and `supabase/tests/exploit_checks.md`.

### Deploying the staff account function

Deploy `supabase/functions/create-staff` to the intended project after reviewing it. The function requires the Supabase URL, anon key, and service-role key as Edge Function secrets. Never add the service-role key to `.env`, `.env.local`, `.env.example`, or frontend code. The function verifies the caller's active super-admin profile before creating an admin account.

## Project layout

- `src/pages/` — route-level screens
- `src/components/` — shared UI, layout, auth, and public components
- `src/features/auth/` — auth state, role checks, and redirects
- `src/lib/` — Supabase client, database types, date helpers, and shared utilities
- `supabase/migrations/` — ordered SQL migrations
- `supabase/seed.sql` — optional illustrative seed data
- `docs/` — design and project review documents

## Scope

The project is intended to support guest stay discovery and reservation requests, staff reservation and inquiry workflows, and super-admin configuration. Availability and booking rules are backed by Supabase database logic. Payments are recorded as external GCash or bank-transfer deposits; the app does not process online payments or synchronize Airbnb calendars. Inquiry categorization is rule-based and does not use machine learning or NLP models.
