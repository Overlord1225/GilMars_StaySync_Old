export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

// One shared look and motion for every button and link-styled button:
// 6px radius, no lift, one firm press on click. `not-disabled:` (instead of
// `enabled:`) also matches <a>, so links and buttons share one table below.
// 48px tall on touch screens, 44px with a mouse.
export const base =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-5 py-2.5 text-sm font-semibold tracking-[0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-ui ease-ui pointer-coarse:min-h-12 not-disabled:cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed not-disabled:active:scale-[0.98] motion-reduce:transform-none";

// Filled buttons swap to a flat tinted fill when disabled: fading them left a
// washed-out grey-green that read as broken.
export const variants: Record<Variant, string> = {
  primary:
    "bg-action text-on-action not-disabled:hover:bg-action-hover not-disabled:hover:shadow-raised not-disabled:active:bg-action-hover not-disabled:active:shadow-none disabled:bg-brand-light disabled:text-ink-muted",
  secondary:
    "border border-rule-strong bg-surface text-ink not-disabled:hover:border-brand not-disabled:hover:bg-brand-light not-disabled:hover:text-brand-dark not-disabled:active:bg-brand-light disabled:opacity-55",
  // outline is an alias of secondary, kept so existing callers need no change
  outline:
    "border border-rule-strong bg-surface text-ink not-disabled:hover:border-brand not-disabled:hover:bg-brand-light not-disabled:hover:text-brand-dark not-disabled:active:bg-brand-light disabled:opacity-55",
  ghost:
    "text-ink-muted not-disabled:hover:bg-brand-light not-disabled:hover:text-brand-dark not-disabled:active:bg-brand-light disabled:opacity-55",
  danger:
    "bg-danger-700 text-on-fill not-disabled:hover:bg-danger-800 not-disabled:hover:shadow-soft not-disabled:active:bg-danger-800 disabled:bg-danger-50 disabled:text-danger-800",
};

/** Base classes for custom-colored link buttons (same as `base`). */
export const linkBase = base;

/** Class string for links that must look like a Button (navigation is a link). */
export function buttonClass(variant: Variant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}
