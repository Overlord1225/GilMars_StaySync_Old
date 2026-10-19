import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({
  children,
  className = "",
  padded = true,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-soft ${
        padded ? "p-6 sm:p-8" : ""
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
