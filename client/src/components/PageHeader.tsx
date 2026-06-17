import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

// Sticky page header at the top of content. Title + optional subtitle on
// the left; CTA + theme toggle on the right.
export function PageHeader({
  title, subtitle, actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-inner">
        <div className="page-header-titles">
          <h1 className="page-header-title">{title}</h1>
          {subtitle ? <div className="page-header-subtitle">{subtitle}</div> : null}
        </div>
        <div className="page-header-actions">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
