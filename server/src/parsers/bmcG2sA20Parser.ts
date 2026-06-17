// BMC RESmart G2S A20 — full binary parser.
//
// Reference: BMC_G2S_A20_File_Format.md (provided by Keith). The format is
// proprietary and undocumented by the vendor — the structure encoded here
// was reverse-engineered from a real machine. The doc is the source of
// truth; this file is the TypeScript translation.
//
// Three input files share the machine's serial prefix (`BEB*`):
//   - <prefix>.idx   — fixed-size session index records (512 bytes each)
//   - <prefix>.evt   — fixed-size event records (32 bytes each), grouped by session
//   - <prefix>.000…  — 16 MB waveform files; each 256-byte chunk = 1 second of recording
//
// Each waveform chunk has four interleaved channels in the sample region:
//   - Block A (0x10–0x3F): Mask leak    (24 uint16 LE, divide by 10  → L/min)
//   - Block B (0x40–0x6F): Mask pressure (24 uint16 LE, divide by 40  → cmH2O)
//   - Block C (0x70–0x9F): Flow rate    (not extracted; raw oscillation)
//   - Block D (0xA0–0xB7): Derived/secondary (not extracted; spec uncertain)
//
// Important: the FILE EXTENSIONS LOOK IDENTICAL to Löwenstein Prisma SD cards.
// Confirm the machine by reading ASCII strings from the .USR file and looking
// for the "G2S A20" / "service.paplink.com" markers BEFORE parsing — otherwise
// you'll happily decode garbage from a totally different format.

import fs from "fs";
import path from "path";
import { CpapParser, NightSummary, ParseResult } from "./types";

// ─── constants ────────────────────────────────────────────────────────────
const HEADER_OFFSET   = 0x800;   // skip the leading header padding
const IDX_RECORD_SIZE = 512;
const EVT_RECORD_SIZE = 32;
const CHUNK_SIZE      = 256;     // bytes per 1 second of waveform
const TIMESTAMP_OFFSET = 0xF8;   // YY YY MM DD HH MM SS FC inside each chunk
const SYNC = 0xAA;               // sync byte for every record/chunk

// Waveform channel offsets within each 256-byte chunk. 24 uint16 LE samples
// per channel — channel identity is positional (the spec doc inferred it
// from each block's statistical behaviour over a real session).
const LEAK_BLOCK_OFFSET     = 0x10;  // Block A
const PRESSURE_BLOCK_OFFSET = 0x40;  // Block B
const SAMPLES_PER_BLOCK     = 24;
const LEAK_SCALE     = 10;   // raw / 10 = L/min
const PRESSURE_SCALE = 40;   // raw / 40 = cmH2O

// Event-type codes inside the .evt file. Only types 2 and 3 count toward
// AHI; types 4 and 5 are aggregation windows (snore / flow-limit) and types
// 7 / 8 are cumulative-usage / session-end markers. Including the
// non-event types inflates AHI by ~20-30×.
const EVT_TYPE_APNEA    = 2;
const EVT_TYPE_HYPOPNEA = 3;

// Gap (in seconds) used to split sorted chunk timestamps into discrete
// "mask-on" sessions. The doc's recommendation is 5 minutes.
const CHUNK_SESSION_GAP_SECONDS = 300;

// Drop reconstructed sessions shorter than this — almost always test pulses
// when the user plugs the machine in to check that it works.
const MIN_SESSION_SECONDS = 60;

// Tolerance applied when matching an .idx session entry to chunk-based
// sessions: the chunk session's start may be skewed slightly from the .idx
// record's recorded start time.
const IDX_SKEW_MINUTES = 30;

// Below this duration we don't compute an AHI — denominator is too small
// to be meaningful and would otherwise produce huge nonsense values.
const MIN_AHI_HOURS = 0.25;

// Sanity bounds for decoded waveform samples. Anything outside these is
// almost certainly junk (header bytes that happened to look like samples,
// or a corrupt chunk). Reject silently rather than poisoning percentiles.
const LEAK_MIN_LPM     = 0;
const LEAK_MAX_LPM     = 200;
const PRESSURE_MIN_CM  = 0;
const PRESSURE_MAX_CM  = 30;

// ─── types ────────────────────────────────────────────────────────────────
interface IdxSession {
  sessionId: number;
  /** Local-clock start time recorded by the machine. Treated as UTC for
   *  arithmetic stability; we never translate to a real timezone. */
  startEpoch: number;
}

/** One decoded chunk: 1 second of recording. */
interface ChunkSample {
  epoch: number;
  leak: number;     // L/min (mean of 24 raw samples / 10)
  pressure: number; // cmH2O (mean of 24 raw samples / 40)
}

interface ChunkSession {
  start: number;
  end: number;
  hours: number;
  /** Per-second samples that fell into this chunk session. Used downstream
   *  for leak / pressure percentile rollups. */
  samples: ChunkSample[];
}

