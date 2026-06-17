import type { ReactNode } from "react";

// Repeated reassurance: educational only, not medical advice. Quiet by
// design — sits as a soft callout rather than a warning siren.
export function DisclaimerBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="disclaimer-banner" role="note" aria-label="Medical disclaimer">
      <strong>Educational only.</strong>{" "}
      {children ??
        "A Quiet Night does not diagnose, prescribe, or recommend pressure changes. Please discuss any therapy or treatment changes with a qualified sleep clinician."}
    </div>
  );
}
