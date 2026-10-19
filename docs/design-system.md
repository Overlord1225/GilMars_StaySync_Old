# StaySync design system

## Design rationale

StaySync uses a restrained visual system to keep reservation information, booking rules and next steps easy to scan. The warm cream page background and near-white content surface give the interface a calm hospitality character. Deep green identifies primary actions, headings and active structure. Sand is a limited accent for small decorative details and separators; it is not used for text because it does not provide sufficient contrast on the light surfaces. Status colors are paired with a visible word label and, where relevant, an icon so meaning does not depend on color alone.

Typography uses Playfair Display for headings and brand moments and DM Sans for interface text, forms and data. This pairing gives the brand a distinct voice while keeping task content consistent. The shared type, spacing, radius, elevation, layering and focus tokens reduce variation between pages. The visual system avoids gradients and translucent overlays; surfaces and color contrast carry hierarchy, with two restrained shadow levels for elevation.

## Tokens

The values below are defined in the Tailwind 4 `@theme` block in `src/index.css`. Colors are hexadecimal sRGB values. The global page uses `cream` and `text`; content cards use `surface`.

| Group | Token(s) | Value or scale | Use |
|---|---|---|---|
| Brand | `brand`, `brand-dark`, `brand-hover`, `brand-light` | `#1d4f4a`, `#153a36`, `#24645d`, `#e7f0ed` | Primary actions, headings, hover states and quiet selected or informational backgrounds. |
| Warm neutrals | `cream`, `surface`, `border`, `sand`, `sand-light` | `#f6f1ea`, `#fffdf9`, `#e5ddd2`, `#c9a57b`, `#f0e5d8` | Page, content, separators and small decorative accents. Sand is not a text color. |
| Text | `text`, `text-muted` | `#33443f`, `#5c6b65` | Main and supporting copy. The muted value was darkened so supporting copy meets AA contrast on cream, surface and brand-light. |
| Feedback | `success-50/200/300/700`, `warning-50/200/300/700/800/900`, `danger-50/200/300/700/800`; `status-*` foregrounds and cancelled background/border | Semantic tint, border and state colors are defined in `@theme` (for example, success text `#166534` on `success-50` `#f0fdf4`; cancelled text `#475569` on `#f1f5f9`). | Feedback and status text/icons. Use the matching tint and border with a visible text label. |
| Type | `font-heading`, `font-sans`; `text-xs` through `text-4xl` | Playfair Display / Georgia; DM Sans / system; `0.75rem`, `0.875rem`, `1rem`, `1.125rem`, `1.25rem`, `1.5rem`, `1.875rem`, `2.25rem` | Serif headings and brand moments; sans-serif for all controls and reading content. |
| Spacing | Tailwind spacing scale; `spacing-page` | Tailwind's `0.25rem` base increments; page inset `1.5rem` | Use the shared spacing steps for internal rhythm; `spacing-page` gives a common content inset. Responsive page gutters may reduce on narrow screens. |
| Radius | `radius-control`, `radius-card`, `radius-panel` | `0.625rem`, `1rem`, `1.5rem` | A three-step radius scale for controls, cards and larger panels. Use full rounding only for circular controls or compact status pills. |
| Elevation | `shadow-soft`, `shadow-raised` | `0 2px 8px rgb(38 49 44 / 6%)`; `0 8px 24px rgb(38 49 44 / 9%)` | Subtle card separation and raised elements such as dialogs and notifications. These are the only elevation shadows. |
| Focus | `color-focus-ring`, `shadow-focus` | `#1d4f4a`; surface offset plus a two-pixel green outer ring | Shared visible keyboard focus treatment, defined alongside the other theme tokens. |
| Layering | `z-sticky`, `z-dropdown`, `z-overlay`, `z-modal`, `z-toast` | `10`, `20`, `40`, `50`, `60` | Shared stacking order for sticky content, menus, overlays, dialogs and notifications. |
| Motion | `ease-ui`, `transition-duration-ui` | `cubic-bezier(0, 0, 0.2, 1)`; `200ms` | Short state transitions. Components with transitions suppress them under `prefers-reduced-motion`. |

## Color usage rules

