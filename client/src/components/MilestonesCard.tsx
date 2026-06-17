import type { BeginnerInfo } from "../api";
import { Card } from "./Card";
import { Icon } from "./Icon";

// Beginner milestone list — encouraging, never punishing. Achieved
// milestones get a tick; unachieved ones get a quiet placeholder.
export function MilestonesCard({ beginner }: { beginner: BeginnerInfo }) {
  const items = beginner.milestones;
  return (
    <Card>
      <h3>Milestones</h3>
      <p className="muted small" style={{ marginTop: "calc(-1 * var(--space-2))" }}>
        Markers many people pass in their first month or two. Day {beginner.daysSinceStart} since your first recorded night.
      </p>
      <ul className="milestone-list" style={{ marginTop: "var(--space-4)" }}>
        {items.map(m => (
          <li key={m.id} className={m.achieved ? "achieved" : "pending"}>
            <span className="milestone-icon" aria-hidden="true">
              {m.achieved ? <Icon name="check" size={14} /> : "·"}
            </span>
            <div>
              <div className="milestone-title">{labelFor(m.id)}</div>
              <div className="milestone-detail">
                {m.achieved && m.date ? (
                  <>Reached on <strong>{m.date}</strong>. {m.description}</>
                ) : m.achieved ? m.description : <>Not yet — {m.description.toLowerCase()}</>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function labelFor(id: string): string {
  switch (id) {
    case "first-night":             return "First night recorded";
    case "first-four-hour":         return "First 4-hour night";
    case "first-ahi-under-five":    return "First night with AHI under 5";
    case "first-full-week":         return "First full compliant week";
    case "thirty-day-mark":         return "Thirty-day mark";
    default:                        return id;
  }
}
