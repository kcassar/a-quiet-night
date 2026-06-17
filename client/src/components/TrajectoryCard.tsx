import type { BeginnerInfo } from "../api";
import { Card } from "./Card";

// First week vs most-recent-week comparison. The right success metric for
// a beginner is *trajectory*, not lifetime average.
export function TrajectoryCard({ beginner }: { beginner: BeginnerInfo }) {
  const w1Usage = beginner.week1AverageUsageHours;
  const recentUsage = beginner.recentAverageUsageHours;
  const w1Ahi = beginner.week1AverageAhi;
  const recentAhi = beginner.recentAverageAhi;

  const usageDelta = w1Usage !== null && recentUsage !== null ? recentUsage - w1Usage : null;
  const ahiDelta   = w1Ahi !== null && recentAhi !== null ? recentAhi - w1Ahi : null;

  return (
    <Card>
      <h3>Trajectory so far</h3>
      <p className="muted small" style={{ marginTop: "calc(-1 * var(--space-2))" }}>
        First week of data compared with the most recent seven nights.
      </p>
      <div className="trajectory-grid mt-4">
        <div>
          <div className="label">Usage</div>
          <div className="value">
            {fmt(w1Usage, "h")}<span className="arrow">→</span>{fmt(recentUsage, "h")}
          </div>
          <div className="delta">{deltaText(usageDelta, "h", true)}</div>
        </div>
        <div>
          <div className="label">AHI</div>
          <div className="value">
            {fmt(w1Ahi)}<span className="arrow">→</span>{fmt(recentAhi)}
          </div>
          <div className="delta">{deltaText(ahiDelta, "", false)}</div>
        </div>
      </div>
      <p className="muted small mt-4">
        Big swings in your first month are normal. The trend is what your clinic looks at.
      </p>
    </Card>
  );
}

function fmt(n: number | null, suffix = ""): string {
  if (n === null) return "—";
  return `${n}${suffix}`;
}

function deltaText(delta: number | null, suffix: string, higherIsBetter: boolean): string {
  if (delta === null) return "Not enough data yet.";
  const abs = Math.abs(delta).toFixed(2);
  if (Math.abs(delta) < 0.05) return "About the same.";
  const direction = delta > 0 ? "up" : "down";
  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  const tone = isImprovement ? "→ moving in the right direction" : "→ worth watching";
  return `${direction} by ${abs}${suffix} ${tone}.`;
}
