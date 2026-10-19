export type Step = { label: string; description?: string };
export function Stepper({ steps, currentStep, className = "" }: { steps: Step[]; currentStep: number; className?: string }) {
  if (steps.length === 0) return null;
  const currentIndex = Math.min(Math.max(currentStep, 0), steps.length - 1);
  return <nav aria-label="Progress" className={className}>
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return <li key={`${step.label}-${index}`} aria-current={current ? "step" : undefined} className={`flex min-h-11 items-start gap-3 border-l-2 pl-3 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-3 ${complete || current ? "border-brand" : "border-border"}`}>
          <span aria-hidden="true" className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${complete ? "border-brand bg-brand text-white" : current ? "border-brand bg-brand-light text-brand-dark" : "border-border bg-surface text-text-muted"}`}>{complete ? <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7" /></svg> : index + 1}</span>
          <span><span className={`block text-sm font-semibold ${current ? "text-brand-dark" : "text-text"}`}>{step.label}</span>{step.description && <span className="mt-0.5 block text-xs text-text-muted">{step.description}</span>}</span>
        </li>;
      })}
    </ol>
    <span className="sr-only" aria-live="polite">Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}</span>
  </nav>;
}
