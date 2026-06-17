import type { ReactNode } from "react";

// Small colour-coded pill used for metric statuses, flag severities, and
// product tags. Tone is descriptive only — never alarming.

export type Tone = "success" | "warning" | "discuss" | "info" | "neutral";

export function StatusChip({
  tone = "neutral", children, dot = true,
}: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`chip ${tone}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  );
}
