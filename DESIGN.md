---
name: StaySync
description: Banig Weave. Paper ground, deep green ink, tan thread as the only accent.
colors:
  brand: "#1f4e4b"
  brand-dark: "#143432"
  brand-light: "#e4efed"
  brand-hover: "#2a6561"
  mango: "#c9a27a"
  mango-light: "#f3e6d3"
  sky: "#d9e8e5"
  paper: "#f6f1e7"
  surface: "#fffdf9"
  rule: "#ddd5c6"
  rule-strong: "#7b8681"
  ink: "#1b2b28"
  ink-muted: "#52605b"
  on-fill: "#ffffff"
  band: "#143432"
  on-band: "#ffffff"
  on-mango: "#143432"
  success-700: "#166534"
  warning-700: "#b45309"
  danger-700: "#b91c1c"
typography:
  display:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "4.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Brygada 1918, ui-serif, Georgia, serif"
    fontSize: "3.0625rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "8px"
  card: "14px"
  panel: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-fill}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px 32px"
---

# StaySync Design System

Single reference for how StaySync looks, behaves, and is built. Source of truth for tokens is `src/index.css` (`@theme`); the frontmatter above mirrors it. Shared components live in `src/components/ui`. When this file and the code disagree, fix one of them in the same change.

## 1. Principles

1. **Banig weave.** The stay is a woven mat: green and tan strands cross into one ordered grid. Warm paper ground, deep logo green, tan as the only accent, a serif display face (Brygada 1918) that echoes the wordmark. Hierarchy comes from type size, whitespace and structure, not boxes. No gradients as decoration (the weave band is the single patterned element), no glass blur, no glow.
2. **Clarity over decoration.** Every screen answers: where am I, what is the state, what can I do next.
3. **Accessible by default.** Target WCAG 2.1 AA. Keyboard, screen reader, zoom, and reduced-motion users get the same flows.
4. **Tokens, not values.** Use a token if one exists. Add a token before adding a one-off value.
5. **Mobile first.** Guests book from phones. Layouts start at 320px.

## 2. Design tokens

All tokens are in `src/index.css`. Tailwind v4 generates utilities from them (`bg-brand`, `text-ink-muted`, `rounded-card`, `aspect-card`, `z-modal`, `text-2xs`, ...).

### Color

| Role        | Token                                                                   | Value                | Use                                                                                                   |
| ----------- | ----------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| Brand       | `brand`, `brand-hover`                                                  | `#1f4e4b`, `#2a6561` | Primary actions, links, active nav                                                                    |
| Brand dark  | `brand-dark`                                                            | `#143432`            | Headings, hover on primary, dark sections                                                             |
| Brand light | `brand-light`                                                           | `#e4efed`            | Hover/active background, chips, skeletons                                                             |
| Mango       | `mango`, `mango-light`                                                  | `#c9a27a`, `#f3e6d3` | Accent: weave strands, linked-card edge on hover, price pills. Fill only, never text on white (2.4:1) |
| Sky         | `sky`                                                                   | `#d9e8e5`            | Hero and illustration backgrounds                                                                     |
| Page        | `paper`                                                                 | `#f6f1e7`            | App background                                                                                        |
| Surface     | `surface`                                                               | `#fffdf9`            | Cards, inputs, menus                                                                                  |
| Rule        | `rule`, `rule-strong`                                                   | `#ddd5c6`, `#7b8681` | `rule` for dividers and card borders; `rule-strong` for control outlines (3:1)                        |
| Ink         | `ink`                                                                   | `#1b2b28`            | Body copy                                                                                             |
| Muted ink   | `ink-muted`                                                             | `#52605b`            | Secondary copy, labels                                                                                |
| Success     | `success-50/200/700`                                                    |                      | Confirmations                                                                                         |
| Warning     | `warning-50/200/700/800`                                                |                      | Unsaved changes, pending attention                                                                    |
| Danger      | `danger-50/200/700/800`                                                 |                      | Errors, destructive actions                                                                           |
| Status      | `status-pending`, `-confirmed`, `-rejected`, `-cancelled`, `-completed` |                      | Reservation and inquiry status. Use `StatusBadge`, not raw colors                                     |
| On fill     | `on-fill`                                                               | white / `#0e1f1d`    | Text on `brand`, `brand-dark` and `danger-700` fills. Never `text-white`                              |
| Overlay     | `overlay`                                                               | brand-dark at 55%    | Modal backdrop                                                                                        |

