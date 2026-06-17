import { useEffect, useState } from "react";

// Light/dark theme store with localStorage persistence + system preference
// fallback. The theme is reflected on <html data-theme="…"> so global.css
// can switch CSS variables in one place.

type Theme = "light" | "dark";
const STORAGE_KEY = "aqn:theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* ignore */ }
  // Fall back to OS preference at first paint.
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme(): { theme: Theme; toggle: () => void; set: (t: Theme) => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  // Track system preference changes only when the user hasn't set a manual
  // override. Once they toggle, we stop following the OS.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const listener = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
      } catch { /* ignore */ }
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);

  return {
    theme,
    toggle: () => setTheme(t => (t === "dark" ? "light" : "dark")),
    set: setTheme,
  };
}
