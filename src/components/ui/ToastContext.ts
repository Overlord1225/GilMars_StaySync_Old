import { createContext } from "react";
import type { ToastVariant } from "./Toast";

export type ToastAction = { label: string; onClick: () => void };

export type ToastContextValue = {
  showToast: (
    message: string,
    variant?: ToastVariant,
    action?: ToastAction,
  ) => void;
};
export const ToastContext = createContext<ToastContextValue | null>(null);
