// OSCAR CSV parser.
//
// OSCAR (Open Source CPAP Analysis Reporter) lets users export per-night
// summary CSVs. The exact column layout varies by OSCAR version, so this
// parser is intentionally forgiving:
//   - It looks for any CSV with a header row containing recognisable column
//     names (Date, AHI, Hours, Leak, Pressure...).
//   - It maps those columns by best-effort name matching.
//   - Unknown columns are ignored. Missing values become null.
//
// This means we can read both "Daily Details" exports and "Statistics"
// exports without separate code paths.

import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";
import { CpapParser, NightSummary, ParseResult } from "./types";

// Map header names (lowercased, trimmed) to logical fields.
const HEADER_ALIASES: Record<string, keyof NightSummary> = {
  "date": "date",
  "session date": "date",
  "ahi": "ahi",
  "ahi (events/hour)": "ahi",
  "obstructive": "obstructiveIndex",
  "oa index": "obstructiveIndex",
  "central": "centralIndex",
  "ca index": "centralIndex",
  "hypopnea": "hypopneaIndex",
  "h index": "hypopneaIndex",
  "rera": "reraIndex",
  "rera index": "reraIndex",
  "hours": "usageMinutes",
  "usage hours": "usageMinutes",
  "usage (hrs)": "usageMinutes",
  "session length": "usageMinutes",
  "leak median": "leakMedian",
  "median leak": "leakMedian",
  "leak 95%": "leak95",
  "leak (95%)": "leak95",
  "pressure median": "pressureMedian",
  "median pressure": "pressureMedian",
  "pressure 95%": "pressure95",
  "pressure (95%)": "pressure95",
  "95% pressure": "pressure95",
};

function isLikelyOscarCsv(filePath: string): boolean {
  if (!filePath.toLowerCase().endsWith(".csv")) return false;
  try {
    const head = fs.readFileSync(filePath, { encoding: "utf8" }).slice(0, 2000);
    const lower = head.toLowerCase();
    // OSCAR-style summaries always have a date column plus at least one of
    // AHI / hours / leak / pressure.
    const hasDate = lower.includes("date");
    const hasMetric = ["ahi", "hours", "leak", "pressure"].some(k => lower.includes(k));
    return hasDate && hasMetric;
  } catch {
    return false;
  }
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Strip thousands separators and units like "h", "%", "L/min".
  const cleaned = s.replace(/[, ]/g, "").replace(/[a-zA-Z%/]+$/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Convert a "hours" or "HH:MM:SS" duration to minutes.
function parseDurationToMinutes(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const colon = s.split(":");
  if (colon.length === 2 || colon.length === 3) {
    const h = Number(colon[0]);
    const m = Number(colon[1]);
    const sec = colon.length === 3 ? Number(colon[2]) : 0;
    if ([h, m, sec].every(Number.isFinite)) return h * 60 + m + sec / 60;
  }
  const asNumber = parseNumber(s);
  if (asNumber === null) return null;
  // OSCAR usually exports hours; convert.
  return asNumber * 60;
}

function parseDate(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY (we prefer DD/MM/YYYY for en-GB).
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s);
  if (slash) {
    const day = slash[1].padStart(2, "0");
    const month = slash[2].padStart(2, "0");
    const yearRaw = slash[3];
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${year}-${month}-${day}`;
  }
  // Fall back to Date parsing.
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export const oscarCsvParser: CpapParser = {
  name: "oscar-csv",

  detect(_rootDir, allFiles) {
    return allFiles.some(isLikelyOscarCsv);
  },

  async parse(_rootDir, allFiles) {
    const candidates = allFiles.filter(isLikelyOscarCsv);
    const nightsByDate = new Map<string, NightSummary>();

    for (const file of candidates) {
      let rows: Record<string, string>[];
      try {
        const raw = fs.readFileSync(file, "utf8");
        rows = parseCsv(raw, {
          columns: (header: string[]) => header.map(h => h.trim()),
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
        }) as Record<string, string>[];
      } catch {
        continue;
      }

      for (const row of rows) {
        const summary: NightSummary = { date: "" };
        let dateValue: string | null = null;

        for (const [rawKey, rawVal] of Object.entries(row)) {
          const key = (rawKey ?? "").toLowerCase().trim();
          const field = HEADER_ALIASES[key];
          if (!field) continue;

          if (field === "date") {
            dateValue = parseDate(rawVal);
          } else if (field === "usageMinutes") {
            summary.usageMinutes = parseDurationToMinutes(rawVal);
          } else {
            // All remaining fields are numeric.
            (summary as unknown as Record<string, unknown>)[field] = parseNumber(rawVal);
          }
        }

        if (!dateValue) continue;
        summary.date = dateValue;

        // Merge with any existing row for the same date — different OSCAR
        // exports (statistics + daily) may both contribute.
        const existing = nightsByDate.get(dateValue) ?? { date: dateValue };
        nightsByDate.set(dateValue, { ...existing, ...summary });
      }
    }

    const nights = Array.from(nightsByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const result: ParseResult = {
      nights,
      parserName: "oscar-csv",
      message: nights.length
        ? `Parsed ${nights.length} nights from ${candidates.length} OSCAR CSV file(s).`
        : "OSCAR CSV files were detected but no usable rows were found.",
    };
    return result;
  },
};
