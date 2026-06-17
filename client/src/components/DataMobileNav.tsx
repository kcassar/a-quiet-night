import { NavLink } from "react-router-dom";
import { Icon, IconName } from "./Icon";

// Bottom navigation shown ONLY inside the /my-data section on narrow
// screens. Mirrors the desktop sidebar with the same four destinations.

const ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/my-data",           label: "Overview",   icon: "dashboard", end: true },
  { to: "/my-data/upload",    label: "Upload",     icon: "upload" },
  { to: "/my-data/dashboard", label: "Dashboard",  icon: "spark" },
  { to: "/my-data/export",    label: "Export",     icon: "download" },
  { to: "/",                  label: "Exit",       icon: "close" },
];

export function DataMobileNav() {
  return (
    <nav className="bottom-nav" aria-label="My Data navigation (mobile)">
      {ITEMS.map(p => (
        <NavLink key={p.to} to={p.to} end={p.end}>
          <Icon name={p.icon} size={22} />
          <span>{p.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
