import type { ReactNode } from "react";

// Wraps a chart with a consistent header layout (title, subtitle, optional
// actions like a date-range filter). All chart components compose this.
export function ChartCard({
  title, subtitle, actions, children, footer,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-baseline justify-between gap-3 mb-3" style={{ flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {subtitle ? <div className="muted small mt-2">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex gap-2 items-center">{actions}</div> : null}
      </div>
      {children}
      {footer ? <div className="muted small mt-3">{footer}</div> : null}
    </div>
  );
}
