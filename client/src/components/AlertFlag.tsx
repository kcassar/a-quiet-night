import { Link } from "react-router-dom";
import type { TherapyFlag } from "../api";
import { StatusChip, Tone } from "./StatusChip";

const TONE_BY_SEVERITY: Record<TherapyFlag["severity"], Tone> = {
  info: "info",
  watch: "warning",
  discuss: "discuss",
};

const LABEL_BY_SEVERITY: Record<TherapyFlag["severity"], string> = {
  info: "Informational",
  watch: "Worth watching",
  discuss: "Worth discussing",
};

// Educational flag with optional deep-link to a help page.
export function AlertFlag({ flag }: { flag: TherapyFlag }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <StatusChip tone={TONE_BY_SEVERITY[flag.severity]}>
          {LABEL_BY_SEVERITY[flag.severity]}
        </StatusChip>
      </div>
      <h3 style={{ marginBottom: "var(--space-2)" }}>{flag.title}</h3>
      <p className="muted small" style={{ margin: 0 }}>{flag.detail}</p>
      {flag.guideHref ? (
        <p className="small" style={{ marginTop: "var(--space-3)" }}>
          <Link to={flag.guideHref}>{linkLabelFor(flag.guideHref)} →</Link>
        </p>
      ) : null}
    </div>
  );
}

function linkLabelFor(href: string): string {
  if (href === "/cpap-guide") return "Read the CPAP beginner guide";
  if (href === "/resources") return "Open the troubleshooting checklists";
  return "Read more";
}