- Use cream as the page canvas and surface for cards, forms and dialogs. Keep body copy in `text` and supporting copy in `text-muted`.
- Use brand green for primary actions and navigational emphasis. Use `brand-dark` for headings and strong structure. Keep white text on solid green or danger actions.
- Use `brand-light` and `sand-light` as restrained backgrounds. Use sand itself for small non-text accents only.
- Use semantic feedback colors with their matching pale backgrounds: success on green-50, warning and pending on amber-50, and error/rejected on red-50. Confirmed uses green-50, completed uses brand-light and cancelled uses slate-100. Always show the status word; icons supplement rather than replace the label.
- Keep borders subtle, but do not use a border as the only indication of input state. Validation text and programmatic field state accompany error borders.
- Do not apply partial opacity to text where it reduces contrast. The landing-page image caption uses an opaque brand-dark panel so its text contrast does not depend on the photograph behind it.

## Contrast measurements

Ratios were calculated from the final foreground and background sRGB values using the WCAG relative-luminance contrast formula. For normal-sized text, WCAG 2.1 AA requires at least 4.5:1; large text requires at least 3:1. Every text/background pairing found in the shared tokens and application text utilities is represented below, including status colors and the Tailwind slate text used in staff and placeholder screens. The `PASS` results apply to the listed solid colors. Photographs, disabled controls, borders and non-text icons are not represented as text pairs; disabled controls are exempt from WCAG text contrast requirements. Recheck any new utility-color pairing before adding it to the interface.

| Foreground text | Background | Ratio | AA (normal text) |
|---|---|---:|---|
| `text` `#33443f` | cream `#f6f1ea` | 9.16:1 | Pass |
| `text` `#33443f` | surface `#fffdf9` | 10.14:1 | Pass |
| `text` `#33443f` | brand-light `#e7f0ed` | 8.87:1 | Pass |
| `text` `#33443f` | success-50 `#f0fdf4` | 9.84:1 | Pass |
| `text` `#33443f` | warning-50 `#fffbeb` | 9.93:1 | Pass |
| `text` `#33443f` | danger-50 `#fef2f2` | 9.41:1 | Pass |
| `text` `#33443f` | sand-light `#f0e5d8` | 8.29:1 | Pass |
| `text-muted` `#5c6b65` | cream `#f6f1ea` | 4.99:1 | Pass |
| `text-muted` `#5c6b65` | surface `#fffdf9` | 5.52:1 | Pass |
| `text-muted` `#5c6b65` | white `#ffffff` | 5.61:1 | Pass |
| `text-muted` `#5c6b65` | brand-light `#e7f0ed` | 4.83:1 | Pass |
| `text-muted` `#5c6b65` | success-50 `#f0fdf4` | 5.36:1 | Pass |
| `text-muted` `#5c6b65` | warning-50 `#fffbeb` | 5.41:1 | Pass |
| `text-muted` `#5c6b65` | danger-50 `#fef2f2` | 5.12:1 | Pass |
| `brand` `#1d4f4a` | cream `#f6f1ea` | 8.23:1 | Pass |
| `brand` `#1d4f4a` | surface `#fffdf9` | 9.11:1 | Pass |
| `brand` `#1d4f4a` | brand-light `#e7f0ed` | 7.97:1 | Pass |
| `brand` `#1d4f4a` | amber-50 `#fffbeb` | 8.92:1 | Pass |
| `brand` `#1d4f4a` | white `#ffffff` | 9.25:1 | Pass |
| `brand-dark` `#153a36` | cream `#f6f1ea` | 11.06:1 | Pass |
| `brand-dark` `#153a36` | surface `#fffdf9` | 12.23:1 | Pass |
| `brand-dark` `#153a36` | brand-light `#e7f0ed` | 10.70:1 | Pass |
| `brand-dark` `#153a36` | sand-light `#f0e5d8` | 10.00:1 | Pass |
| white `#ffffff` | brand `#1d4f4a` | 9.25:1 | Pass |
| white `#ffffff` | brand-dark `#153a36` | 12.42:1 | Pass |
| white `#ffffff` | danger `#b91c1c` | 6.47:1 | Pass |
| white `#ffffff` | red-800 `#991b1b` (danger hover) | 8.31:1 | Pass |
| success-700 `#166534` | success-50 `#f0fdf4` | 6.81:1 | Pass |
| success-700 `#166534` | cream `#f6f1ea` | 6.35:1 | Pass |
| success-700 `#166534` | surface `#fffdf9` | 7.02:1 | Pass |
| warning-800 `#854d0e` | warning-50 `#fffbeb` | 6.61:1 | Pass |
| warning-800 `#854d0e` | cream `#f6f1ea` | 6.10:1 | Pass |
| warning-800 `#854d0e` | surface `#fffdf9` | 6.74:1 | Pass |
| status-pending `#a16207` | warning-50 `#fffbeb` | 4.75:1 | Pass |
| danger-700 / status-rejected `#b91c1c` | danger-50 `#fef2f2` | 5.91:1 | Pass |
| danger-700 `#b91c1c` | cream `#f6f1ea` | 5.76:1 | Pass |
| danger-700 `#b91c1c` | surface `#fffdf9` | 6.37:1 | Pass |
| status-confirmed `#15803d` | success-50 `#f0fdf4` | 4.79:1 | Pass |
| status-completed `#1d4f4a` | brand-light `#e7f0ed` | 7.97:1 | Pass |
| status-cancelled `#475569` | status-cancelled-bg `#f1f5f9` | 6.92:1 | Pass |
| slate-900 `#0f172a` | white `#ffffff` | 17.85:1 | Pass |
| slate-700 `#334155` | white `#ffffff` | 10.35:1 | Pass |
| slate-700 `#334155` | slate-100 `#f1f5f9` | 9.45:1 | Pass |
| slate-600 `#475569` | white `#ffffff` | 7.58:1 | Pass |
| warning-900 `#78350f` | warning-50 `#fffbeb` | 8.75:1 | Pass |
| danger-800 `#991b1b` | danger-50 `#fef2f2` | 7.60:1 | Pass |

