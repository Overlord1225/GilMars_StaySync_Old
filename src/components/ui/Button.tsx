import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({
  className = "",
  variant = "primary",
  disabled,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2.5 font-medium transition-colors duration-ui ease-ui disabled:cursor-not-allowed";
  // Filled buttons swap to a flat tinted fill when disabled: fading them left a
  // washed-out grey-green that read as broken.
  const variants: Record<string, string> = {
    primary:
      "bg-brand text-white enabled:hover:bg-brand-dark disabled:bg-brand-light disabled:text-ink-muted",
    secondary:
      "border border-rule-strong bg-surface text-ink enabled:hover:bg-paper disabled:opacity-55",
    // outline is an alias of secondary, kept so existing callers need no change
    outline:
      "border border-rule-strong bg-surface text-ink enabled:hover:bg-paper disabled:opacity-55",
    ghost:
      "text-ink-muted enabled:hover:bg-brand-light enabled:hover:text-brand-dark disabled:opacity-55",
    danger:
      "bg-danger-700 text-white enabled:hover:bg-danger-800 disabled:bg-danger-50 disabled:text-danger-800",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-3px] motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
