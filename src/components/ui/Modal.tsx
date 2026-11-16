import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

// `closedby` is not in React's types yet. "any" = Esc, back gesture and click outside.
const lightDismiss = { closedby: "any" } as object;

// Safari lacks `closedby`; only there do we close on a click outside the box.
const hasClosedBy =
  typeof HTMLDialogElement !== "undefined" &&
  "closedBy" in HTMLDialogElement.prototype;

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // The native modal gives inert page, focus containment, top layer, Esc and
  // focus return. We only sync it with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The parent owns the state: stop the native close and let `open` drive it.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (hasClosedBy || event.target !== dialogRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      {...lightDismiss}
      aria-label={title ? undefined : "Dialog"}
      aria-labelledby={title ? titleId : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
      className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-lg overflow-y-auto rounded-card border border-rule bg-surface p-5 text-ink shadow-raised backdrop:bg-overlay sm:w-full sm:p-6"
    >
      {open && (
        <>
          {title && (
            <div className="mb-4 flex items-center gap-2">
              <h2 id={titleId} className="text-xl text-brand-dark">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-paper hover:text-brand"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          )}
          {children}
        </>
      )}
    </dialog>
  );
}
