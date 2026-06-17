import type { ReactNode } from "react";

// Section heading + optional subtitle + optional actions on the right.
// Used to break the dashboard and other long pages into clear chapters.
export function SectionHeader({
  title, subtitle, actions, id,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-header" id={id}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <div className="section-sub">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex gap-2 items-center">{actions}</div> : null}
    </div>
  );
}
