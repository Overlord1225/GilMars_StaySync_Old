# StaySync Design System

Single reference for how StaySync looks, behaves, and is built. Source of truth for tokens is `src/index.css` (`@theme`). Shared components live in `src/components/ui`. When this file and the code disagree, fix one of them in the same change.

## 1. Principles

1. **Editorial boutique stay.** Warm paper backgrounds, deep logo green, a tan accent used in small details, and a serif display face that echoes the logo wordmark. Hierarchy comes from type size and whitespace, not boxes. No gradients, glass blur or glow.
2. **Clarity over decoration.** Every screen answers: where am I, what is the state, what can I do next.
3. **Accessible by default.** Target WCAG 2.1 AA. Keyboard, screen reader, zoom, and reduced-motion users get the same flows.
4. **Tokens, not values.** Use a token if one exists. Add a token before adding a one-off value.
5. **Mobile first.** Guests book from phones. Layouts start at 320px.

## 2. Design tokens

All tokens are in `src/index.css`. Tailwind v4 generates utilities from them (`bg-brand`, `text-ink-muted`, `rounded-card`, `z-modal`, `text-2xs`, ...).

### Color

| Role        | Token                                                                   | Value                | Use                                                                                    |
| ----------- | ----------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| Brand       | `brand`                                                                 | `#1f4e4b`            | Primary actions, links, active nav                                                     |
| Brand dark  | `brand-dark`                                                            | `#143432`            | Headings, hover on primary, dark sections                                              |
| Brand light | `brand-light`                                                           | `#e4efed`            | Hover/active background, chips, skeletons                                              |
| Mango       | `mango`, `mango-light`                                                  | `#c9a27a`, `#f6ecdf` | Accent: step numbers, price pills, CTA on dark. Fill only, never text on white (2.4:1) |
| Sky         | `sky`                                                                   | `#d9e8e5`            | Hero and illustration backgrounds                                                      |
| Page        | `paper`                                                                 | `#faf7f2`            | App background                                                                         |
| Surface     | `surface`                                                               | `#ffffff`            | Cards, inputs, menus                                                                   |
| Rule        | `rule`, `rule-strong`                                                   | `#e3ddd2`, `#7b8681` | `rule` for dividers and card borders; `rule-strong` for control outlines (3:1)         |
| Ink         | `ink`                                                                   | `#1b2b28`            | Body copy                                                                              |
| Muted ink   | `ink-muted`                                                             | `#52605b`            | Secondary copy, labels                                                                 |
| Success     | `success-50/200/700`                                                    |                      | Confirmations                                                                          |
| Warning     | `warning-50/200/700/800`                                                |                      | Unsaved changes, pending attention                                                     |
| Danger      | `danger-50/200/700/800`                                                 |                      | Errors, destructive actions                                                            |
| Status      | `status-pending`, `-confirmed`, `-rejected`, `-cancelled`, `-completed` |                      | Reservation and inquiry status. Use `StatusBadge`, not raw colors                      |
| Overlay     | `overlay`                                                               | brand-dark at 55%    | Modal backdrop                                                                         |

Rules:

- Never use raw Tailwind palette classes (`slate-*`, `red-*`, `gray-*`, `bg-white`, `bg-black/5`). Use the tokens above. `text-white` on `brand`/`brand-dark`/`danger-700` fills is allowed.
- Never use color alone to carry meaning. Status badges include an icon and a text label.
- Body text on `paper`/`surface` must keep 4.5:1 contrast; large text and UI borders 3:1.

### Typography

| Role                                 | Font               | Notes                                                                                                  |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Headings (`h1`-`h6`, `font-heading`) | Newsreader 400-600 | Serif; also used for prices and the hero. In `@layer base`, so utilities like `text-white` override it |
| Body and UI                          | Figtree 400-700    | Default `font-sans`                                                                                    |

Scale (1.25 ratio): `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18 (kept as an intermediate step), `text-xl` 20, `text-2xl` 25, `text-3xl` 31, `text-4xl` 39, `text-5xl` 49, `text-6xl` 61. Admin page titles drop one step. `text-2xs` (11px) is for dense micro-labels only (calendar cells, table headers on tiny screens). Body copy is never below `text-sm`.

Do not put small uppercase labels above headings. Reserve `tracking-eyebrow` for genuine micro-labels.

Line length: keep prose under about 65ch (`max-w-2xl`). Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty` (set globally in `index.css`). Numeric table cells use `tabular-nums` so amounts and dates align.

### Shape, elevation, motion, layering

