import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  padded?: boolean;
  /** Resting shadow. Turn off for list containers and secondary blocks. */
  elevated?: boolean;
  /** Pick the element that matches the content: section, article, li. */
  as?: "div" | "section" | "article" | "li";
};

export function Card({
  children,
  className = "",
  padded = true,
  elevated = true,
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={`rounded-card border border-rule bg-surface ${
        elevated ? "shadow-soft" : ""
      } ${padded ? "p-6 sm:p-8" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}