Rules:

- Never use raw Tailwind palette classes (`slate-*`, `red-*`, `gray-*`, `bg-white`, `bg-black/5`). Use the tokens above. `text-white` on `brand`/`brand-dark`/`danger-700` fills is allowed.
- Never use color alone to carry meaning. Status badges include an icon and a text label.
- Body text on `paper`/`surface` must keep 4.5:1 contrast; large text and UI borders 3:1.

### Typography

| Role                                 | Font                 | Notes                                                                                                  |
| ------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Headings (`h1`-`h6`, `font-heading`) | Brygada 1918 400-700 | Serif; also used for prices and the hero. In `@layer base`, so utilities like `text-white` override it |
| Body and UI                          | Figtree 400-700      | Default `font-sans`                                                                                    |

Scale (1.25 ratio): `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18 (kept as an intermediate step), `text-xl` 20, `text-2xl` 25, `text-3xl` 31, `text-4xl` 39, `text-5xl` 49, `text-6xl` 61, `text-display` 68 (landing hero only). Admin page titles drop one step. `text-2xs` (11px) is for dense micro-labels only (calendar cells, table headers on tiny screens). Body copy is never below `text-sm`.

Do not put small uppercase labels above headings. Reserve `tracking-eyebrow` for genuine micro-labels.

Line length: keep prose under about 65ch (`max-w-2xl`). Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty` (set globally in `index.css`).

### Shape, elevation, motion, layering

- Radius: `rounded-control` 8px (buttons, nav links, inputs, menu items), `rounded-card` 14px (cards, dropdowns, photo frames), `rounded-panel` 20px (panels, dialogs). Buttons are rounded-control, not pills; they share one hover lift and press (`buttonClass` in `ui/buttonStyles.ts`).
- Shadow: none at rest (`shadow-soft` is `none`). Elevation is declared once: `shadow-raised` for menus, dialogs and toasts; `shadow-lift` for hover only (linked cards, filled buttons). Lists use rules (`divide-rule`), not a card per row.
- Motion: `duration-ui` (220ms) and `duration-media` (520ms, photos and the weave slide), both with `ease-ui` (`cubic-bezier(0.16, 1, 0.3, 1)`). See section 4 for the hover grammar.
- Z-index: `z-sticky` 10 (sticky headers), `z-dropdown` 20 (menus, tooltips), `z-overlay` 40, `z-modal` 50, `z-toast` 60. Never write numeric `z-20`, `z-50`.
- Spacing: Tailwind's 4px scale. Page gutters `px-4 sm:px-6 lg:px-8`; vertical rhythm `space-y-6` between page sections, `space-y-4`/`space-y-5` inside forms and cards.

### Themes (light, dark, system)

- Dark mode redefines the color tokens (and the two shadows) in `:root[data-theme="dark"]` (`src/index.css`). Components use tokens only, so they need no `dark:` classes. Add every new color token to both blocks.
- `brand` and `brand-dark` become light in dark mode (they are used as text), so a solid fill with text on it uses `text-on-fill`, never `text-white`.
- Dark full-width sections (footer, landing CTA) use `bg-band` with `text-on-band`. Text on tan `mango` fills uses `text-on-mango`.
- `src/lib/theme.ts` stores the choice (`light` or `dark`) in `localStorage`; with no saved choice it follows the OS. An inline script in `index.html` sets `data-theme` before first paint to avoid a flash.
- `ThemeSwitch` is a sun/moon icon button in the site header, the admin mobile header and the admin sidebar.
- Photos are dimmed slightly in dark mode (`img:not([data-no-dim])`). Route changes fade in through `.page-in`; reduced motion turns it off.
- `src/lib/contrast.test.ts` checks the main color pairs in both themes.

