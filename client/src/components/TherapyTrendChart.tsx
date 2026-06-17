import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";

export interface TrendPoint {
  date: string;
  value: number | null;
}

interface Props {
  title: string;
  subtitle?: string;
  unit?: string;
  data: TrendPoint[];
  kind?: "line" | "bar";
  colour?: string;
  threshold?: { value: number; label: string };
  overlay?: { name: string; data: TrendPoint[]; colour?: string };
  shadeBand?: { fromDate: string; toDate: string; label: string };
  actions?: import("react").ReactNode;
}

export function TherapyTrendChart({
  title, subtitle, unit, data, kind = "line",
  colour = "var(--primary)",
  threshold, overlay, shadeBand, actions,
}: Props) {
  const overlayMap = new Map<string, number | null>();
  if (overlay) for (const p of overlay.data) overlayMap.set(p.date, p.value);
  const merged = data.map(d => ({
    date: d.date,
    value: d.value,
    overlay: overlayMap.get(d.date) ?? null,
  }));
  const cleaned = merged.filter(d => d.value !== null) as
    { date: string; value: number; overlay: number | null }[];

  if (!cleaned.length) {
    return (
      <ChartCard title={title} actions={actions}>
        <EmptyState icon="info" title="No data for this metric in the selected range." />
      </ChartCard>
    );
  }

  const tooltipFormatter = (value: number | string) => {
    const n = typeof value === "number" ? value : Number(value);
    return `${Number.isFinite(n) ? n.toFixed(2) : value}${unit ? ` ${unit}` : ""}`;
  };

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions}>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          {kind === "bar" ? (
            <BarChart data={cleaned} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} formatter={tooltipFormatter} />
              {shadeBand ? (
                <ReferenceArea
                  x1={shadeBand.fromDate}
                  x2={shadeBand.toDate}
                  fill="var(--accent-peach)"
                  fillOpacity={0.18}
                  ifOverflow="visible"
                  label={{ value: shadeBand.label, position: "insideTopLeft", fontSize: 11, fill: "var(--text-muted)" }}
                />
              ) : null}
              <Bar dataKey="value" fill={colour} name={title} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={cleaned} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: "var(--text-faint)", strokeDasharray: 3 }} formatter={tooltipFormatter} />
              {shadeBand ? (
                <ReferenceArea
                  x1={shadeBand.fromDate}
                  x2={shadeBand.toDate}
                  fill="var(--accent-peach)"
                  fillOpacity={0.18}
                  ifOverflow="visible"
                  label={{ value: shadeBand.label, position: "insideTopLeft", fontSize: 11, fill: "var(--text-muted)" }}
                />
              ) : null}
              {threshold ? (
                <ReferenceLine
                  y={threshold.value}
                  stroke="var(--text-faint)"
                  strokeDasharray="4 4"
                  label={{ value: threshold.label, position: "right", fontSize: 11, fill: "var(--text-muted)" }}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colour}
                strokeWidth={2}
                dot={{ r: 2, fill: colour, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name={title}
              />
              {overlay ? (
                <Line
                  type="monotone"
                  dataKey="overlay"
                  stroke={overlay.colour ?? "var(--text)"}
                  strokeWidth={2}
                  dot={false}
                  name={overlay.name}
                />
              ) : null}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
