import { Button } from "../ui/Button";

type GuestStepperProps = {
  value: number;
  max: number;
  onChange: (next: number) => void;
  /** Id for the count, so a validation error can move focus to it. */
  id?: string;
  error?: string;
};

export function GuestStepper({
  value,
  max,
  onChange,
  id,
  error,
}: GuestStepperProps) {
  const labelId = `${id ?? "guest-count"}-label`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id={labelId} className="text-sm font-medium text-ink">
            Guests
          </p>
          <p className="text-sm text-ink-muted">Up to {max}</p>
        </div>
        <div
          role="group"
          aria-labelledby={labelId}
          className="flex items-center gap-3"
        >
          <Button
            variant="outline"
            className="size-11 !px-0"
            aria-label="Fewer guests"
            disabled={value <= 1}
            onClick={() => onChange(value - 1)}
          >
            −
          </Button>
          <output
            id={id}
            tabIndex={-1}
            aria-live="polite"
            className="w-6 text-center text-lg font-semibold tabular-nums text-brand-dark"
          >
            {value}
          </output>
          <Button
            variant="outline"
            className="size-11 !px-0"
            aria-label="More guests"
            disabled={value >= max}
            onClick={() => onChange(value + 1)}
          >
            +
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
