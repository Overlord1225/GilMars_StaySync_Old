import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export function PageHeader({ title, description, actions, breadcrumbs, className = "" }: { title: string; description?: string; actions?: ReactNode; breadcrumbs?: BreadcrumbItem[]; className?: string }) {
  return <header className={`space-y-4 ${className}`}>
    {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold leading-tight text-brand-dark sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-base leading-6 text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}
