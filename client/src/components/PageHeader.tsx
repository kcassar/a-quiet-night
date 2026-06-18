import type { ReactNode } from "react";

// Sticky page header at the top of content. Title + optional subtitle on
// the left; CTA slot on the right.
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
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
