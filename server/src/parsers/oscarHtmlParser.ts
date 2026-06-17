// OSCAR HTML analysis report parser.
//
// Some users land on this site with an HTML report (e.g. CPAP_Analysis.html)
// that someone has produced from their machine's SD card — a single self-
// contained file with one big embedded JSON blob driving the charts.
//
// The blob looks like:
//   const D = {"dates":[...], "ahi":[...], "hours":[...], "oa":[...],
//              "hyp":[...], "ca":[...], "leaks":[...],
//              "epap95":[...], "ipap95":[...]};
//
// The arrays are aligned by index. OA/HYP/CA are raw event *counts* per
// session, not indices — to match the rest of our schema we convert them
// to per-hour indices using `hours`.
//
// Multiple sessions can share a date (a nap + an overnight session). We
// merge same-date rows by summing event counts and usage, then deriving
// the AHI. Pressure is averaged.

import fs from "fs";
import path from "path";
import { CpapParser, NightSummary, ParseResult } from "./types";

interface RawData {
  dates: string[];
  ahi?: number[];
  hours?: number[];
  oa?: number[];
  hyp?: number[];
  ca?: number[];
  leaks?: number[];
  epap95?: number[];
  ipap95?: number[];
}

// Locate `const D = { ... };` and JSON.parse the object literal.
function extractDataBlob(html: string): RawData | null {
  // The blob is a strict JSON object (double-quoted keys), so we can grab
  // everything between the first `{` after `const D =` and the matching `}`.
  const idx = html.indexOf("const D");
  if (idx === -1) return null;
  const eq = html.indexOf("=", idx);
  if (eq === -1) return null;
  const start = html.indexOf("{", eq);
  if (start === -1) return null;

  // Walk braces while respecting strings.
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  const slice = html.slice(start, end + 1);
  try {
    return JSON.parse(slice) as RawData;
  } catch {
    return null;
  }
}

function isLikelyAnalysisHtml(file: string): boolean {
  const lower = file.toLowerCase();
  if (!lower.endsWith(".html") && !lower.endsWith(".htm")) return false;
  // Cheap check: peek at the first 4 KB for the data blob marker. We don't
  // want to read 50 MB of HTML on every detect() call.
  try {
    const fd = fs.openSync(file, "r");
    try {
      const buf = Buffer.alloc(8192);
      const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
      const head = buf.slice(0, bytes).toString("utf8").toLowerCase();
      if (head.includes("const d") || head.includes("cpap analysis")) return true;
    } finally { fs.closeSync(fd); }
    // The blob may be deep in the file — fall back to scanning the whole
    // file once we've confirmed extension. Cheap enough for a single file.
    const full = fs.readFileSync(file, "utf8");
    return /const\s+D\s*=\s*\{[\s\S]*"dates"\s*:/.test(full);
  } catch {
    return false;
  }
}

function safe(arr: number[] | undefined, i: number): number | null {
  if (!arr || i >= arr.length) return null;
  const v = arr[i];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export const oscarHtmlParser: CpapParser = {
  name: "oscar-html",

  detect(_rootDir, allFiles) {
    return allFiles.some(isLikelyAnalysisHtml);
  },

  async parse(_rootDir, allFiles) {
    const candidates = allFiles.filter(isLikelyAnalysisHtml);
    const merged = new Map<string, NightSummary & {
      _hourSum: number;
      _oaCount: number;
      _hypCount: number;
      _caCount: number;
      _leakSum: number;
      _leakN: number;
      _ipapSum: number;
      _ipapN: number;
    }>();

    let parsedFiles = 0;
    for (const file of candidates) {
      let html: string;
      try {
        html = fs.readFileSync(file, "utf8");
      } catch { continue; }
      const data = extractDataBlob(html);
      if (!data || !Array.isArray(data.dates)) continue;
      parsedFiles++;

      for (let i = 0; i < data.dates.length; i++) {
        const date = data.dates[i];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

        const hours = safe(data.hours, i) ?? 0;
        const oa = safe(data.oa, i) ?? 0;
        const hyp = safe(data.hyp, i) ?? 0;
        const ca = safe(data.ca, i) ?? 0;
        const leak = safe(data.leaks, i);
        const ipap = safe(data.ipap95, i);

        const acc = merged.get(date) ?? {
          date,
          _hourSum: 0,
          _oaCount: 0,
          _hypCount: 0,
          _caCount: 0,
          _leakSum: 0,
          _leakN: 0,
          _ipapSum: 0,
          _ipapN: 0,
        };
        acc._hourSum += hours;
        acc._oaCount += oa;
        acc._hypCount += hyp;
        acc._caCount += ca;
        if (leak !== null) { acc._leakSum += leak; acc._leakN += 1; }
        if (ipap !== null) { acc._ipapSum += ipap; acc._ipapN += 1; }
        merged.set(date, acc);
      }
    }

    const nights: NightSummary[] = [];
    for (const acc of merged.values()) {
      const hours = acc._hourSum;
      const events = acc._oaCount + acc._hypCount + acc._caCount;
      const ahi = hours > 0 ? events / hours : null;
      nights.push({
        date: acc.date,
        usageMinutes: hours > 0 ? hours * 60 : null,
        ahi: ahi !== null ? Math.round(ahi * 100) / 100 : null,
        obstructiveIndex: hours > 0 ? Math.round((acc._oaCount / hours) * 100) / 100 : null,
        hypopneaIndex: hours > 0 ? Math.round((acc._hypCount / hours) * 100) / 100 : null,
        centralIndex: hours > 0 ? Math.round((acc._caCount / hours) * 100) / 100 : null,
        leakMedian: acc._leakN > 0 ? Math.round((acc._leakSum / acc._leakN) * 10) / 10 : null,
        pressure95: acc._ipapN > 0 ? Math.round((acc._ipapSum / acc._ipapN) * 10) / 10 : null,
      });
    }

    nights.sort((a, b) => a.date.localeCompare(b.date));

    return {
      nights,
      parserName: "oscar-html",
      message: nights.length
        ? `Parsed ${nights.length} nights from ${parsedFiles} OSCAR HTML report(s).`
        : "OSCAR HTML report was detected but no usable rows were found.",
    };
  },
};
