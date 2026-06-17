import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import type { DistributionBucket } from "../api";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";

const COLOURS = ["#6FAF9A", "#8EB8C7", "#BCA8C8", "#F2D087", "#F2B8A2", "#C57860"];

export function AhiDistributionChart({ data }: { data: DistributionBucket[] }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) {
    return (
      <ChartCard title="AHI distribution">
        <EmptyState icon="info" title="No AHI values to summarise yet." />
      </ChartCard>
    );
  }
  return (
    <ChartCard
      title="AHI distribution"
      subtitle="Events per hour, grouped by night."
      footer="How many of your nights fell into each AHI band. Many clinicians aim for AHI under 5 on therapy — discuss your targets with them."
    >
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(v: number | string, _name, item) => {
                const count = typeof v === "number" ? v : Number(v);
                const pct = total ? Math.round((count / total) * 100) : 0;
                return [`${count} night(s) (${pct}%)`, `AHI ${item?.payload?.label ?? ""}`];
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLOURS[i] ?? "var(--primary)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
