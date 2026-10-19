import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Toast, type ToastVariant } from "./Toast";
import { ToastContext } from "./ToastContext";

type ToastNotice = { id: number; message: string; variant: ToastVariant };
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<ToastNotice[]>([]);
  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.random();
      setNotices((current) => [...current, { id, message, variant }]);
      window.setTimeout(
        () =>
          setNotices((current) => current.filter((notice) => notice.id !== id)),
        4000,
      );
    },
    [],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-toast flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {notices.map((notice) => (
          <Toast
            key={notice.id}
            message={notice.message}
            variant={notice.variant}
            role={notice.variant === "error" ? "alert" : "status"}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
