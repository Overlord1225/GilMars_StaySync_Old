import { CircleAlert } from "lucide-react";

/** Error text under a field: an icon plus words, so color is never the only cue. */
export function FieldError({
  id,
  children,
  alert = true,
  className = "",
}: {
  id: string;
  children: string;
  alert?: boolean;
  className?: string;
}) {
  return (
    <p
      id={id}
      role={alert ? "alert" : undefined}
      className={`flex items-start gap-1.5 text-sm font-medium text-danger-700 ${className}`.trim()}
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.75}
      />
      <span>{children}</span>
    </p>
  );
}

/** Visible required marker for a label. The control carries `required` itself. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-danger-700">
      *
    </span>
  );
}
