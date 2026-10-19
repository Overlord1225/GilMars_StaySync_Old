import { useId, type ReactNode } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const tooltipId = useId();
  return <span className="group relative inline-flex">
    <span tabIndex={0} aria-describedby={tooltipId} className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{children}</span>
    <span id={tooltipId} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-dropdown mb-2 w-max max-w-56 -translate-x-1/2 rounded-control bg-brand-dark px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-raised transition-opacity duration-ui group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">{content}</span>
  </span>;
}
