import type { ReactNode } from "react";

// Native <details>/<summary> styled to match the system. Free a11y, free
// keyboard support, no JS — open/close is handled by the browser.
export function Accordion({
  title, defaultOpen, children,
}: { title: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="accordion" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}
