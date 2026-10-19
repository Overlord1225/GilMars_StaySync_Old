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

Public and guest routes include the landing page (`/`), unit list and details (`/units`, `/units/:id`), availability (`/availability`), help (`/help`), registration and sign-in (`/register`, `/login`), password recovery, guest reservation requests, `/my-bookings`, `/my-inquiries`, `/inquire`, and `/account`. Guest pages are protected by role-aware route guards.

Admin routes are under `/admin`. Staff account management is implemented at `/admin/staff` for super admins. The admin dashboard, reservation, inquiry, unit, and guest management screens, plus keyword, booking-rule, and accuracy-test screens, are currently placeholders or unfinished. See `src/App.tsx` for the live route map.

## Planned features

The following work remains on the project roadmap. These are planned features, not a claim that the corresponding workflows are already complete.

1. **Inquiry classification and staff inbox** — classify submitted inquiries using active weighted keywords, with English, Filipino, and Taglish terms. Save the selected category, matched keywords, and original category. If no category scores highest or categories tie, use `general_question`. Add an admin inbox for filtering inquiries, correcting categories while retaining the original, and updating inquiry status.
2. **Reservation and availability workflows** — finish the guest request flow and staff reservation workspace, including payment recording, confirmation/rejection, manual Airbnb entries, emergency rescheduling, cancellation, and completion. Keep availability based on confirmed reservations and allow back-to-back stays.
3. **Property and guest administration** — let staff manage units and review guest records, including unit details such as capacity, nightly price, amenities, images, and active status.
4. **Super-admin configuration** — manage staff accounts, inquiry keywords, and booking rules such as minimum advance days and deposit amount.
5. **Accuracy and overlap evaluation** — provide an inquiry-classification accuracy page with per-category results and a confusion table, and evaluate reservation overlap behavior with sample records. Add reviewed seed data for these evaluations.
6. **Polish and verification** — complete responsive layouts and loading, error, and empty states, then verify the finished workflows against the database rules and project requirements.

## Database

SQL migrations are in `supabase/migrations/` and should be reviewed and applied in numeric order to the intended Supabase project. They cover profile and signup protections, reservation rules and guest RPCs, inquiry integrity, confirmed-reservation overlap protection, profile access, and the removal of new profile contact-number collection. Check the migration comments and project assumptions before applying them to a shared or production database. The Supabase CLI configuration is in `supabase/config.toml`.

`supabase/seed.sql` contains illustrative sample units and inquiry keywords. Review it before running: the sample unit records are not real property information. Additional schema notes and security review materials are in `Database.md`, `supabase/verify_assumptions.sql`, and `supabase/tests/exploit_checks.md`.

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
