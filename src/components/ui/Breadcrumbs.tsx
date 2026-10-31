import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string; icon?: ReactNode };
export function Breadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 && (
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5 text-sand"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="m6 3 5 5-5 5" />
              </svg>
            )}
            {item.href && index !== items.length - 1 ? (
              <a
                href={item.href}
                className="inline-flex min-h-8 items-center gap-1 rounded-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {item.icon}
                {item.label}
              </a>
            ) : (
              <span
                aria-current={index === items.length - 1 ? "page" : undefined}
                className="inline-flex items-center gap-1 font-medium text-text"
              >
                {item.icon}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
