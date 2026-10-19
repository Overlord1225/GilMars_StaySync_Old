import type { InquiryStatus } from '@/lib/types'

const steps: { status: InquiryStatus; label: string }[] = [
  { status: 'new', label: 'Received' },
  { status: 'in_progress', label: 'Being reviewed' },
  { status: 'resolved', label: 'Resolved' },
]

export function StatusTimeline({ status }: { status: InquiryStatus }) {
  const currentIndex = steps.findIndex((step) => step.status === status)
  return <ol aria-label="Message status progress" className="grid grid-cols-3 gap-2">
    {steps.map((step, index) => {
      const current = index === currentIndex
      const complete = index < currentIndex
      return <li key={step.status} aria-current={current ? 'step' : undefined} className={`min-w-0 border-t-2 pt-2 ${complete || current ? 'border-t-brand' : 'border-t-border'}`}>
        <span className={`block text-xs leading-5 ${current ? 'font-semibold text-brand-dark' : complete ? 'font-medium text-text' : 'text-text-muted'}`}>{step.label}{current ? ' · current' : ''}</span>
      </li>
    })}
  </ol>
}