The shared `text-muted` token was changed from `#65736d` because it measured 4.42:1 on cream and 4.28:1 on brand-light, below AA for normal text. It is now `#5c6b65`. Placeholder text uses the same solid token rather than an 80% opacity variant. A staff account note previously using slate-500 on cream also fell below AA and now uses the shared muted token. The landing page's sand-colored wordmark text was changed to brand-dark; the breadcrumb separator remains a decorative icon, not text.

## Typography and spacing guidance

Use `text-xs` for compact metadata and labels that remain readable at the selected device size, `text-sm` for supporting UI copy, `text-base` for default reading and form content, and the larger steps for page and section hierarchy. Avoid reducing important booking rules or status explanations to small text. Use the serif face for headings and brand moments only; buttons, labels, tables and long-form content remain sans-serif.

Use Tailwind's shared spacing steps for consistent component rhythm. Keep page gutters responsive, preserve breathing room around primary tasks, and align related form labels and controls. The 44px minimum control height used by primary actions and touch targets is independent of the spacing scale. Use control radius for buttons and fields, card radius for content groups, and panel radius sparingly for large shells.

## Shared component inventory

| Component | Use |
|---|---|
| `Button` | Primary, secondary, outline, ghost and destructive actions; supports pending and disabled states. Use a text label for actions. |
| `Input`, `Select`, `Textarea`, `Checkbox` | Labeled form controls. Keep visible labels, helper text and linked field errors. |
| `Card` | Group content that belongs to one task or information block. |
| `Badge` | Short non-status category or descriptor. |
| `StatusBadge` | Reservation or inquiry state, combining a text label with a supporting icon and semantic color. |
| `Modal` | Focused dialog for a short task that requires attention. |
| `ConfirmDialog` | Destructive or consequential action; state its effect in plain words and offer a clear way back. |
| `Toast` | Brief operation feedback that does not replace persistent page content or field errors. |
| `Skeleton` | Shape-matched loading placeholder while content is pending. |
| `EmptyState` | Explain why a list or area has no content and provide an appropriate next action when one exists. |
| `Tabs` | Switch between related views within the same task. Keep selected state visible and keyboard accessible. |
| `Table` | Structured records with semantic headers; stacks rows into labeled cards below 768px. |
| `Pagination` | Move through a long result list and expose the current page and available navigation. |
| `Tooltip` | Explain a brief non-obvious control or term; do not use it as the only place for essential rules. |
| `Breadcrumbs` | Show the current location within a multi-step or nested area and provide useful parent links. |
| `Stepper` | Show progress through a sequential task such as reservation request. |
| `PageHeader` | Establish page purpose with title, supporting description, breadcrumbs and optional action. |
| `Avatar` | Identify an account or staff member where a person label is useful. |

## Implementation notes

Tailwind utility classes such as `bg-brand`, `text-text-muted`, `font-heading`, `rounded-control` and `shadow-raised` use these shared tokens. The global base styles in `src/index.css` set the page colors, sans-serif body, serif headings, selection colors and focus ring. Component transitions use the shared 200ms duration and easing and should retain reduced-motion overrides. This document records a design-system specification and measured color pairs; it is not a complete WCAG audit of every page or state.
