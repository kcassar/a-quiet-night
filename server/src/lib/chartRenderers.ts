// Vector chart renderers for PDF export.
//
// We draw charts as native pdfkit primitives (lines, rects, paths, text)
// rather than rasterising. Reasons:
//   - No new dependencies (no node-canvas / no chartjs-node-canvas)
//   - Output is vector, so the PDF stays small and sharp at any zoom
//   - Colours and type can match the on-screen design exactly
//
// All functions take a `frame` (where on the page to draw) and return
// nothing — they mutate the document. The frame's (x, y) is the top-left
// of the chart area; we lay out title, axes, plot, and footnote inside it.

import type PDFKit from "pdfkit";
import type {
  DistributionBucket, DayOfWeekRow, HeatCell, EventComposition,
} from "./analysis";

// ---- shared colours -----------------------------------------------------

export const PALETTE = {
  ink:        "#253331",
  inkMuted:   "#6B7773",
  inkFaint:   "#9AA39E",
  border:     "#DDD4C8",
  borderSoft: "#EFE7DA",
  primary:    "#244F4B",
  accent:     "#8EB8C7",
  warning:    "#D9A441",
  success:    "#6FAF9A",
  discuss:    "#C57860",
  peach:      "#F2B8A2",
  surface:    "#FFFFFF",
  cream:      "#F7F2EA",
} as const;

// ---- frame + utilities --------------------------------------------------

export interface Frame {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlotArea { x: number; y: number; w: number; h: number; }

function drawTitle(f: Frame, title: string, subtitle?: string): number {
  f.doc.font("Helvetica-Bold").fontSize(11).fillColor(PALETTE.ink)
       .text(title, f.x, f.y);
  let used = 16;
  if (subtitle) {
    f.doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
         .text(subtitle, f.x, f.y + used);
    used += 11;
  }
  return used;
}

function drawNoData(f: Frame, plot: PlotArea, message = "No data") {
  f.doc.font("Helvetica").fontSize(9).fillColor(PALETTE.inkFaint)
       .text(message, plot.x, plot.y + plot.h / 2 - 6, { width: plot.w, align: "center" });
}

// Linear interpolation scale.
function scale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

// Round a value up to a "nice" axis maximum (1, 2, 5 × 10^n).
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const mant = value / Math.pow(10, exp);
  const niceMant = mant <= 1 ? 1 : mant <= 2 ? 2 : mant <= 5 ? 5 : 10;
  return niceMant * Math.pow(10, exp);
}

function ticks(maxValue: number, count = 4): number[] {
  if (maxValue <= 0) return [0];
  const step = maxValue / count;
  return Array.from({ length: count + 1 }, (_, i) => +(i * step).toFixed(2));
}

// Pick a sparse set of date indices to label on the X axis (~6 labels).
function pickDateLabels(dates: string[], maxLabels = 6): { i: number; label: string }[] {
  if (dates.length === 0) return [];
  if (dates.length <= maxLabels) {
    return dates.map((d, i) => ({ i, label: shortDate(d) }));
  }
  const step = Math.max(1, Math.floor(dates.length / (maxLabels - 1)));
  const out: { i: number; label: string }[] = [];
  for (let i = 0; i < dates.length; i += step) {
    out.push({ i, label: shortDate(dates[i]) });
  }
  if (out[out.length - 1].i !== dates.length - 1) {
    out.push({ i: dates.length - 1, label: shortDate(dates[dates.length - 1]) });
  }
  return out;
}