### Focus

One focus style, defined once in `index.css`: a 3px surface gap plus a 2px brand ring (`--shadow-focus`), applied to every `:focus-visible`. Under forced-colors it becomes a 2px `CanvasText` outline.

- Do not add `focus:ring-*`, `focus-visible:ring-*`, or `outline-none` to components.
- Exception: controls on dark brand backgrounds may use `focus-visible:ring-2 focus-visible:ring-white` (hero links in `AuthShell`, `Landing` CTA).
- Never remove focus without a replacement. Custom widgets must be reachable and show focus.

## 3. Image ratios

Every photo frame has one ratio per role (tokens `--aspect-*`). Set it with `StayImage ratio`; the frame sizes itself and the image fills it.

| Ratio     | Value  | Surface                                            |
| --------- | ------ | -------------------------------------------------- |
| `hero`    | 4 / 3  | Landing hero frame, unit-details gallery on mobile |
| `card`    | 3 / 2  | Unit cards on Landing and Units list               |
| `gallery` | 16 / 9 | Unit-details gallery at `sm+`                      |
| `thumb`   | 4 / 3  | Small thumbnails (admin unit cards)                |

- Pages never write numeric ratios such as `aspect-4/3`. Photos pass `ratio` to `StayImage`. Skeletons, slide boxes and placeholders that are not `StayImage` use the matching token utility (`aspect-hero`, `aspect-card`, `aspect-gallery`, `aspect-thumb`). Omit `ratio` only when a parent already owns the box.
- A missing or failed photo renders the same frame with the brand mark and "Photo coming soon". Photos use `object-cover`; `fit="contain"` only in the lightbox.

## 4. Hover and motion grammar

- **Linked cards.** `Card interactive`, or `.card-link group` on a hand-built link card: lift 3px, edge turns tan (`mango`), `shadow-lift` opens. Pointer devices only (`@media (hover: hover)`); press settles to `scale(0.995)`.
- **Photos.** `StayImage` zooms 4% (`group-hover:scale-[1.04]`) over `duration-media`, inside its clipped frame. The weave band on the same `.group` slides one cell.
- **Buttons.** Lift 1px on hover, press `scale(0.97)`, one shared definition in `buttonStyles.ts`. Filled buttons add `shadow-lift` on hover.
- **Rows and links.** Table rows tint (`brand-light/40`) at `md+`; link and nav tints use `duration-ui ease-ui`.
- Only color, opacity, transform and shadow animate. Never animate layout properties.
- Reduced motion is honored globally in `index.css` (animation and transition durations collapse). Do not rely on component-level `motion-reduce:` alone.

## 5. Visual hierarchy

- **Ramp.** `text-display` only for the landing hero `h1`. Other `h1`s come from `PageHeader` (`text-3xl sm:text-4xl lg:text-5xl`). `h2` is `text-3xl sm:text-4xl`, `h3` is `text-2xl`, body `text-base`, meta and labels `text-sm`.
- **Weights.** `h1`-`h3` are 600; `h4`-`h6` are 500. Headings are `brand-dark`, tight tracking (-0.015em), line-height 1.12.
- **Rhythm.** More space above a heading than below it, so a heading binds to the content it introduces. Section gaps `space-y-6` and up; heading to content `mt-3` or less.
- **Numbers.** Money, dates and table amounts use `tabular-nums` so columns align.
- No eyebrow or kicker above headings. Hierarchy is size, weight and space.

## 6. Banig weave

`.weave-band` (1.5rem) and `.weave-band--thin` (0.75rem) are two rows of green and tan cells. They are decorative: always `aria-hidden="true"`, never carry meaning.

