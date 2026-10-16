import { useEffect, useCallback, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-black/5 p-6">
        {title && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-brand">{title}</h2>
            <button
              onClick={onClose}
              className="ml-auto p-1 text-slate-400 hover:text-brand"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}