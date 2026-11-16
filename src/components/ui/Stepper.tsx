import { Check } from "lucide-react";
export type Step = { label: string; description?: string };
export function Stepper({
  steps,
  currentStep,
  className = "",
}: {
  steps: Step[];
  currentStep: number;
  className?: string;
}) {
  if (steps.length === 0) return null;
  const currentIndex = Math.min(Math.max(currentStep, 0), steps.length - 1);
  return (
    <nav aria-label="Progress" className={className}>
      <div aria-hidden="true" className="sm:hidden">
        <p className="text-sm text-ink-muted">
          Step {currentIndex + 1} of {steps.length}
          <span className="font-semibold text-brand-dark">
            {" · "}
            {steps[currentIndex]?.label}
          </span>
        </p>
        <div className="mt-2 flex gap-1.5">
          {steps.map((step, index) => (
            <span
              key={`${step.label}-${index}`}
              className={`h-1 flex-1 rounded-full ${index <= currentIndex ? "bg-brand" : "bg-rule"}`}
            />
          ))}
        </div>
      </div>
      <ol
        className={`hidden gap-4 sm:grid ${steps.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
      >
        {steps.map((step, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li
              key={`${step.label}-${index}`}
              aria-current={current ? "step" : undefined}
              className={`flex min-h-11 items-start gap-3 border-t-2 pt-3 ${complete || current ? "border-brand" : "border-rule"}`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${complete ? "border-brand bg-brand text-on-fill" : current ? "border-brand bg-brand-light text-brand-dark" : "border-rule bg-surface text-ink-muted"}`}
              >
                {complete ? (
                  <Check className="size-4" strokeWidth={1.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold ${current ? "text-brand-dark" : "text-ink"}`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {step.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <span className="sr-only" aria-live="polite">
        Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
      </span>
    </nav>
  );
}