interface EventCounts { apneas: number; hypopneas: number; }

// ─── detection ────────────────────────────────────────────────────────────

function findUsrFile(allFiles: string[]): string | undefined {
  // Ignore macOS resource forks (._*) — they have a .USR extension but no
  // useful content.
  return allFiles.find(f =>
    /\.USR$/i.test(f) && !path.basename(f).startsWith("._")
  );
}

function isBmcG2SA20(usrPath: string): boolean {
  try {
    // The USR file is small (~1 MB). Reading the whole thing and grepping
    // for the marker strings is straightforward and only happens during
    // detect() / parse() — not in a hot loop.
    const buf = fs.readFileSync(usrPath);
    // toString("latin1") is safe for arbitrary bytes and keeps ASCII text
    // intact. "ascii" would mangle bytes > 0x7F.
    const text = buf.toString("latin1");
    return text.includes("G2S A20") || text.includes("service.paplink.com");
  } catch {
    return false;
  }
}

function findCompanionFiles(usrPath: string, allFiles: string[]): {
  serialPrefix: string;
  idxPath?: string;
  evtPath?: string;
  numberedFiles: string[];
} {
  const serialPrefix = path.basename(usrPath).replace(/\.USR$/i, "");
  const dir = path.dirname(usrPath);
  const same = (file: string) => path.dirname(file) === dir;
  const numberedRe = new RegExp(
    `^${serialPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.\\d{3}$`
  );

  return {
    serialPrefix,
    idxPath: allFiles.find(f => same(f) && path.basename(f) === `${serialPrefix}.idx`),
    evtPath: allFiles.find(f => same(f) && path.basename(f) === `${serialPrefix}.evt`),
    numberedFiles: allFiles
      .filter(f => same(f) && numberedRe.test(path.basename(f)))
      .sort(),
  };
}

// ─── readers ──────────────────────────────────────────────────────────────

function readIdx(idxPath: string): IdxSession[] {
  const buf = fs.readFileSync(idxPath);
  const sessions: IdxSession[] = [];
  for (let off = HEADER_OFFSET; off + 32 <= buf.length; off += IDX_RECORD_SIZE) {
    // The session-record block ends at the first non-`0xAA 0xAA` sync.
    if (buf[off] !== SYNC || buf[off + 1] !== SYNC) break;
    const sessionId = buf[off + 2];
    const year   = 2000 + buf[off + 4];
    const month  = buf[off + 5];
    const day    = buf[off + 6];
    const hour   = buf[off + 8];
    const minute = buf[off + 9];
    if (year < 2020 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31 ||
        hour > 23 || minute > 59) {
      // Malformed record — stop rather than guess. Bail and return what we
      // have so far.
      break;
    }
    sessions.push({
      sessionId,
      startEpoch: Date.UTC(year, month - 1, day, hour, minute, 0) / 1000,
    });
  }
  return sessions;
}

function readEvents(evtPath: string): Map<number, EventCounts> {
  const buf = fs.readFileSync(evtPath);
  const counts = new Map<number, EventCounts>();
  for (let off = HEADER_OFFSET; off + EVT_RECORD_SIZE <= buf.length; off += EVT_RECORD_SIZE) {
    if (buf[off] !== SYNC || buf[off + 1] !== SYNC) continue;
    const sid = buf[off + 2];
    const typ = buf[off + 4];
    if (typ !== EVT_TYPE_APNEA && typ !== EVT_TYPE_HYPOPNEA) continue;
    const c = counts.get(sid) ?? { apneas: 0, hypopneas: 0 };
    if (typ === EVT_TYPE_APNEA) c.apneas++;
    else                        c.hypopneas++;
    counts.set(sid, c);
  }
  return counts;
}

/**
 * Walk every waveform chunk in every numbered file, extracting the
 * timestamp + the mean of Block A (leak) and Block B (pressure).
 *
 * Memory: we keep one ~16 MB file buffer at a time and emit a small
 * ChunkSample object per second of recording. ~1.5 M samples × ~80 bytes
 * each = ~120 MB worst case for ~3 months of data. If that becomes a
 * problem we'd switch to streaming + per-session percentile accumulation,
 * but at current scales it's fine and keeps the math straightforward.
 */