- Allowed only on photo frames (bottom edge of a card photo), the landing hero frame, the top edge of `AuthShell`, and above the footer (`SiteFooter`).
- Never inside forms, tables, dialogs or admin work surfaces.
- Do not nest cards or stack a second pattern next to it. One band per edge.

## 7. Layout

### Shells

| Shell  | File                      | Used for                          | Landmarks                                                                                   |
| ------ | ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| Public | `layout/PublicLayout.tsx` | Landing, units, availability      | `header > nav`, `main#main-content`, `footer`                                               |
| Guest  | `layout/GuestLayout.tsx`  | Guest account pages (guests only) | `header > nav`, `main#guest-content`, `footer`                                              |
| Admin  | `layout/AdminLayout.tsx`  | `/admin/*`, `/super/*`            | sidebar `aside > nav` on desktop, `header` + `details` menu on mobile, `main#admin-content` |
| Auth   | `auth/AuthShell.tsx`      | Login, register, password reset   | `h1` supplied by the shell                                                                  |

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
- No nested cards. A Card never contains another Card.

## 8. Components (`src/components/ui`)

Use these before writing markup. Match their props; do not restyle from the outside.

| Component                                           | Use                      | Notes                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                                            | Any action               | Variants `primary` (one per view), `secondary`/`outline` (same look, `outline` is an alias), `ghost`, `danger`. `loading` sets `aria-busy` and disables. Navigation is a link, not a button                                                                                                                        |
| `Input`, `Select`, `Textarea`, `Checkbox`           | Form fields              | Require `id` and `label`. `hint` and `error` are wired with `aria-describedby`; invalid sets `aria-invalid`. Always use instead of raw `<input>` for text-like fields                                                                                                                                              |
| `Card`                                              | Grouped content          | `as` = `div` (default), `section`, `article`, `li`. `elevated={false}` drops the shadow. `interactive` adds `.card-link group` (lift, tan edge, shadow-lift on hover) for linked cards. Lists of rows use one `Card padded={false}` holding `ul.divide-y.divide-border` with `li.p-4 sm:p-5`, never a Card per row |
| `StayImage` (`components/public`)                   | Unit photos              | `ratio` = `hero`, `card`, `gallery`, `thumb` sizes the frame (section 3). `fit`, `priority` for the first visible photo. Zooms 4% under a `.group` parent                                                                                                                                                          |
| `PageHeader`                                        | Top of every page        | Renders `header`, `h1`, optional breadcrumbs, actions                                                                                                                                                                                                                                                              |
| `Breadcrumbs`                                       | Location                 | Inside `PageHeader` via `breadcrumbs`. Only for paths two or more levels deep (Stays > Unit); not on admin pages or top-level pages                                                                                                                                                                                |
| `Table`                                             | Tabular data             | Requires `caption` (screen-reader only). Collapses to stacked cards under `md` with `data-label`                                                                                                                                                                                                                   |
| `Tabs`, `Stepper`, `Pagination`                     | Navigation within a view | Keep `label` props meaningful, they become `aria-label`s                                                                                                                                                                                                                                                           |
| `Modal`, `ConfirmDialog`                            | Dialogs                  | `Modal` handles focus trap, Escape, scroll lock, focus return, `aria-modal`, labelling. Destructive or irreversible actions always go through `ConfirmDialog` with a stated consequence. Never `window.confirm` for actions                                                                                        |
| `Toast` via `useToast`                              | Result of an action      | `success`, `error`, `info`. Errors announce assertively, others politely. Not for validation errors                                                                                                                                                                                                                |
| `StatusBadge`, `Badge`                              | State labels             | `StatusBadge` maps reservation and inquiry statuses to color, icon, and label                                                                                                                                                                                                                                      |
| `EmptyState`                                        | No data or load error    | Title, one sentence, one next-step action. Title is an `h3`; pass `headingLevel={2}` when it follows the page `h1` directly, `headingLevel={1}` when it is the only content                                                                                                                                        |
| `Skeleton`, `Spinner`                               | Loading                  | Skeleton for page/list loads (give it a `label`), spinner for inline button/section work                                                                                                                                                                                                                           |
| `Tooltip`                                           | Supplemental hint        | Never the only place a critical instruction lives                                                                                                                                                                                                                                                                  |
| `Avatar`, `StatusTimeline`, `Head`, `ErrorBoundary` | As named                 | Wrap lazy pages in `withErrorBoundary`                                                                                                                                                                                                                                                                             |

