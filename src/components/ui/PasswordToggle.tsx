import { Eye, EyeOff } from "lucide-react";

/** Eye icon button that sits inside an Input's `trailing` slot. */
export function PasswordToggle({
  visible,
  onToggle,
  label = "password",
}: {
  visible: boolean;
  onToggle: () => void;
  label?: string;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <button
      type="button"
      aria-label={`${visible ? "Hide" : "Show"} ${label}`}
      aria-pressed={visible}
      onClick={onToggle}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-muted"
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