function readChunkSamples(numberedFiles: string[]): ChunkSample[] {
  const out: ChunkSample[] = [];
  for (const filePath of numberedFiles) {
    let buf: Buffer;
    try { buf = fs.readFileSync(filePath); } catch { continue; }
    for (let off = 0; off + CHUNK_SIZE <= buf.length; off += CHUNK_SIZE) {
      if (buf[off] !== SYNC || buf[off + 1] !== SYNC) continue;

      // ── timestamp ─────────────────────────────────────────────────────
      const t = off + TIMESTAMP_OFFSET;
      const year   = buf.readUInt16LE(t);
      const month  = buf[t + 2];
      const day    = buf[t + 3];
      const hour   = buf[t + 4];
      const minute = buf[t + 5];
      const second = buf[t + 6];
      if (year < 2020 || year > 2099) continue;
      if (month < 1 || month > 12)    continue;
      if (day < 1 || day > 31)        continue;
      if (hour > 23 || minute > 59 || second > 59) continue;
      const epoch = Date.UTC(year, month - 1, day, hour, minute, second) / 1000;

      // ── Block A: leak ─────────────────────────────────────────────────
      // 24 uint16 LE samples / 10 → L/min. Mean across the second.
      let leakSum = 0;
      for (let i = 0; i < SAMPLES_PER_BLOCK; i++) {
        leakSum += buf.readUInt16LE(off + LEAK_BLOCK_OFFSET + 2 * i);
      }
      const leak = leakSum / SAMPLES_PER_BLOCK / LEAK_SCALE;
      if (leak < LEAK_MIN_LPM || leak > LEAK_MAX_LPM) continue;

      // ── Block B: pressure ─────────────────────────────────────────────
      // 24 uint16 LE samples / 40 → cmH2O. Mean across the second.
      let pressureSum = 0;
      for (let i = 0; i < SAMPLES_PER_BLOCK; i++) {
        pressureSum += buf.readUInt16LE(off + PRESSURE_BLOCK_OFFSET + 2 * i);
      }
      const pressure = pressureSum / SAMPLES_PER_BLOCK / PRESSURE_SCALE;
      if (pressure < PRESSURE_MIN_CM || pressure > PRESSURE_MAX_CM) continue;

      out.push({ epoch, leak, pressure });
    }
  }
  out.sort((a, b) => a.epoch - b.epoch);
  return out;
}

function groupChunkSessions(samples: ChunkSample[]): ChunkSession[] {
  if (!samples.length) return [];
  const sessions: ChunkSession[] = [];
  let start = samples[0].epoch;
  let end   = samples[0].epoch;
  let bucket: ChunkSample[] = [samples[0]];

  for (let i = 1; i < samples.length; i++) {
    const s = samples[i];
    if (s.epoch - end > CHUNK_SESSION_GAP_SECONDS) {
      sessions.push({
        start, end, hours: (end - start) / 3600, samples: bucket,
      });
      start = s.epoch;
      bucket = [];
    }
    end = s.epoch;
    bucket.push(s);
  }
  sessions.push({ start, end, hours: (end - start) / 3600, samples: bucket });
  // Drop sessions under MIN_SESSION_SECONDS — usually test pulses.
  return sessions.filter(s => (s.end - s.start) >= MIN_SESSION_SECONDS);
}

// ─── percentiles ──────────────────────────────────────────────────────────

/** Compute a sorted-array percentile in-place (caller has already sorted). */
function percentileSorted(sortedAsc: number[], p: number): number | null {
  if (!sortedAsc.length) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx];
}

// ─── per-night aggregation ────────────────────────────────────────────────

/** "Sleep night" date: sessions starting before noon (local-clock) get
 *  attributed to the previous calendar day, so a 23:00–07:00 sleep window
 *  stays attached to a single night date. Standard CPAP convention. */