- Radius: `rounded-control` 4px (inputs, buttons, menu items), `rounded-card` 8px (cards, dropdowns, photos), `rounded-panel` 12px. The landing hero art uses an arch (`rounded-t-full`); nothing else does.
- Shadow: none at rest (`shadow-soft` is `none`). `shadow-raised` only for menus, dialogs and toasts. Lists use rules (`divide-rule`), not a card per row.
- Motion: `duration-ui` (200ms) with `ease-ui`. Transitions are for color, opacity, shadow only. `prefers-reduced-motion` is honored globally in `index.css`; do not rely on component-level `motion-reduce:` alone.
- Z-index: `z-sticky` 10 (sticky headers), `z-dropdown` 20 (menus, tooltips), `z-overlay` 40, `z-modal` 50, `z-toast` 60. Never write numeric `z-20`, `z-50`.
- Spacing: Tailwind's 4px scale. Page gutters `px-4 sm:px-6 lg:px-8`; vertical rhythm `space-y-6` between page sections, `space-y-4`/`space-y-5` inside forms and cards.

## 3. Focus

One focus style, defined once in `index.css`: a 3px surface gap plus a 2px brand ring (`--shadow-focus`), applied to every `:focus-visible`. Under forced-colors it becomes a 2px `CanvasText` outline.

- Do not add `focus:ring-*`, `focus-visible:ring-*`, or `outline-none` to components.
- Exception: controls on dark brand backgrounds may use `focus-visible:ring-2 focus-visible:ring-white` (hero links in `AuthShell`, `Landing` CTA).
- Never remove focus without a replacement. Custom widgets must be reachable and show focus.

## 4. Layout

### Shells

| Shell  | File                      | Used for                                  | Landmarks                                                                                   |
| ------ | ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Public | `layout/PublicLayout.tsx` | Landing, units, availability              | `header > nav`, `main#main-content`, `footer`                                               |
| Guest  | `layout/GuestLayout.tsx`  | Guest account pages (guests only)         | `header > nav`, `main#guest-content`, `footer`                                              |
| Admin  | `layout/AdminLayout.tsx`  | `/admin/*`, `/super/*`, `/tests/accuracy` | sidebar `aside > nav` on desktop, `header` + `details` menu on mobile, `main#admin-content` |
| Auth   | `auth/AuthShell.tsx`      | Login, register, password reset           | `h1` supplied by the shell                                                                  |

Public and Guest shells share `SiteHeader` (inline links at `md+`, a `details` Menu below, closed on route change) and `SiteFooter`, both driven by `layout/siteNav.ts`. Every shell has a skip link as the first focusable element, one `main`, and labelled `nav`s. The admin mobile menu closes when the route changes.

### Page anatomy

```
PageHeader        -> the page's only <h1>, breadcrumbs, description, actions
<section aria-labelledby=...>   one per content block, each with an <h2>
  Card / Table / form
EmptyState        -> when there is no data
Pagination        -> below long lists
```

- Max content width `max-w-7xl`; form pages `max-w-2xl`.
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024). Admin sidebar appears at `lg`.
- Touch targets are at least 44px (`min-h-11`) on every interactive control.

## 5. Components (`src/components/ui`)

Use these before writing markup. Match their props; do not restyle from the outside.

| Component                                           | Use                      | Notes                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                                            | Any action               | Variants `primary` (one per view), `secondary`/`outline` (same look, `outline` is an alias), `ghost`, `danger`. `loading` sets `aria-busy` and disables. Navigation is a link, not a button                                                                        |
| `Input`, `Select`, `Textarea`, `Checkbox`           | Form fields              | Require `id` and `label`. `hint` and `error` are wired with `aria-describedby`; invalid sets `aria-invalid`. Always use instead of raw `<input>` for text-like fields                                                                                              |
| `Card`                                              | Grouped content          | `as` = `div` (default), `section`, `article`, `li`. Use the semantic tag that matches the content. `elevated={false}` drops the shadow. Lists of rows use one `Card padded={false}` holding `ul.divide-y.divide-border` with `li.p-4 sm:p-5`, never a Card per row |
| `PageHeader`                                        | Top of every page        | Renders `header`, `h1`, optional breadcrumbs, actions                                                                                                                                                                                                              |
| `Breadcrumbs`                                       | Location                 | Inside `PageHeader` via `breadcrumbs`. Only for paths two or more levels deep (Stays > Unit); not on admin pages or top-level pages                                                                                                                                |
| `Table`                                             | Tabular data             | Requires `caption` (screen-reader only). Collapses to stacked cards under `md` with `data-label`                                                                                                                                                                   |
| `Tabs`, `Stepper`, `Pagination`                     | Navigation within a view | Keep `label` props meaningful, they become `aria-label`s                                                                                                                                                                                                           |
| `Modal`, `ConfirmDialog`                            | Dialogs                  | `Modal` handles focus trap, Escape, scroll lock, focus return, `aria-modal`, labelling. Destructive or irreversible actions always go through `ConfirmDialog` with a stated consequence. Never `window.confirm` for actions                                        |
| `Toast` via `useToast`                              | Result of an action      | `success`, `error`, `info`. Errors announce assertively, others politely. Not for validation errors                                                                                                                                                                |
| `StatusBadge`, `Badge`                              | State labels             | `StatusBadge` maps reservation and inquiry statuses to color, icon, and label                                                                                                                                                                                      |
| `EmptyState`                                        | No data or load error    | Title, one sentence, one next-step action. Title is an `h3`; pass `headingLevel={2}` when it follows the page `h1` directly, `headingLevel={1}` when it is the only content                                                                                        |
| `Skeleton`, `Spinner`                               | Loading                  | Skeleton for page/list loads (give it a `label`), spinner for inline button/section work                                                                                                                                                                           |
| `Tooltip`                                           | Supplemental hint        | Never the only place a critical instruction lives                                                                                                                                                                                                                  |
| `Avatar`, `StatusTimeline`, `Head`, `ErrorBoundary` | As named                 | Wrap lazy pages in `withErrorBoundary`                                                                                                                                                                                                                             |

