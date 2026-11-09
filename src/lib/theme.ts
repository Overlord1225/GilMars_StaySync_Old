export type ThemePreference = "light" | "dark" | "system";

const KEY = "theme";
const QUERY = "(prefers-color-scheme: dark)";

/** Mirrored by the inline script in index.html, which must run before the bundle loads. */
export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be blocked (private mode); fall back to the system setting.
  }
  return "system";
}

export function getResolvedTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolveTheme(
    preference,
    window.matchMedia(QUERY).matches,
  );
  window.dispatchEvent(new Event("themechange"));
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // The choice still applies for this page view.
  }
  apply(preference);
}

/** Apply the saved theme and follow OS changes while the preference is "system". */
export function initTheme() {
  apply(getThemePreference());
  window.matchMedia(QUERY).addEventListener("change", () => {
    if (getThemePreference() === "system") apply("system");
  });
}