### States every interactive component covers

default, hover, focus-visible, active, disabled (`opacity-55`, `cursor-not-allowed`; filled buttons swap to a flat tinted fill), loading, error. Data views cover loading (skeleton), empty (`EmptyState`), error (message plus retry), and success.

## 9. Semantic HTML rules

1. One `<h1>` per page (`PageHeader` or `AuthShell`). Headings descend without skipping levels.
2. Group content in `<section aria-labelledby>`; standalone items in `<article>`.
3. Lists of items are `<ul>`/`<ol>` with `<li>` (use `Card as="li"`). Key-value facts (price, dates, guests) are `<dl>`/`<dt>`/`<dd>`.
4. Dates and times use `<time dateTime="YYYY-MM-DD">` with text from `formatStayDate`. Money uses `formatCurrency` (PHP).
5. Actions are `<button type="button|submit">`; navigation is `<a>`/`<Link>`. Never `onClick` on `div`/`span`.
6. Forms: every field has a visible `<label>`; group related fields in `<fieldset><legend>`; errors link via `aria-describedby`; summary-level errors use `role="alert"`; status messages use `role="status"`.
7. Toggle buttons expose state (`aria-pressed`); tabs use `role="tab"`/`aria-selected`; current page links get `aria-current` (NavLink does this).
8. Icon-only controls have `aria-label`; decorative icons and weave bands have `aria-hidden="true"`.
9. Images have meaningful `alt` or `alt=""` if decorative. Frames use a `StayImage ratio` to avoid layout shift.
10. Tables have `<caption>`, `<th scope>`; never use tables for layout.
11. Use `sr-only` text for context that sighted users get visually (for example "to" between dates).

## 10. Content and tone

- Plain, warm, short. Say what happened and what to do next: "We couldn’t cancel that request. Please try again."
- Use typographic apostrophes (’), never mojibake. Files are UTF-8.
- Buttons are verb phrases: "Send request", "Cancel stay". Destructive dialogs name the object and have a safe default label ("Keep stay").
- Status words: Pending, Confirmed, Rejected, Cancelled, Completed; inquiries: New, In progress, Resolved, Closed.
- Dates: `formatStayDate`. Check-out is exclusive, so say "Check-out" not "last night". Times are Asia/Manila.
- Money: `PHP 1,000` via `formatCurrency`. The down payment is fixed by booking rules; do not hardcode it in copy.
- Never show raw database or Supabase error text to guests; map it to a friendly message.

`useUnsavedChangesGuard` keeps the native `confirm`: browsers do not allow custom UI in `beforeunload`. Use `ConfirmDialog` everywhere else.

## 11. Review checklist

Before merging UI work:

- [ ] One `h1`, logical heading order, landmarks present, skip link works.
- [ ] Tab through the page: every control reachable, one visible focus ring, logical order.
- [ ] Works at 320px and 1280px with no horizontal scroll; text zoom 200% still usable.
- [ ] Loading, empty, error states exist.
- [ ] No raw palette classes, numeric `aspect-*` ratios (`grep -rnE 'aspect-[0-9]' src`) or numeric z-index (`grep -rE '\b(text|bg|border)-(slate|gray|red|green|amber|white)' src`).
- [ ] Weave bands are `aria-hidden` and only on allowed edges.
- [ ] Destructive actions use `ConfirmDialog`.
- [ ] `npm run typecheck && npm run lint && npm test && npm run format:check && npm run build`.
