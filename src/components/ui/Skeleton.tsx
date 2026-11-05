import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Skeleton({ className = "", label, ...props }: SkeletonProps) {
  // Decorative unless labelled, so a page of skeletons doesn't announce "Loading" dozens of times.
  return (
    <div
      {...(label
        ? { role: "status", "aria-label": label, "aria-busy": true }
        : { "aria-hidden": true })}
      className={`animate-pulse rounded-control bg-rule motion-reduce:animate-none ${className}`.trim()}
      {...props}
    />
  );
}
