import type { ReactNode } from "react";
import { Icon } from "./Icon";

// Highlighted "key takeaway" callout for editorial pages. Reads as a calm
// pull-quote, not a warning.
export function Takeaway({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="takeaway" role="note">
      <div className="ico"><Icon name="leaf" size={20} /></div>
      <div>
        {title ? <h4>{title}</h4> : null}
        <p>{children}</p>
      </div>
    </aside>
  );
}
