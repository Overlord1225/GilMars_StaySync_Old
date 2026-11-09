import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Toast, type ToastVariant } from "./Toast";
import { ToastContext, type ToastAction } from "./ToastContext";

type ToastNotice = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
};
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<ToastNotice[]>([]);
  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", action?: ToastAction) => {
      const id = Date.now() + Math.random();
      setNotices((current) => [...current, { id, message, variant, action }]);
      const dismiss = () =>
        setNotices((current) => current.filter((notice) => notice.id !== id));
      // An undo needs time to be noticed.
      window.setTimeout(dismiss, action ? 8000 : 4000);
    },
    [],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-toast flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {notices.map((notice) => (
          <Toast
            key={notice.id}
            message={notice.message}
            variant={notice.variant}
            action={
              notice.action && {
                label: notice.action.label,
                onClick: () => {
                  notice.action?.onClick();
                  setNotices((current) =>
                    current.filter((item) => item.id !== notice.id),
                  );
                },
              }
            }
            role={notice.variant === "error" ? "alert" : "status"}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
