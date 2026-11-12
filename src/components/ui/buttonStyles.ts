export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

// One shared look and motion for every button and link-styled button:
// 8px radius, 1px lift on hover, one firm press on click.
export const base =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-5 py-2.5 text-sm font-semibold tracking-[0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-ui ease-ui disabled:cursor-not-allowed aria-disabled:cursor-not-allowed enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.97] motion-reduce:transform-none";

// Filled buttons swap to a flat tinted fill when disabled: fading them left a
// washed-out grey-green that read as broken.
export const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-on-fill enabled:hover:bg-brand-dark enabled:hover:shadow-lift enabled:active:bg-brand-dark enabled:active:shadow-none disabled:bg-brand-light disabled:text-ink-muted",
  secondary:
    "border border-rule-strong bg-surface text-ink enabled:hover:border-brand enabled:hover:bg-brand-light enabled:hover:text-brand-dark enabled:active:bg-brand-light disabled:opacity-55",
  // outline is an alias of secondary, kept so existing callers need no change
  outline:
    "border border-rule-strong bg-surface text-ink enabled:hover:border-brand enabled:hover:bg-brand-light enabled:hover:text-brand-dark enabled:active:bg-brand-light disabled:opacity-55",
  ghost:
    "text-ink-muted enabled:hover:bg-brand-light enabled:hover:text-brand-dark enabled:active:bg-brand-light disabled:opacity-55",
  danger:
    "bg-danger-700 text-on-fill enabled:hover:bg-danger-800 enabled:hover:shadow-lift enabled:active:bg-danger-800 disabled:bg-danger-50 disabled:text-danger-800",
};

/** Class string for links that must look like a Button (navigation is a link). */
export function buttonClass(variant: Variant = "primary", className = "") {
  // Links have no `enabled:` state, so rewrite the variants for plain hover.
  const linkVariants = variants[variant]
    .replaceAll("enabled:", "")
    .replace(/disabled:\S+/g, "");
  const linkBase = base
    .replaceAll("enabled:", "")
    .replace(/(aria-)?disabled:\S+/g, "");
  return `${linkBase} ${linkVariants} ${className}`.trim();
}
