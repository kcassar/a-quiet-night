// Pill-style segmented control for chart date ranges.
export type Range = "7d" | "30d" | "90d" | "all";

const OPTIONS: { value: Range; label: string }[] = [
  { value: "7d",  label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All" },
];

export function RangeFilter({
  value, onChange,
}: { value: Range; onChange: (v: Range) => void }) {
  return (
    <div className="range-filter" role="radiogroup" aria-label="Date range">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
