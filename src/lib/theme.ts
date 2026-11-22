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

// Browser bar colors; keep equal to --color-paper in src/index.css.
export const THEME_COLOR = { light: "#f6f1e7", dark: "#141b19" } as const;

/** One theme-color tag that follows the chosen theme, not just the OS setting. */
function syncThemeColor(theme: "light" | "dark") {
  const tags = document.head.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  const tag = tags[0] ?? document.createElement("meta");
  tags.forEach((extra, index) => index > 0 && extra.remove());
  tag.name = "theme-color";
  tag.removeAttribute("media");
  tag.content = THEME_COLOR[theme];
  if (!tag.isConnected) document.head.append(tag);
}

function apply(preference: ThemePreference) {
  const theme = resolveTheme(preference, window.matchMedia(QUERY).matches);
  document.documentElement.dataset.theme = theme;
  syncThemeColor(theme);
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
