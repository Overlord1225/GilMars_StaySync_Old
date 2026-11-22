import { useSyncExternalStore } from "react";
import { getResolvedTheme, setThemePreference } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

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
      title={dark ? "Light mode" : "Dark mode"}
      onClick={() => setThemePreference(dark ? "light" : "dark")}
      className={`inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-ui hover:bg-brand-light hover:text-brand-dark ${className}`.trim()}
    >
      {dark ? (
        <Sun className={icon} strokeWidth={1.5} />
      ) : (
        <Moon className={icon} strokeWidth={1.5} />
      )}
    </button>
  );
}
