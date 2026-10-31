import { useEffect, useRef } from "react";
import { useBeforeUnload, useLocation } from "react-router-dom";

const DEFAULT_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = DEFAULT_MESSAGE,
) {
  const location = useLocation();
  const historyIndex = useRef<number>(window.history.state?.idx ?? 0);
  const restoringHistory = useRef(false);

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
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const protectHistoryNavigation = () => {
      if (restoringHistory.current) {
        restoringHistory.current = false;
        return;
      }
      const nextIndex = window.history.state?.idx;
      if (typeof nextIndex !== "number") return;
      const delta = historyIndex.current - nextIndex;
      if (!delta || window.confirm(message)) {
        historyIndex.current = nextIndex;
        return;
      }
      restoringHistory.current = true;
      window.history.go(delta);
    };

    document.addEventListener("click", protectInternalLinks, true);
    window.addEventListener("popstate", protectHistoryNavigation);
    return () => {
      document.removeEventListener("click", protectInternalLinks, true);
      window.removeEventListener("popstate", protectHistoryNavigation);
    };
  }, [isDirty, message]);
}
