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
    "inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2.5 font-medium transition-colors duration-ui ease-ui disabled:cursor-not-allowed disabled:opacity-55";
  const variants: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-rule-strong bg-surface text-ink hover:bg-paper",
    // outline is an alias of secondary, kept so existing callers need no change
    outline: "border border-rule-strong bg-surface text-ink hover:bg-paper",
    ghost: "text-ink-muted hover:bg-brand-light hover:text-brand-dark",
    danger: "bg-danger-700 text-white hover:bg-danger-800",
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
