import { useId, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  consequence: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  consequence,
  confirmLabel = "Confirm",
  cancelLabel = "Go back",
  loading = false,
  children,
}: ConfirmDialogProps) {
  const consequenceId = useId();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p id={consequenceId} className="text-sm leading-6 text-text">
          {consequence}
        </p>
        {children}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            aria-describedby={consequenceId}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
