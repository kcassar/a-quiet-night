// CSV + PDF exporters for the CPAP dashboard.
//
// The PDF is laid out across five focused pages:
//   1. Cover summary       — headline metrics + things to discuss
//   2. AHI + Usage trends  — the two most important trend charts
//   3. Leak + Pressure     — supporting trend charts
//   4. Distribution        — AHI histogram, day-of-week, event composition
//   5. Heat calendar + per-night detail
//
// Charts are vector-rendered directly with pdfkit primitives — see
// chartRenderers.ts. No node-canvas, no chart library, no rasterisation.

import type { Response } from "express";
import PDFDocument from "pdfkit";
import type { NightRow, TherapySummary } from "./analysis";
import {
  PALETTE,
  drawLineChart,
  drawBarChart,
  drawHistogram,
  drawDayOfWeek,
  drawHeatCalendar,
  drawComposition,
  Frame,
} from "./chartRenderers";

const DISCLAIMER =
  "This report is educational only. It does not diagnose, prescribe, or " +
  "recommend any therapy change. Please discuss any changes to pressure, " +
  "mask type, or treatment with a qualified sleep clinician.";

// ─── CSV ────────────────────────────────────────────────────────────────

const CSV_COLUMNS: { key: keyof NightRow; header: string }[] = [
  { key: "date", header: "Date" },
  { key: "usage_minutes", header: "Usage (minutes)" },
  { key: "ahi", header: "AHI" },
  { key: "obstructive_index", header: "Obstructive Index" },
  { key: "central_index", header: "Central Index" },
  { key: "hypopnea_index", header: "Hypopnoea Index" },
  { key: "rera_index", header: "RERA Index" },
  { key: "leak_median", header: "Leak (median, L/min)" },
  { key: "leak_95", header: "Leak (95%, L/min)" },
  { key: "pressure_median", header: "Pressure (median, cmH2O)" },
  { key: "pressure_95", header: "Pressure (95%, cmH2O)" },
];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportNightsToCsv(nights: NightRow[]): string {
  const lines: string[] = [];
  lines.push(CSV_COLUMNS.map(c => csvEscape(c.header)).join(","));
  for (const n of nights) {
    lines.push(CSV_COLUMNS.map(c => csvEscape(n[c.key])).join(","));
  }
  lines.push("");
  lines.push(`# ${DISCLAIMER}`);
  return lines.join("\n");
}

// ─── PDF ────────────────────────────────────────────────────────────────

export interface PdfPayload {
  uploadId: string;
  originalFilename: string;
  parserUsed: string | null;
  summary: TherapySummary;
  nights: NightRow[];
}

const A4 = { width: 595.28, height: 841.89 } as const;
const M = 40; // page margin
const CONTENT_W = A4.width - M * 2;

export function streamSummaryPdf(res: Response, payload: PdfPayload): void {
  // We do all positioning manually, so we ask pdfkit to use a margin of 0
  // (otherwise it auto-paginates when we draw the footer below the default
  // bottom margin).
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
  doc.pipe(res);

  // We add pages manually so each section starts cleanly.
  newPage(doc, 1, payload);
  drawCover(doc, payload);

  newPage(doc, 2, payload);
  drawTrendsAhiUsage(doc, payload);

  newPage(doc, 3, payload);
  drawTrendsLeakPressure(doc, payload);

  newPage(doc, 4, payload);
  drawDistribution(doc, payload);

  newPage(doc, 5, payload);
  drawCalendarAndDetail(doc, payload);

  doc.end();
}

// ─── page chrome ────────────────────────────────────────────────────────

function newPage(doc: PDFKit.PDFDocument, pageNumber: number, p: PdfPayload) {
  doc.addPage({ size: "A4", margin: 0 });
  drawHeaderBand(doc, p);
  drawFooter(doc, pageNumber, p);
}

