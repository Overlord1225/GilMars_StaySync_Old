import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/** Press `g` then a letter to jump to a page. `?` toggles the help list. */
export function useAdminShortcuts(targets: Record<string, string>) {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let armedAt = 0;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      // Never steal keys while someone is typing or a dialog is open.
      if (
        el?.closest("input, textarea, select, [contenteditable], [role=dialog]")
      )
        return;
      if (event.key === "?") {
        setHelpOpen((value) => !value);
        return;
      }
      if (event.key === "g") {
        armedAt = Date.now();
        return;
      }
      const to = targets[event.key];
      if (to && Date.now() - armedAt < 1500) {
        armedAt = 0;
        navigate(to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, targets]);

  return { helpOpen, setHelpOpen };
}
