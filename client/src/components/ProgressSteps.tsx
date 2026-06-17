import type { ReactNode } from "react";

// Three (or more) numbered cards showing the user where they are in the
// upload flow. `currentIndex` highlights the active one.
export interface Step { title: string; description: ReactNode; }

export function ProgressSteps({
  steps, currentIndex,
}: { steps: Step[]; currentIndex: number }) {
  return (
    <ol className="steps" aria-label="Upload progress">
      {steps.map((s, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "";
        return (
          <li key={i} className={`step ${state}`}>
            <div className="step-num" aria-hidden="true">
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
