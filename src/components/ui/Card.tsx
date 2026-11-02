import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  padded?: boolean;
  /** Pick the element that matches the content: section, article, li. */
  as?: "div" | "section" | "article" | "li";
};

export function Card({
  children,
  className = "",
  padded = true,
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={`rounded-card border border-border bg-surface shadow-soft ${
        padded ? "p-6 sm:p-8" : ""
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}
