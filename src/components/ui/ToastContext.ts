import { createContext } from "react";
import type { ToastVariant } from "./Toast";

export type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};
export const ToastContext = createContext<ToastContextValue | null>(null);
