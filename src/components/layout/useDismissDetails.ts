import { useEffect, type RefObject } from "react";

/** Close open <details> menus on Escape (focus returns to the summary) or outside click. */
export function useDismissDetails(
  refs: RefObject<HTMLDetailsElement | null>[],
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      for (const ref of refs) {
        const el = ref.current;
        if (el?.open) {
          el.open = false;
          el.querySelector("summary")?.focus();
        }
      }
    }
    function onPointerDown(event: PointerEvent) {
      for (const ref of refs) {
        const el = ref.current;
        if (el?.open && !el.contains(event.target as Node)) el.open = false;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
    // refs are stable ref objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
