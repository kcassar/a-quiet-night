import { type ReactNode, useId } from "react";

// Lightweight CSS-only tooltip. The text is exposed via aria-describedby
// for screen readers and title as fallback for touch devices.
export function Tooltip({
  label, children,
}: { label: string; children: ReactNode }) {
  const tooltipId = useId();
  return (
    <span className="tip" tabIndex={0} aria-describedby={tooltipId} title={label}>
      {children}
      <span id={tooltipId} className="tip-bubble" role="tooltip">{label}</span>
    </span>
  );
}
