import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBeforeUnload, useLocation, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DEFAULT_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

/**
 * Asks before the user leaves a page with unsaved changes. Render the returned
 * `dialog` once in the page. Link clicks and back/forward are held until the
 * user picks "Leave page" or "Stay".
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = DEFAULT_MESSAGE,
): { dialog: ReactNode } {
  const location = useLocation();
  const navigate = useNavigate();
  const historyIndex = useRef<number>(window.history.state?.idx ?? 0);
  // Counts popstate events caused by our own history.go() calls.
  const ignoredPops = useRef(0);
  const [pending, setPending] = useState<{ leave: () => void } | null>(null);

  useBeforeUnload((event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    historyIndex.current = window.history.state?.idx ?? historyIndex.current;
  }, [location]);

  useEffect(() => {
    if (!isDirty) return;

    const protectInternalLinks = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.href === window.location.href
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setPending({
        leave: () =>
          navigate(
            `${destination.pathname}${destination.search}${destination.hash}`,
          ),
      });
    };

    const protectHistoryNavigation = () => {
      if (ignoredPops.current > 0) {
        ignoredPops.current -= 1;
        return;
      }
      const nextIndex = window.history.state?.idx;
      if (typeof nextIndex !== "number") return;
      const delta = historyIndex.current - nextIndex;
      if (!delta) return;
      // Undo the move now, then redo it only if the user confirms.
      ignoredPops.current += 1;
      window.history.go(delta);
      setPending({
        leave: () => {
          ignoredPops.current += 1;
          historyIndex.current = nextIndex;
          window.history.go(-delta);
        },
      });
    };

    document.addEventListener("click", protectInternalLinks, true);
    window.addEventListener("popstate", protectHistoryNavigation);
    return () => {
      document.removeEventListener("click", protectInternalLinks, true);
      window.removeEventListener("popstate", protectHistoryNavigation);
    };
  }, [isDirty, navigate]);

  const stay = useCallback(() => setPending(null), []);
  const leave = useCallback(() => {
    const action = pending;
    setPending(null);
    action?.leave();
  }, [pending]);

  return {
    dialog: (
      <ConfirmDialog
        open={pending !== null && isDirty}
        onClose={stay}
        onConfirm={leave}
        title="Leave this page?"
        consequence={message}
        confirmLabel="Leave page"
        cancelLabel="Stay"
      />
    ),
  };
}
