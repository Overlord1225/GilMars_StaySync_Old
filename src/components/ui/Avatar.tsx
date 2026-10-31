import type { HTMLAttributes } from "react";

type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
};
export function Avatar({
  name = "Guest",
  src,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  const displayName = name?.trim() || "Guest";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G";
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
  };
  return (
    <span
      role="img"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light font-semibold text-brand-dark ${sizes[size]} ${className}`.trim()}
      {...props}
      aria-label={displayName}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width="56"
          height="56"
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        initials
      )}
    </span>
  );
}