function drawHeaderBand(doc: PDFKit.PDFDocument, p: PdfPayload) {
  // Brand line at the very top.
  doc.save();
  doc.fillColor(PALETTE.primary).rect(0, 0, A4.width, 4).fill();
  doc.restore();

  // Wordmark + run metadata. Kept tight and editorial.
  doc.font("Helvetica-Bold").fontSize(11).fillColor(PALETTE.primary)
     .text("A Quiet Night", M, 16);
  doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
     .text(
       `${p.summary.dateRangeStart ?? "—"} to ${p.summary.dateRangeEnd ?? "—"}` +
       `   ·   ${p.summary.totalNights} nights   ·   parser: ${p.parserUsed ?? "n/a"}`,
       M, 30
     );

  // Hairline below.
  doc.lineWidth(0.5).strokeColor(PALETTE.border)
     .moveTo(M, 50).lineTo(A4.width - M, 50).stroke();
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, p: PdfPayload) {
  const y = A4.height - 32;
  doc.lineWidth(0.5).strokeColor(PALETTE.border)
     .moveTo(M, y).lineTo(A4.width - M, y).stroke();
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkFaint)
     .text(DISCLAIMER, M, y + 6, { width: CONTENT_W - 30 });
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted)
     .text(`Page ${pageNumber} of 5`, A4.width - M - 60, y + 6, { width: 60, align: "right" });
  // Suppress unused-arg warning when payload is unused in a footer.
  void p;
}

function sectionTitle(doc: PDFKit.PDFDocument, top: number, eyebrow: string, title: string) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PALETTE.inkMuted)
     .text(eyebrow.toUpperCase(), M, top, { characterSpacing: 1.4 });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(PALETTE.ink)
     .text(title, M, top + 14);
  return top + 14 + 26;
}

// ─── page 1: cover ──────────────────────────────────────────────────────

function drawCover(doc: PDFKit.PDFDocument, p: PdfPayload) {
  const s = p.summary;
  let y = 70;
  y = sectionTitle(doc, y, "Therapy summary", "Headline numbers across the whole period.");

  // Six headline metric cards in a 3 × 2 grid.
  const cardW = (CONTENT_W - 2 * 12) / 3;
  const cardH = 78;
  const metrics: [string, string, string?][] = [
    ["Average AHI",                fmt(s.averageAhi),                 statusForAhi(s.averageAhi)],
    ["Rolling 30-day compliance",  fmt(s.rolling30DayCompliance, "%"), statusForCompliance(s.rolling30DayCompliance)],
    ["Average usage",              fmt(s.averageUsageHours, " h"),     "Per night"],
    ["95th percentile pressure",   fmt(s.pressure95, " cmH2O"),         "Informational"],
    ["Average leak",               fmt(s.averageLeak, " L/min"),       s.averageLeak !== null && s.averageLeak > 24 ? "Worth discussing" : "Stable"],
    ["Total hours on therapy",     fmt(s.totalUsageHours, " h"),       "Cumulative"],
  ];
  for (let i = 0; i < metrics.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * (cardW + 12);
    const cy = y + row * (cardH + 12);
    drawMetricCard(doc, x, cy, cardW, cardH, metrics[i][0], metrics[i][1], metrics[i][2]);
  }
  y += 2 * (cardH + 12) + 6;

  // Best / Worst nights
  const halfW = (CONTENT_W - 12) / 2;
  if (s.bestNight) drawHighlightCard(doc, M, y, halfW, 70, "Best night", s.bestNight, PALETTE.success);
  if (s.worstNight) drawHighlightCard(doc, M + halfW + 12, y, halfW, 70, "Highest-AHI night", s.worstNight, PALETTE.discuss);
  y += 70 + 16;

  // Things to discuss
  if (s.flags.length) {
    doc.font("Helvetica-Bold").fontSize(13).fillColor(PALETTE.ink)
       .text("Things you might discuss with your clinician", M, y);
    y += 20;
    const sorted = [...s.flags].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
    for (const f of sorted.slice(0, 4)) {
      const tone = f.severity === "discuss" ? PALETTE.discuss
                 : f.severity === "watch"   ? PALETTE.warning
                 :                            PALETTE.accent;
      // Coloured marker bar
      doc.fillColor(tone).rect(M, y + 2, 3, 36).fill();
      doc.font("Helvetica-Bold").fontSize(10).fillColor(PALETTE.ink)
         .text(f.title, M + 10, y, { width: CONTENT_W - 10 });
      const detailH = doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
         .heightOfString(f.detail, { width: CONTENT_W - 10 });
      doc.text(f.detail, M + 10, y + 13, { width: CONTENT_W - 10 });
      y += Math.max(40, 13 + detailH + 8);
    }
  }
}

