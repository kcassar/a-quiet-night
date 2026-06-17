import type { ReactNode } from "react";
import { StatusChip, Tone } from "./StatusChip";

// Headline metric. Big serif value + small status chip + collapsible
// explanation to keep the dashboard quiet by default.
interface Props {
  label: string;
  value: string;
  suffix?: string;
  status?: { tone: Tone; label: string };
  trend?: ReactNode;
  explanation?: ReactNode;
}

export function MetricCard({ label, value, suffix, status, trend, explanation }: Props) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {suffix ? <span className="value-suffix">{suffix}</span> : null}
      </div>
      <div className="meta">
        {status ? <StatusChip tone={status.tone}>{status.label}</StatusChip> : null}
        {trend ? <span>{trend}</span> : null}
      </div>
      {explanation ? (
        <details>
          <summary>What this means</summary>
          <p>{explanation}</p>
        </details>
      ) : null}
    </div>
  );
}
