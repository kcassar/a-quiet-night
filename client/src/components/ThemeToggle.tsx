import { useTheme } from "../lib/useTheme";
import { Icon } from "./Icon";

// Icon button that flips light ↔ dark. The actual class swap lives in
// useTheme so multiple instances stay in sync.
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
