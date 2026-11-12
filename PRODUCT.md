# Product

## Platform

web

## Users

- **Guests**: a mix of Filipino and foreign travelers, mostly on phones, checking dates and requesting a stay at one of the GilMars Airbnb units, or sending an inquiry. English copy and PHP prices must be clear to both groups.
- **Staff (admin) and owner (super_admin)**: the owner plus one or two staff, handling requests, deposits, the calendar, and inquiries between other work, on a laptop and sometimes a phone.
- **Capstone evaluators** (Our Lady of Fatima University): will also review the app, so it must read as a real working business product.

## Product Purpose

StaySync is a reservation and inquiry management web app for GilMars Airbnb (2 units). Guests see availability, request a direct booking, and send inquiries. Staff confirm reservations, record the deposit, enter Airbnb bookings by hand, and answer categorized inquiries. Success: no double bookings, and requests and inquiries handled from one place.

## Positioning

Direct booking and inquiry handling for a small multi-unit Airbnb, with booking rules enforced in the database and a fixed deposit recorded before confirmation. Not a channel manager: no Airbnb calendar sync.

Business rules, roles and scope limits: see README.md and the database migrations.

## Brand Commitments

- Names: GilMars (business), StaySync (app). Voice: plain, warm, short (see DESIGN.md §7).
- Logo exists at `src/assets/logo.png`: an arched "G" mark in deep green with a tan bar, a serif "GilMars" wordmark, and a spaced "StaySync" line. The app palette is aligned to the logo (brand green `#1f4e4b`, tan accent `#c9a27a`). The UI redo (2026-11) uses the "Banig Weave" direction (see DESIGN.md): warm paper background, Brygada 1918 serif headings, a green-and-tan woven band on photo frames and section edges, and the `BrandMark` SVG for the arched "G".

## Evidence on Hand

- Logo: `src/assets/logo.png`. Hero image: `src/assets/hero.png`. Favicon: `public/favicon.svg`.
- No real testimonials, reviews, or customer counts exist; do not invent them.

## Product Principles

1. The database is the source of truth; the interface never implies a booking is held before staff confirm it.
2. Guests should reach a stay request in few steps from a phone.
3. Staff screens favor scanning and speed over decoration.
4. Say what happened and what to do next, in plain words a non-native English reader can follow.
5. No claims the system cannot back: no payments, no live Airbnb sync.

## Accessibility & Inclusion

Target WCAG 2.1 AA with keyboard, screen reader, zoom, and reduced-motion support (DESIGN.md §1). Touch targets at least 44px.
