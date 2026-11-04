import type { SVGAttributes } from "react";

/** The arched "G" from the GilMars logo: brand-green arch with the mango bar. */
export function BrandMark({
  className = "",
  ...props
}: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 172 205"
      aria-hidden="true"
      focusable="false"
      className={`${className.includes("text-") ? "" : "text-brand"} ${className}`.trim()}
      {...props}
    >
      <path
        d="M159.5 85A73.5 73.5 0 0 0 12.5 85V192.5H159.5V143"
        fill="none"
        stroke="currentColor"
        strokeWidth="25"
      />
      <rect x="86" y="117" width="86" height="26" className="fill-mango" />
    </svg>
  );
}
