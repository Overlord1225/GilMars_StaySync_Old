# Section 7: inclusivity and performance evidence

## Build measurements

Production build output was collected with `npm run build`. The baseline is the Section 6 build immediately before Section 7 changes. Bundle sizes are Vite/Rolldown output sizes; gzip figures are build-reported per-file estimates.

Build record: 2026-10-19; Windows workspace; Node v26.4.0; Vite 8.3.3. The figures below describe generated files, not a deployed production server.

| Measure | Before Section 7 | After Section 7 | Interpretation |
|---|---:|---:|---|
| Largest JavaScript file | `index`: 744.03 kB minified / 211.00 kB gzip | `supabase`: 214.17 kB minified / 55.01 kB gzip | Largest file reduced by 71.2%; no emitted JS file crosses Vite's 500 kB warning limit. |
| App entry file | 744.03 kB / 211.00 kB gzip | `index`: 50.44 kB / 14.78 kB gzip | Entry logic is split from route code and shared libraries. |
| Static entry module preload closure | 744.03 kB / 211.00 kB gzip | 524.73 kB / 153.56 kB gzip | Sum of the entry and its statically preloaded runtime, React, React DOM, router and Supabase chunks. This excludes the lazy page module and its shared UI chunks. |
| All emitted JS files combined | 744.07 kB / 211.06 kB gzip | 756.48 kB / 232.15 kB gzip | Total built output increased by 12.41 kB raw and 21.09 kB in summed per-file gzip estimates because chunks add loader and compression overhead. This is a tradeoff for route-level loading and smaller individual files. |
| Admin code | Part of the main file | `AdminLayout`: 2.76 kB; `StaffManagement`: 3.94 kB | Staff code is loaded on its route. Other admin destinations remain placeholders. |
| Build size warning | Present (744.03 kB entry) | None | Vite no longer reports an oversized JavaScript chunk. |

Route module sizes after splitting:

| Route module | Minified | Gzip |
|---|---:|---:|
| Landing | 12.20 kB | 3.56 kB |
| Stay list | 6.84 kB | 2.48 kB |
| Stay detail | 12.48 kB | 4.12 kB |
| Reservation request | 14.10 kB | 4.36 kB |
| My reservations | 5.95 kB | 2.37 kB |
| My inquiries | 4.44 kB | 1.81 kB |

These are output-file sizes, not full route transfer totals: a browser also loads the entry's static dependencies, shared UI chunks, CSS, fonts and images. The all-files row is included to prevent a smaller entry file from being mistaken for an equivalent reduction in total application code.

## Performance evaluation matrix

| Page / measure | Before | After | Measurement status and conditions |
|---|---:|---:|---|
| Landing — Lighthouse Performance | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Landing — Lighthouse Accessibility | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Landing — Lighthouse Best Practices | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Units — Lighthouse Performance | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Units — Lighthouse Accessibility | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Units — Lighthouse Best Practices | Not measured | Not measured | No Lighthouse runner or configured Supabase environment is available in this workspace. |
| Admin reservations — Lighthouse scores | Not measurable | Not measurable | The admin reservations route is a “being prepared” placeholder, not a completed reservation screen. |

No Lighthouse score is inferred from a successful build. Chrome is installed, but there is no Lighthouse CLI or browser automation runner, and the workspace has no `.env` with Supabase connection settings. Before thesis submission, run Lighthouse against a configured production-like deployment with sample data, record the Lighthouse version, date, mobile profile and throttling settings, then replace these entries with the measured scores.

## Implemented measures

- Application pages now load through React route-level dynamic imports. Admin layout and staff management code are separate route chunks, and the production-only dev-gallery stub remains small.
- The existing `StayImage` component uses explicit 1200 × 900 intrinsic dimensions, lazy loading for non-priority images and eager high-priority loading for the lead image. The account avatar image now also declares intrinsic dimensions. Image byte transfer was not measured because the repository does not include a configured image dataset or production image host.
- Guest reservation and inquiry lists render ten records per page using the shared Pagination control. This limits DOM rendering per page; the current database calls still fetch each guest's full list, so network payload is not paginated.
- The date picker provides named date buttons, a dashed blocked-date pattern and legend, 44px minimum touch targets, arrow-key movement and live selection announcements. Forms retain visible labels, linked error messaging, and focus styles. Icon-only controls located in the source review have accessible names.
- Staff-changing confirmation dialogs retain focus management and keyboard dismissal from the shared Modal component.

## Checks and limits

`npm run typecheck`, `npm run lint` and `npm run build` pass after this section. The source was reviewed for route splitting, image loading attributes, dimensions, labels and touch-target patterns. Chrome headless screenshots and DOM scroll-width checks were run for the public landing page at 360, 768 and 1280px with a temporary localhost Supabase endpoint; no horizontal document overflow was found. The data-backed stay list showed its expected connection error state because the workspace has no backend configuration. A full visual pass of every route, keyboard completion, screen-reader testing, true 200% browser zoom, a low-end Android device and slow-3G throttling were not run. These results are implementation evidence, not a WCAG audit or a complete device evaluation.

The build output confirms that the largest file is below 500 kB. It does not establish a Lighthouse score or real-user loading time. Client-side pagination reduces rendered list size but not fetched rows; server-side pagination should be considered if production datasets grow.
