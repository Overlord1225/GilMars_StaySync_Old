import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Skeleton({
  className = "",
  label = "Loading",
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={`animate-pulse rounded-md bg-border motion-reduce:animate-none ${className}`.trim()}
      {...props}
    />
  );
}