function shortDate(iso: string): string {
  // 2026-03-15 → 15 Mar
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]}`;
}

function drawAxes(f: Frame, plot: PlotArea, yMax: number, xLabels: { i: number; label: string }[], xCount: number) {
  const doc = f.doc;
  // Y gridlines + labels
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted);
  const ys = ticks(yMax, 4);
  for (const t of ys) {
    const y = plot.y + plot.h - (t / yMax) * plot.h;
    doc.lineWidth(0.5).strokeColor(PALETTE.borderSoft)
       .moveTo(plot.x, y).lineTo(plot.x + plot.w, y).stroke();
    doc.fillColor(PALETTE.inkMuted).text(String(+t.toFixed(2)), plot.x - 30, y - 4, {
      width: 26, align: "right",
    });
  }
  // Y axis line
  doc.lineWidth(0.5).strokeColor(PALETTE.border)
     .moveTo(plot.x, plot.y).lineTo(plot.x, plot.y + plot.h).stroke();
  // X axis line
  doc.moveTo(plot.x, plot.y + plot.h).lineTo(plot.x + plot.w, plot.y + plot.h).stroke();
  // X labels
  if (xCount > 0) {
    const xScale = scale([0, Math.max(1, xCount - 1)], [plot.x, plot.x + plot.w]);
    for (const { i, label } of xLabels) {
      const px = xScale(i);
      doc.fillColor(PALETTE.inkMuted).text(label, px - 18, plot.y + plot.h + 4, {
        width: 36, align: "center",
      });
    }
  }
}

// ---- line chart ---------------------------------------------------------

interface LineChartOptions {
  title: string;
  subtitle?: string;
  unit?: string;
  data: { date: string; value: number | null }[];
  overlay?: { name: string; data: { date: string; value: number | null }[]; colour?: string };
  threshold?: { value: number; label: string; colour?: string };
  colour?: string;
  shadeBand?: { fromIndex: number; toIndex: number; label?: string };
}

export function drawLineChart(f: Frame, opt: LineChartOptions) {
  const used = drawTitle(f, opt.title, opt.subtitle);
  const plot: PlotArea = {
    x: f.x + 38,
    y: f.y + used + 4,
    w: f.width - 38,
    h: f.height - used - 22,
  };

  const cleaned = opt.data.filter(p => typeof p.value === "number") as { date: string; value: number }[];
  if (!cleaned.length) { drawNoData(f, plot); return; }

  const allDates = opt.data.map(d => d.date);
  const overlayMap = new Map<string, number>();
  if (opt.overlay) {
    for (const p of opt.overlay.data) {
      if (typeof p.value === "number") overlayMap.set(p.date, p.value);
    }
  }

  const valueMax = Math.max(
    ...cleaned.map(p => p.value),
    opt.threshold ? opt.threshold.value : 0,
    ...Array.from(overlayMap.values()),
  );
  const yMax = niceMax(valueMax * 1.1);
  const xCount = allDates.length;
  const xScale = scale([0, Math.max(1, xCount - 1)], [plot.x, plot.x + plot.w]);
  const yScale = scale([0, yMax], [plot.y + plot.h, plot.y]);

  drawAxes(f, plot, yMax, pickDateLabels(allDates), xCount);

  const doc = f.doc;

  // Beginner shaded band
  if (opt.shadeBand) {
    const x1 = xScale(opt.shadeBand.fromIndex);
    const x2 = xScale(opt.shadeBand.toIndex);
    doc.save();
    doc.fillColor(PALETTE.peach).fillOpacity(0.18)
       .rect(x1, plot.y, x2 - x1, plot.h).fill();
    doc.fillOpacity(1);
    doc.restore();
    if (opt.shadeBand.label) {
      doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted)
         .text(opt.shadeBand.label, x1 + 3, plot.y + 3, { width: x2 - x1 });
    }
  }

  // Threshold reference line
  if (opt.threshold) {
    const ty = yScale(opt.threshold.value);
    doc.save();
    doc.lineWidth(0.7).strokeColor(opt.threshold.colour ?? PALETTE.inkFaint).dash(3, { space: 3 })
       .moveTo(plot.x, ty).lineTo(plot.x + plot.w, ty).stroke();
    doc.undash();
    doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted)
       .text(opt.threshold.label, plot.x + plot.w - 60, ty - 9, { width: 58, align: "right" });
    doc.restore();
  }

  // Primary line — aligned by index in the original (ungappy) array so
  // missing nights produce gaps in the line.
  const colour = opt.colour ?? PALETTE.primary;
  doc.lineWidth(1.5).strokeColor(colour);
  let started = false;
  for (let i = 0; i < opt.data.length; i++) {
    const v = opt.data[i].value;
    if (typeof v !== "number") { started = false; continue; }
    const px = xScale(i);
    const py = yScale(v);
    if (!started) { doc.moveTo(px, py); started = true; }
    else doc.lineTo(px, py);
  }
  doc.stroke();

  // Dots
  doc.fillColor(colour);
  for (let i = 0; i < opt.data.length; i++) {
    const v = opt.data[i].value;
    if (typeof v !== "number") continue;
    doc.circle(xScale(i), yScale(v), 1.3).fill();
  }

  // Overlay (rolling avg)
  if (opt.overlay) {
    const ocol = opt.overlay.colour ?? PALETTE.ink;
    doc.lineWidth(1.5).strokeColor(ocol);
    let ostarted = false;
    for (let i = 0; i < opt.data.length; i++) {
      const v = overlayMap.get(opt.data[i].date);
      if (typeof v !== "number") { ostarted = false; continue; }
      const px = xScale(i);
      const py = yScale(v);
      if (!ostarted) { doc.moveTo(px, py); ostarted = true; }
      else doc.lineTo(px, py);
    }
    doc.stroke();

    // Mini legend at the top-right of the plot.
    doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted);
    const legendY = plot.y + 3;
    doc.fillColor(colour).rect(plot.x + plot.w - 95, legendY + 2, 8, 2).fill();
    doc.fillColor(PALETTE.inkMuted).text(opt.title, plot.x + plot.w - 84, legendY, { width: 50 });
    doc.fillColor(ocol).rect(plot.x + plot.w - 95, legendY + 12, 8, 2).fill();
    doc.fillColor(PALETTE.inkMuted).text(opt.overlay.name, plot.x + plot.w - 84, legendY + 10, { width: 70 });
  }
}

// ---- bar chart ----------------------------------------------------------

interface BarChartOptions {
  title: string;
  subtitle?: string;
  unit?: string;
  data: { date: string; value: number | null }[];
  colour?: string;
  shadeBand?: { fromIndex: number; toIndex: number; label?: string };
}

export function drawBarChart(f: Frame, opt: BarChartOptions) {
  const used = drawTitle(f, opt.title, opt.subtitle);
  const plot: PlotArea = {
    x: f.x + 38,
    y: f.y + used + 4,
    w: f.width - 38,
    h: f.height - used - 22,
  };
  const cleaned = opt.data.filter(p => typeof p.value === "number") as { date: string; value: number }[];
  if (!cleaned.length) { drawNoData(f, plot); return; }

  const allDates = opt.data.map(d => d.date);
  const yMax = niceMax(Math.max(...cleaned.map(p => p.value)) * 1.1);
  const xCount = allDates.length;
  const xScale = scale([0, Math.max(1, xCount - 1)], [plot.x, plot.x + plot.w]);
  const yScale = scale([0, yMax], [plot.y + plot.h, plot.y]);

  drawAxes(f, plot, yMax, pickDateLabels(allDates), xCount);

  const doc = f.doc;

  if (opt.shadeBand) {
    const x1 = xScale(opt.shadeBand.fromIndex);
    const x2 = xScale(opt.shadeBand.toIndex);
    doc.save();
    doc.fillColor(PALETTE.peach).fillOpacity(0.18)
       .rect(x1, plot.y, x2 - x1, plot.h).fill();
    doc.fillOpacity(1);
    doc.restore();
  }

  const barW = Math.max(2, Math.min(10, (plot.w / Math.max(1, xCount)) - 1));
  const colour = opt.colour ?? PALETTE.primary;
  doc.fillColor(colour);
  for (let i = 0; i < opt.data.length; i++) {
    const v = opt.data[i].value;
    if (typeof v !== "number") continue;
    const px = xScale(i) - barW / 2;
    const py = yScale(v);
    const h = plot.y + plot.h - py;
    doc.rect(px, py, barW, h).fill();
  }
}

// ---- histogram ----------------------------------------------------------

export function drawHistogram(f: Frame, title: string, buckets: DistributionBucket[]) {
  const used = drawTitle(f, title, "Events per hour, by night");
  const plot: PlotArea = {
    x: f.x + 38,
    y: f.y + used + 4,
    w: f.width - 38,
    h: f.height - used - 22,
  };

  const total = buckets.reduce((a, b) => a + b.count, 0);
  if (total === 0) { drawNoData(f, plot); return; }

  const yMax = niceMax(Math.max(...buckets.map(b => b.count)));
  const yScale = scale([0, yMax], [plot.y + plot.h, plot.y]);
  // gridlines + axis
  drawAxes(f, plot, yMax, [], 0);

  const doc = f.doc;
  const colours = [PALETTE.success, PALETTE.accent, "#BCA8C8", PALETTE.warning, PALETTE.peach, PALETTE.discuss];
  const barW = (plot.w - 12 * (buckets.length + 1)) / buckets.length;

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const px = plot.x + 12 + i * (barW + 12);
    const py = yScale(b.count);
    const h = plot.y + plot.h - py;
    if (b.count > 0) {
      doc.fillColor(colours[i] ?? PALETTE.primary).rect(px, py, barW, h).fill();
    }
    // count above bar
    if (b.count > 0) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(PALETTE.ink)
         .text(String(b.count), px, py - 11, { width: barW, align: "center" });
    }
    // label below x axis
    doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
       .text(b.label, px, plot.y + plot.h + 4, { width: barW, align: "center" });
  }
}

// ---- day-of-week --------------------------------------------------------

export function drawDayOfWeek(f: Frame, rows: DayOfWeekRow[]) {
  const used = drawTitle(f, "By day of the week", "Mean usage and AHI per weekday");
  const plot: PlotArea = {
    x: f.x + 38,
    y: f.y + used + 4,
    w: f.width - 60,
    h: f.height - used - 22,
  };

  const usable = rows.some(r => r.averageAhi !== null || r.averageUsageHours !== null);
  if (!usable) { drawNoData(f, plot); return; }

  // Two y axes: usage on the left, AHI on the right.
  const usageMax = niceMax(Math.max(...rows.map(r => r.averageUsageHours ?? 0)));
  const ahiMax   = niceMax(Math.max(...rows.map(r => r.averageAhi ?? 0)) * 1.1);

  const doc = f.doc;
  // gridlines using usage scale
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted);
  const yTicks = ticks(usageMax, 4);
  for (const t of yTicks) {
    const y = plot.y + plot.h - (t / usageMax) * plot.h;
    doc.lineWidth(0.5).strokeColor(PALETTE.borderSoft)
       .moveTo(plot.x, y).lineTo(plot.x + plot.w, y).stroke();
    doc.fillColor(PALETTE.inkMuted).text(`${t}h`, plot.x - 28, y - 4, { width: 26, align: "right" });
  }
  // AHI ticks on the right
  for (const t of ticks(ahiMax, 4)) {
    const y = plot.y + plot.h - (t / ahiMax) * plot.h;
    doc.fillColor(PALETTE.discuss).text(t.toFixed(1), plot.x + plot.w + 4, y - 4, { width: 22 });
  }
  // axis lines
  doc.lineWidth(0.5).strokeColor(PALETTE.border)
     .moveTo(plot.x, plot.y).lineTo(plot.x, plot.y + plot.h).stroke()
     .moveTo(plot.x, plot.y + plot.h).lineTo(plot.x + plot.w, plot.y + plot.h).stroke();

  // Bars: usage primary colour, ahi peach. Side-by-side per weekday.
  const slotW = plot.w / rows.length;
  const barW = (slotW - 8) / 2;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const slotX = plot.x + i * slotW + 4;

    if (r.averageUsageHours !== null) {
      const py = plot.y + plot.h - (r.averageUsageHours / usageMax) * plot.h;
      doc.fillColor(PALETTE.primary).rect(slotX, py, barW, plot.y + plot.h - py).fill();
    }
    if (r.averageAhi !== null) {
      const py = plot.y + plot.h - (r.averageAhi / ahiMax) * plot.h;
      doc.fillColor(PALETTE.peach).rect(slotX + barW + 2, py, barW, plot.y + plot.h - py).fill();
    }
    // weekday label
    doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
       .text(r.label, slotX, plot.y + plot.h + 4, { width: slotW - 4, align: "center" });
  }

  // Legend
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted);
  doc.fillColor(PALETTE.primary).rect(plot.x, f.y + f.height - 8, 8, 4).fill();
  doc.fillColor(PALETTE.inkMuted).text("Usage (h)", plot.x + 12, f.y + f.height - 10);
  doc.fillColor(PALETTE.peach).rect(plot.x + 70, f.y + f.height - 8, 8, 4).fill();
  doc.fillColor(PALETTE.inkMuted).text("AHI", plot.x + 82, f.y + f.height - 10);
}

// ---- heat calendar ------------------------------------------------------

export function drawHeatCalendar(f: Frame, cells: HeatCell[]) {
  const used = drawTitle(f, "Nightly usage calendar", "Each square is one night. Darker = more hours.");
  const top = f.y + used + 4;
  const doc = f.doc;
  if (!cells.length) {
    drawNoData(f, { x: f.x, y: top, w: f.width, h: f.height - used - 4 });
    return;
  }

  const weekCount = Math.max(...cells.map(c => c.weekIndex)) + 1;
  // size cells to fit width
  const labelCol = 14;
  const gap = 2;
  const cellSize = Math.max(6, Math.min(11,
    Math.floor((f.width - labelCol - gap * (weekCount + 1)) / weekCount)
  ));
  const totalH = 7 * cellSize + 6 * gap;

  // weekday labels on the left
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkFaint);
  const days = ["M","T","W","T","F","S","S"];
  for (let d = 0; d < 7; d++) {
    doc.text(days[d], f.x, top + d * (cellSize + gap) + cellSize / 2 - 4, { width: 8, align: "right" });
  }

  // grid
  const gridX = f.x + labelCol;
  for (const c of cells) {
    const cx = gridX + c.weekIndex * (cellSize + gap);
    const cy = top + c.weekday * (cellSize + gap);
    doc.fillColor(colourForUsage(c.usageHours)).rect(cx, cy, cellSize, cellSize).fill();
  }

  // legend
  const legY = top + totalH + 8;
  const legPalette = [
    [null,    "Less"],
    [0.5,    ""],
    [3,      ""],
    [5,      ""],
    [7,      ""],
    [10,     "More"],
  ] as const;
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted)
     .text("Less", gridX, legY, { continued: false });
  for (let i = 1; i < legPalette.length - 1; i++) {
    doc.fillColor(colourForUsage(legPalette[i][0] as number))
       .rect(gridX + 24 + (i - 1) * 12, legY, 8, 8).fill();
  }
  doc.fillColor(PALETTE.inkMuted).text("More", gridX + 24 + 5 * 12 + 12, legY);
}

function colourForUsage(hours: number | null): string {
  if (hours === null || hours === undefined) return PALETTE.borderSoft;
  if (hours <= 0) return "#E7DEC8";
  if (hours < 2)  return "#D9E5DD";
  if (hours < 4)  return "#A5BEAA";
  if (hours < 6)  return "#6FAF9A";
  if (hours < 8)  return "#3A7C6E";
  return "#244F4B";
}

// ---- composition bar ----------------------------------------------------

export function drawComposition(f: Frame, c: EventComposition) {
  const used = drawTitle(f, "Event composition", "Share of scored events by type, across the period.");
  const top = f.y + used + 4;
  const doc = f.doc;
  const total = (c.obstructivePct ?? 0) + (c.centralPct ?? 0) + (c.hypopneaPct ?? 0) + (c.reraPct ?? 0);

  if (total <= 0) {
    drawNoData(f, { x: f.x, y: top, w: f.width, h: f.height - used - 4 });
    return;
  }

  const barH = 14;
  let cursor = f.x;
  const pieces: [number, string, string][] = [
    [c.obstructivePct ?? 0, PALETTE.peach,   `Obstructive ${pctText(c.obstructivePct)}`],
    [c.hypopneaPct   ?? 0, PALETTE.warning, `Hypopnoea ${pctText(c.hypopneaPct)}`],
    [c.centralPct    ?? 0, PALETTE.accent,  `Central ${pctText(c.centralPct)}`],
    [c.reraPct       ?? 0, "#BCA8C8",       `RERA ${pctText(c.reraPct)}`],
  ];
  for (const [pct, colour] of pieces) {
    const w = (pct / total) * f.width;
    doc.fillColor(colour).rect(cursor, top, w, barH).fill();
    cursor += w;
  }

  // Legend
  doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted);
  let lx = f.x;
  const ly = top + barH + 8;
  for (const [, colour, label] of pieces) {
    doc.fillColor(colour).rect(lx, ly + 2, 7, 7).fill();
    doc.fillColor(PALETTE.inkMuted).text(label, lx + 11, ly, { width: 110, lineBreak: false });
    lx += 120;
  }

  if (c.dominant) {
    doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
       .text(c.dominant === "mixed"
              ? "No single event type dominated."
              : `Most events were ${c.dominant}. Informational only — your clinician interprets the mix in context.`,
            f.x, ly + 22, { width: f.width });
  }
}

function pctText(n: number | null): string {
  if (n === null) return "—";
  return `${n}%`;
}
