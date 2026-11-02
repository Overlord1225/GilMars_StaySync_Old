# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Guests**: a mix of Filipino and foreign travelers, mostly on phones, checking dates and requesting a stay at one of five GilMars Airbnb units, or sending an inquiry. English copy and PHP prices must be clear to both groups.
- **Staff (admin) and owner (super_admin)**: the owner plus one or two staff, handling requests, deposits, the calendar, and inquiries between other work, on a laptop and sometimes a phone.
- **Capstone evaluators** (Our Lady of Fatima University): will also review the app, so it must read as a real working business product. Inferred from CLAUDE.md, not stated by the user.

## Product Purpose

StaySync is a reservation and inquiry management web app for GilMars Airbnb (5 simulated units). Guests see availability, request a direct booking, and send inquiries. Staff confirm reservations, record the deposit, enter Airbnb bookings by hand, and answer categorized inquiries. Success: no double bookings, and requests and inquiries handled from one place.

## Positioning

Direct booking and inquiry handling for a small multi-unit Airbnb, with booking rules enforced in the database and a fixed deposit recorded before confirmation. Not a channel manager: no Airbnb calendar sync.

## Operating Context

- Check-out is exclusive; back-to-back stays are not overlaps. Only confirmed reservations block dates.
- No same-day bookings; minimum advance days come from booking rules.
- Direct bookings need a fixed deposit (default PHP 1,500). Airbnb bookings are entered manually by staff.
- Inquiry categories: booking_request, availability_inquiry, general_question, complaint. Keyword-weighted; ties and unmatched text go to general_question; admin can correct the category.
- Dates are plain `YYYY-MM-DD`; "today" is Asia/Manila.

## Capabilities and Constraints

- Roles: guest, admin, super_admin. Authorization lives in Supabase RLS and RPCs; client checks are UX only.
- Stack: React 19, TypeScript, Vite, Tailwind v4, Supabase. Client-only SPA.
- Out of scope: ML/NLP, payment processing, Airbnb calendar sync, email/SMS, dark mode.
- Terminology: reservation statuses Pending, Confirmed, Rejected, Cancelled, Completed; inquiry statuses New, In progress, Resolved, Closed.

## Brand Commitments

- Names: GilMars (business), StaySync (app). Voice: plain, warm, short (see DESIGN.md §7).
- Logo exists at `src/assets/logo.png`: an arched "G" mark in deep green with a tan bar, a serif "GilMars" wordmark, and a spaced "StaySync" line. The app palette was aligned to the logo in Part 1b (brand green `#1f4e4b`, tan accent `#c9a27a`).

## Evidence on Hand

- Logo: `src/assets/logo.png`. Hero image: `src/assets/hero.png`. Favicon: `public/favicon.svg`.
- Units, prices, and stays are simulated seed data. No real testimonials, reviews, or customer counts exist; do not invent them.

## Product Principles

1. The database is the source of truth; the interface never implies a booking is held before staff confirm it.
2. Guests should reach a stay request in few steps from a phone.
3. Staff screens favor scanning and speed over decoration.
4. Say what happened and what to do next, in plain words a non-native English reader can follow.
5. No claims the system cannot back: no payments, no live Airbnb sync.

## Accessibility & Inclusion

Target WCAG 2.1 AA with keyboard, screen reader, zoom, and reduced-motion support (DESIGN.md §1). Touch targets at least 44px.
