import { useSyncExternalStore } from "react";
import { getResolvedTheme, setThemePreference } from "@/lib/theme";

function subscribe(onChange: () => void) {
  window.addEventListener("themechange", onChange);
  return () => window.removeEventListener("themechange", onChange);
}

const icon = "size-5 fill-none stroke-current stroke-[1.75]";

/** Sun/moon toggle. The first visit follows the device; a click saves the choice. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribe,
    getResolvedTheme,
    () => "light" as const,
  );
  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setThemePreference(dark ? "light" : "dark")}
      className={`inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-ui hover:bg-brand-light hover:text-brand-dark ${className}`.trim()}
    >
      {dark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={icon}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={icon}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