function drawMetricCard(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  label: string, value: string, status?: string,
) {
  doc.lineWidth(0.5).strokeColor(PALETTE.border).fillColor(PALETTE.surface)
     .roundedRect(x, y, w, h, 8).fillAndStroke(PALETTE.surface, PALETTE.border);
  doc.font("Helvetica").fontSize(7).fillColor(PALETTE.inkMuted)
     .text(label.toUpperCase(), x + 12, y + 12, { characterSpacing: 1, width: w - 24 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(PALETTE.ink)
     .text(value, x + 12, y + 26, { width: w - 24 });
  if (status) {
    doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
       .text(status, x + 12, y + h - 18, { width: w - 24 });
  }
}

function drawHighlightCard(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  title: string,
  night: { date: string; ahi: number | null; usageHours: number | null; leak: number | null },
  accent: string,
) {
  doc.lineWidth(0.5).strokeColor(PALETTE.border).fillColor(PALETTE.surface)
     .roundedRect(x, y, w, h, 8).fillAndStroke(PALETTE.surface, PALETTE.border);
  // Accent strip
  doc.fillColor(accent).rect(x, y, 3, h).fill();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PALETTE.inkMuted)
     .text(title.toUpperCase(), x + 12, y + 12, { characterSpacing: 1.2 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(PALETTE.ink)
     .text(night.date, x + 12, y + 26);
  doc.font("Helvetica").fontSize(9).fillColor(PALETTE.inkMuted)
     .text(
       `AHI ${fmtNum(night.ahi)} · Usage ${fmtNum(night.usageHours, "h")} · Leak ${fmtNum(night.leak, " L/min")}`,
       x + 12, y + h - 22, { width: w - 24 }
     );
}

// ─── page 2: AHI + Usage ────────────────────────────────────────────────

function drawTrendsAhiUsage(doc: PDFKit.PDFDocument, p: PdfPayload) {
  const s = p.summary;
  const top = sectionTitle(doc, 70, "Trends over time", "AHI and nightly usage.");

  const ahiSeries = p.nights.map(n => ({ date: n.date, value: n.ahi }));
  const usageSeries = p.nights.map(n => ({
    date: n.date,
    value: typeof n.usage_minutes === "number"
      ? Math.round((n.usage_minutes / 60) * 100) / 100
      : null,
  }));

  // Beginner shade band: first 14 days when beginner mode is auto-detected.
  const shadeBand = s.beginner.isAutoDetectedBeginner && s.dateRangeStart
    ? makeShadeBand(p.nights, s.dateRangeStart, 14, "Settling-in")
    : undefined;

  const ahiFrame: Frame = { doc, x: M, y: top, width: CONTENT_W, height: 240 };
  drawLineChart(ahiFrame, {
    title: "AHI per night",
    subtitle: "Solid: nightly · Dotted reference: AHI 5 · Bold: 7-day rolling average.",
    data: ahiSeries,
    overlay: { name: "7-day avg", data: s.rolling7AhiSeries, colour: PALETTE.ink },
    threshold: { value: 5, label: "AHI 5 (common target)" },
    colour: PALETTE.primary,
    shadeBand,
  });

  const usageFrame: Frame = { doc, x: M, y: top + 260, width: CONTENT_W, height: 240 };
  drawBarChart(usageFrame, {
    title: "Usage hours per night",
    subtitle: "Bars represent the time the machine ran each night.",
    data: usageSeries,
    colour: PALETTE.primary,
    shadeBand,
  });
}

// ─── page 3: leak + pressure ────────────────────────────────────────────

function drawTrendsLeakPressure(doc: PDFKit.PDFDocument, p: PdfPayload) {
  const top = sectionTitle(doc, 70, "Trends over time", "Leak rate and pressure.");

  const leakSeries = p.nights.map(n => ({
    date: n.date,
    value: n.leak_95 ?? n.leak_median,
  }));
  const pressSeries = p.nights.map(n => ({
    date: n.date,
    value: n.pressure_95 ?? n.pressure_median,
  }));

  drawLineChart(
    { doc, x: M, y: top, width: CONTENT_W, height: 240 },
    {
      title: "Leak rate",
      subtitle: "Higher leak rates can affect comfort and effectiveness — informational only.",
      data: leakSeries,
      colour: PALETTE.warning,
    }
  );

  drawLineChart(
    { doc, x: M, y: top + 260, width: CONTENT_W, height: 240 },
    {
      title: "Pressure (95th percentile)",
      subtitle: "What your machine reaches or stays under for 95% of the night.",
      data: pressSeries,
      colour: PALETTE.accent,
    }
  );
}

// ─── page 4: distribution ───────────────────────────────────────────────

function drawDistribution(doc: PDFKit.PDFDocument, p: PdfPayload) {
  const s = p.summary;
  const top = sectionTitle(doc, 70, "Distribution & patterns", "How the data is spread, beyond averages.");

  // Two charts side by side: AHI distribution + day-of-week.
  const halfW = (CONTENT_W - 16) / 2;
  drawHistogram(
    { doc, x: M, y: top, width: halfW, height: 240 },
    "AHI distribution",
    s.ahiDistribution,
  );
  drawDayOfWeek(
    { doc, x: M + halfW + 16, y: top, width: halfW, height: 240 },
    s.dayOfWeek,
  );

  // Composition full-width below.
  drawComposition(
    { doc, x: M, y: top + 260, width: CONTENT_W, height: 100 },
    s.eventComposition,
  );

  // Glossary footnote
  doc.font("Helvetica-Bold").fontSize(9).fillColor(PALETTE.ink)
     .text("Reading these together", M, top + 380);
  doc.font("Helvetica").fontSize(8).fillColor(PALETTE.inkMuted)
     .text(
       "The histogram shows how nights are spread; the day-of-week chart shows whether " +
       "weekends or weekdays look different; the composition bar shows whether your " +
       "events are mostly obstructive, hypopnoeas, central, or RERA. None of these are " +
       "diagnostic on their own — they help frame the conversation with your clinician.",
       M, top + 396, { width: CONTENT_W }
     );
}

// ─── page 5: calendar + per-night table ─────────────────────────────────

function drawCalendarAndDetail(doc: PDFKit.PDFDocument, p: PdfPayload) {
  const s = p.summary;
  const top = sectionTitle(doc, 70, "Calendar & detail", "Every recorded night.");

  drawHeatCalendar(
    { doc, x: M, y: top, width: CONTENT_W, height: 130 },
    s.heatCalendar,
  );

  // Per-night table
  const tableTop = top + 160;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(PALETTE.ink)
     .text("Per-night detail", M, tableTop);

  const headers = ["Date", "Usage (h)", "AHI", "OA", "CA", "Hyp", "Leak 95%", "P95"];
  const widths  = [70,    52,           38,    32,   32,   32,    62,         42];
  const rowH = 14;
  let cy = tableTop + 18;

  // Header row
  doc.font("Helvetica-Bold").fontSize(7).fillColor(PALETTE.inkMuted);
  let cx = M;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i].toUpperCase(), cx, cy, { width: widths[i], characterSpacing: 0.8 });
    cx += widths[i];
  }
  cy += 12;
  doc.lineWidth(0.5).strokeColor(PALETTE.border)
     .moveTo(M, cy).lineTo(M + widths.reduce((a, b) => a + b, 0), cy).stroke();
  cy += 4;

  // Body rows
  doc.font("Helvetica").fontSize(8);
  for (let r = 0; r < p.nights.length; r++) {
    const n = p.nights[r];
    if (cy > A4.height - 50) {
      // Overflow to a new page if there are too many nights.
      doc.addPage({ size: "A4", margin: 0 });
      drawHeaderBand(doc, p);
      drawFooter(doc, 5, p);
      cy = 70;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(PALETTE.inkMuted);
      cx = M;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i].toUpperCase(), cx, cy, { width: widths[i], characterSpacing: 0.8 });
        cx += widths[i];
      }
      cy += 12;
      doc.lineWidth(0.5).strokeColor(PALETTE.border)
         .moveTo(M, cy).lineTo(M + widths.reduce((a, b) => a + b, 0), cy).stroke();
      cy += 4;
      doc.font("Helvetica").fontSize(8);
    }
    if (r % 2 === 0) {
      doc.fillColor("#FAF6EE")
         .rect(M, cy - 2, widths.reduce((a, b) => a + b, 0), rowH).fill();
    }
    cx = M;
    const cells = [
      n.date,
      typeof n.usage_minutes === "number" ? (n.usage_minutes / 60).toFixed(1) : "—",
      typeof n.ahi === "number" ? n.ahi.toFixed(2) : "—",
      typeof n.obstructive_index === "number" ? n.obstructive_index.toFixed(2) : "—",
      typeof n.central_index === "number" ? n.central_index.toFixed(2) : "—",
      typeof n.hypopnea_index === "number" ? n.hypopnea_index.toFixed(2) : "—",
      typeof n.leak_95 === "number" ? n.leak_95.toFixed(1) : (typeof n.leak_median === "number" ? n.leak_median.toFixed(1) : "—"),
      typeof n.pressure_95 === "number" ? n.pressure_95.toFixed(1) : "—",
    ];
    for (let i = 0; i < cells.length; i++) {
      doc.fillColor(PALETTE.ink)
         .text(cells[i], cx + 2, cy, { width: widths[i] - 4 });
      cx += widths[i];
    }
    cy += rowH;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${n}${suffix}`;
}

function fmtNum(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${n}${suffix}`;
}