function nightDateFromEpoch(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  if (d.getUTCHours() < 12) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// ─── parser ───────────────────────────────────────────────────────────────

export const bmcG2sA20Parser: CpapParser = {
  name: "bmc-g2s-a20",

  detect(_rootDir, allFiles) {
    const usr = findUsrFile(allFiles);
    if (!usr) return false;
    return isBmcG2SA20(usr);
  },

  async parse(_rootDir, allFiles): Promise<ParseResult> {
    const usrPath = findUsrFile(allFiles)!;
    const { idxPath, evtPath, numberedFiles } = findCompanionFiles(usrPath, allFiles);

    if (!idxPath || !evtPath || numberedFiles.length === 0) {
      return {
        nights: [],
        parserName: "bmc-g2s-a20",
        message:
          "BMC RESmart G2S A20 detected, but the expected companion files " +
          "(.idx / .evt / numbered waveforms) were missing from the upload. " +
          "Make sure you zip the whole SD card folder.",
      };
    }

    // 1. Session index, sorted by recorded start.
    const idxSessions = readIdx(idxPath).sort((a, b) => a.startEpoch - b.startEpoch);

    // 2. Event counts keyed by session ID.
    const eventCounts = readEvents(evtPath);

    // 3. Walk every waveform chunk once, extracting timestamp + leak + pressure
    //    and grouping into mask-on chunk sessions.
    const chunkSessions = groupChunkSessions(readChunkSamples(numberedFiles));

    // 4. Match each idx session to chunk sessions falling between its
    //    start and the next idx session's start (with a 30-minute skew
    //    tolerance applied at both ends). Per-session leak/pressure samples
    //    come along for the ride.
    interface SessionResult {
      sessionId: number;
      startEpoch: number;
      hours: number;
      apneas: number;
      hypopneas: number;
      leakSamples: number[];
      pressureSamples: number[];
    }
    const skewSeconds = IDX_SKEW_MINUTES * 60;
    const farFuture = Date.UTC(2099, 0, 1) / 1000;
    const perSession: SessionResult[] = idxSessions.map((ix, i) => {
      const next = i + 1 < idxSessions.length ? idxSessions[i + 1].startEpoch : farFuture;
      const lo = ix.startEpoch - skewSeconds;
      const hi = next - skewSeconds;
      const bounded = chunkSessions.filter(c => c.start >= lo && c.start < hi);
      const hours = bounded.reduce((a, b) => a + b.hours, 0);
      const startEpoch = bounded.length ? bounded[0].start : ix.startEpoch;
      const ev = eventCounts.get(ix.sessionId) ?? { apneas: 0, hypopneas: 0 };
      const leakSamples: number[] = [];
      const pressureSamples: number[] = [];
      for (const cs of bounded) {
        for (const s of cs.samples) {
          leakSamples.push(s.leak);
          pressureSamples.push(s.pressure);
        }
      }
      return { sessionId: ix.sessionId, startEpoch, hours, ...ev, leakSamples, pressureSamples };
    });

    // 5. Roll up sessions into calendar nights. Leak / pressure samples
    //    are concatenated rather than averaged so the per-night percentile
    //    is the true percentile across that night's samples, not an
    //    approximation from per-session stats.
    interface NightAccum {
      date: string;
      usageHours: number;
      apneas: number;
      hypopneas: number;
      leakSamples: number[];
      pressureSamples: number[];
    }
    const byNight = new Map<string, NightAccum>();
    for (const s of perSession) {
      const date = nightDateFromEpoch(s.startEpoch);
      const cur = byNight.get(date) ?? {
        date, usageHours: 0, apneas: 0, hypopneas: 0,
        leakSamples: [], pressureSamples: [],
      };
      cur.usageHours += s.hours;
      cur.apneas     += s.apneas;
      cur.hypopneas  += s.hypopneas;
      // push() is faster than concat() for large arrays — avoids a fresh
      // allocation per session.
      for (const v of s.leakSamples)     cur.leakSamples.push(v);
      for (const v of s.pressureSamples) cur.pressureSamples.push(v);
      byNight.set(date, cur);
    }

    const nights: NightSummary[] = Array.from(byNight.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(n => {
        const totalEvents = n.apneas + n.hypopneas;
        const reliable = n.usageHours > MIN_AHI_HOURS;

        // Compute percentiles for the night by sorting once.
        n.leakSamples.sort((a, b) => a - b);
        n.pressureSamples.sort((a, b) => a - b);
        const leakMedian = percentileSorted(n.leakSamples, 0.5);
        const leak95     = percentileSorted(n.leakSamples, 0.95);
        const pressureMedian = percentileSorted(n.pressureSamples, 0.5);
        const pressure95     = percentileSorted(n.pressureSamples, 0.95);

        return {
          date: n.date,
          usageMinutes: round(n.usageHours * 60, 0),
          ahi:               reliable ? round(totalEvents / n.usageHours) : null,
          obstructiveIndex:  reliable ? round(n.apneas    / n.usageHours) : null,
          hypopneaIndex:     reliable ? round(n.hypopneas / n.usageHours) : null,
          // BMC G2S A20 doesn't distinguish central apnoeas or RERAs in
          // the .evt stream — type 2 maps to "apnea" without OA/CA split.
          centralIndex: null,
          reraIndex: null,
          leakMedian: leakMedian !== null ? round(leakMedian, 1) : null,
          leak95:     leak95     !== null ? round(leak95,     1) : null,
          pressureMedian: pressureMedian !== null ? round(pressureMedian, 1) : null,
          pressure95:     pressure95     !== null ? round(pressure95,     1) : null,
        };
      });

    const totalApneas = perSession.reduce((a, b) => a + b.apneas, 0);
    const totalHyp    = perSession.reduce((a, b) => a + b.hypopneas, 0);
    const totalHours  = perSession.reduce((a, b) => a + b.hours, 0);

    return {
      nights,
      parserName: "bmc-g2s-a20",
      message:
        `Parsed ${nights.length} night(s) from a BMC RESmart G2S A20 ` +
        `(${perSession.length} sessions, ${round(totalHours, 1)} hours of use, ` +
        `${totalApneas} apneas + ${totalHyp} hypopnoeas).`,
    };
  },
};
