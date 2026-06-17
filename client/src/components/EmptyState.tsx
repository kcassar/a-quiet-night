import type { ReactNode } from "react";
import { Icon, IconName } from "./Icon";

// Centred icon + headline + body + optional CTA. Shown for "no data yet"
// states across the dashboard, journal-replacement spaces, and search.
export function EmptyState({
  icon = "info", title, body, action,
}: {
  icon?: IconName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
