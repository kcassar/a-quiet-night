import { Link, NavLink } from "react-router-dom";
import { Icon, IconName } from "./Icon";

// Sidebar shown ONLY inside the /my-data section. The links here are the
// app sub-routes plus a "back" link that returns the user to the public
// site, so they always have an obvious way out of the tool.

const ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/my-data",           label: "Overview",      icon: "dashboard", end: true },
  { to: "/my-data/upload",    label: "Upload data",   icon: "upload" },
  { to: "/my-data/dashboard", label: "Dashboard",     icon: "spark" },
  { to: "/my-data/export",    label: "Export",        icon: "download" },
];

export function DataSidebar() {
  return (
    <aside className="sidebar" aria-label="My Data navigation">
      <Link to="/" className="sidebar-brand" aria-label="Back to A Quiet Night">
        <img src="/aquietnight-logo.png" alt="" />
      </Link>

      <nav className="sidebar-nav">
        {ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon name={item.icon} className="ico" size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <Link to="/" className="sidebar-back">
          <Icon name="arrow-right" size={14} className="ico-flip" aria-hidden="true" />
          <span>Back to the site</span>
        </Link>
      </div>
    </aside>
  );
}
