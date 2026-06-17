import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { DayOfWeekRow } from "../api";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";

export function DayOfWeekChart({ data }: { data: DayOfWeekRow[] }) {
  const usable = data.some(d => d.averageAhi !== null || d.averageUsageHours !== null);
  if (!usable) {
    return (
      <ChartCard title="By day of the week">
        <EmptyState icon="calendar" title="Not enough data yet to spot weekday patterns." />
      </ChartCard>
    );
  }
  return (
    <ChartCard
      title="By day of the week"
      subtitle="Mean values per weekday across this dataset."
      footer="A standout weekday is something to think about — not a verdict."
    >
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="averageUsageHours" name="Usage (h)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="averageAhi"       name="AHI"       fill="var(--accent-peach)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
