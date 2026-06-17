import type { ReactNode } from "react";
import { Icon, IconName } from "./Icon";

// A plain-English observation about the user's data. Strictly descriptive
// — never diagnostic, never prescriptive. Used at the top of the dashboard
// to translate raw numbers into a sentence the user can understand.
export function InsightCard({
  icon = "spark",
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="insight">
      <div className="ins-ico"><Icon name={icon} size={18} /></div>
      <div className="ins-body">
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
