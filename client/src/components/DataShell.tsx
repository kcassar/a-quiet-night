import { Outlet } from "react-router-dom";
import { DataSidebar } from "./DataSidebar";
import { DataMobileNav } from "./DataMobileNav";

// Layout used only inside /my-data. Sidebar + content + bottom nav on
// mobile — keeps the "app-like" feel that the rest of the site no longer
// has. The body class does NOT include "editorial", so dashboard headings
// stay in Inter.
export function DataShell() {
  return (
    <div className="app-shell">
      <DataSidebar />
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
      <DataMobileNav />
    </div>
  );
}
