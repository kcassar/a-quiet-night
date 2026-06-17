import type { HeatCell } from "../api";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";

// Apple Health-style heat calendar of nightly usage hours. Rows = days
// (Mon..Sun), columns = weeks. Empty cells = no data for that night.
function colourFor(hours: number | null): string {
  if (hours === null || hours === undefined) return "var(--bg-soft)";
  if (hours <= 0) return "var(--surface-2)";
  if (hours < 2) return "color-mix(in srgb, var(--success) 16%, var(--bg-soft))";
  if (hours < 4) return "color-mix(in srgb, var(--success) 38%, var(--bg-soft))";
  if (hours < 6) return "color-mix(in srgb, var(--success) 60%, var(--bg-soft))";
  if (hours < 8) return "color-mix(in srgb, var(--success) 82%, var(--bg-soft))";
  return "var(--primary)";
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function HeatCalendar({ cells }: { cells: HeatCell[] }) {
  if (!cells.length) {
    return (
      <ChartCard title="Nightly usage calendar">
        <EmptyState icon="calendar" title="No usage data to plot yet." />
      </ChartCard>
    );
  }
  const weekCount = Math.max(...cells.map(c => c.weekIndex)) + 1;
  const grid: (HeatCell | null)[][] = Array.from(
    { length: weekCount }, () => Array(7).fill(null)
  );
  for (const c of cells) grid[c.weekIndex][c.weekday] = c;

  // Build accessible summary for screen readers
  const totalNights = cells.length;
  const avgHours = cells.reduce((sum, c) => sum + (c.usageHours ?? 0), 0) / totalNights;
  const summaryText = `Nightly CPAP usage calendar showing ${totalNights} nights with an average of ${avgHours.toFixed(1)} hours per night.`;

  return (
    <ChartCard
      title="Nightly usage calendar"
      subtitle="Each square is one night. Darker = more hours of CPAP use."
    >
      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status">
        {summaryText}
      </div>

      {/* Visual heat map - decorative for sighted users, with accessible tooltips */}
      <div className="heat-grid" aria-hidden="true">
        <div className="heat-axis">
          {WEEKDAYS.map((d, i) => <div key={i} className="heat-day-label">{d}</div>)}
        </div>
        <div className="heat-cells">
          {grid.map((week, wi) => (
            <div key={wi} className="heat-week">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="heat-cell"
                  style={{ background: colourFor(cell?.usageHours ?? null) }}
                  title={cell ? `${cell.date}: ${cell.usageHours ?? 0}h` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Accessible data table for screen readers */}
      <table className="sr-only">
        <caption>Nightly CPAP usage by date</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Day</th>
            <th scope="col">Hours of use</th>
          </tr>
        </thead>
        <tbody>
          {cells.map(cell => (
            <tr key={cell.date}>
              <td>{cell.date}</td>
              <td>{WEEKDAY_FULL[cell.weekday]}</td>
              <td>{cell.usageHours ?? 0} hours</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="heat-legend" aria-hidden="true">
        <span>Less</span>
        <span className="heat-cell" style={{ background: "var(--bg-soft)" }} />
        <span className="heat-cell" style={{ background: "color-mix(in srgb, var(--success) 38%, var(--bg-soft))" }} />
        <span className="heat-cell" style={{ background: "color-mix(in srgb, var(--success) 60%, var(--bg-soft))" }} />
        <span className="heat-cell" style={{ background: "color-mix(in srgb, var(--success) 82%, var(--bg-soft))" }} />
        <span className="heat-cell" style={{ background: "var(--primary)" }} />
        <span>More</span>
      </div>
    </ChartCard>
  );
}