function statusForAhi(ahi: number | null): string {
  if (ahi === null) return "—";
  if (ahi < 1)  return "Very low";
  if (ahi < 5)  return "Stable";
  if (ahi < 15) return "Worth discussing";
  return "Worth discussing";
}

function statusForCompliance(pct: number | null): string {
  if (pct === null) return "—";
  if (pct >= 70) return "On track";
  if (pct >= 50) return "Building up";
  return "Informational";
}

function severityOrder(s: "info" | "watch" | "discuss"): number {
  return s === "discuss" ? 0 : s === "watch" ? 1 : 2;
}

// Compute index range covering `days` days from `fromDate` within nights[].
function makeShadeBand(
  nights: NightRow[], fromDate: string, days: number, label: string,
): { fromIndex: number; toIndex: number; label: string } | undefined {
  const fromTs = Date.parse(fromDate + "T00:00:00Z");
  const toTs = fromTs + (days - 1) * 86_400_000;
  let from = -1, to = -1;
  for (let i = 0; i < nights.length; i++) {
    const t = Date.parse(nights[i].date + "T00:00:00Z");
    if (from === -1 && t >= fromTs) from = i;
    if (t <= toTs) to = i;
  }
  if (from === -1 || to === -1 || to <= from) return undefined;
  return { fromIndex: from, toIndex: to, label };
}
