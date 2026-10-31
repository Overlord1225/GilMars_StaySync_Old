import { useEffect, useCallback, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="fixed inset-0 cursor-default bg-brand-dark/45 transition-opacity duration-ui motion-reduce:transition-none"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : "Dialog"}
        aria-labelledby={title ? titleId : undefined}
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-card border border-border bg-surface p-5 shadow-raised transition duration-ui ease-ui motion-reduce:transition-none sm:p-6"
      >
        {title && (
          <div className="mb-4 flex items-center gap-2">
            <h2 id={titleId} className="text-xl font-semibold text-brand-dark">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-cream hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