### States every interactive component covers

default, hover, focus-visible, active, disabled (`opacity-55`, `cursor-not-allowed`), loading, error. Data views cover loading (skeleton), empty (`EmptyState`), error (message plus retry), and success.

## 6. Semantic HTML rules

1. One `<h1>` per page (`PageHeader` or `AuthShell`). Headings descend without skipping levels.
2. Group content in `<section aria-labelledby>`; standalone items in `<article>`.
3. Lists of items are `<ul>`/`<ol>` with `<li>` (use `Card as="li"`). Key-value facts (price, dates, guests) are `<dl>`/`<dt>`/`<dd>`.
4. Dates and times use `<time dateTime="YYYY-MM-DD">` with text from `formatStayDate`. Money uses `formatCurrency` (PHP).
5. Actions are `<button type="button|submit">`; navigation is `<a>`/`<Link>`. Never `onClick` on `div`/`span`.
6. Forms: every field has a visible `<label>`; group related fields in `<fieldset><legend>`; errors link via `aria-describedby`; summary-level errors use `role="alert"`; status messages use `role="status"`.
7. Toggle buttons expose state (`aria-pressed`); tabs use `role="tab"`/`aria-selected`; current page links get `aria-current` (NavLink does this).
8. Icon-only controls have `aria-label`; decorative icons have `aria-hidden="true"`.
9. Images have meaningful `alt` or `alt=""` if decorative. Set `width`/`height` or an aspect ratio to avoid layout shift.
10. Tables have `<caption>`, `<th scope>`; never use tables for layout.
11. Use `sr-only` text for context that sighted users get visually (for example "to" between dates).

## 7. Content and tone

- Plain, warm, short. Say what happened and what to do next: "We couldn’t cancel that request. Please try again."
- Use typographic apostrophes (’), never mojibake. Files are UTF-8.
- Buttons are verb phrases: "Send request", "Cancel stay". Destructive dialogs name the object and have a safe default label ("Keep stay").
- Status words: Pending, Confirmed, Rejected, Cancelled, Completed; inquiries: New, In progress, Resolved, Closed.
- Dates: `formatStayDate`. Check-out is exclusive, so say "Check-out" not "last night". Times are Asia/Manila.
- Money: `PHP 1,500` via `formatCurrency`. The deposit is fixed by booking rules; do not hardcode it in copy.
- Never show raw database or Supabase error text to guests; map it to a friendly message.

## 8. Do and don't

| Do                                               | Don't                                           |
| ------------------------------------------------ | ----------------------------------------------- |
| `text-ink-muted`, `bg-surface`, `border-rule` | `text-slate-600`, `bg-white`, `border-gray-200` |
| `z-dropdown`, `z-modal`                          | `z-30`, `z-50`                                  |
| `text-2xs`, `tracking-eyebrow`                   | `text-[10px]`, `tracking-[0.18em]`              |
| `ConfirmDialog` for cancel/reject/delete         | `window.confirm`                                |
| `Input`/`Select`/`Textarea`                      | Raw `<input>` styled by hand                    |
| `Card as="li"` inside `<ul>`                     | `div` stacks for lists                          |
| Global focus ring                                | Per-component `ring-*` focus styles             |
| `Button` variants                                | New one-off button classes                      |
| New token in `@theme` when a value repeats       | The same arbitrary value in 3 places            |

`useUnsavedChangesGuard` keeps the native `confirm`: browsers do not allow custom UI in `beforeunload`.

## 9. Review checklist

Before merging UI work:

- [ ] One `h1`, logical heading order, landmarks present, skip link works.
- [ ] Tab through the page: every control reachable, one visible focus ring, logical order.
- [ ] Works at 320px and 1280px with no horizontal scroll; text zoom 200% still usable.
- [ ] Loading, empty, error states exist.
- [ ] No raw palette classes or numeric z-index (`grep -rE '\b(text|bg|border)-(slate|gray|red|green|amber)' src`).
- [ ] Destructive actions use `ConfirmDialog`.
- [ ] `npm run typecheck && npm run lint && npm test && npm run format:check && npm run build`.

## 10. Out of scope (for now)

Dark mode, a separate component library or Storybook, and DOM-level component tests (Vitest runs in `node`). Add them as their own tasks.
