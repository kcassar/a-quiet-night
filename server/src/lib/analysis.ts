// Helpers that turn a raw NightSummary[] into the high-level numbers shown
// on the dashboard. Descriptive only — we never produce judgement or
// suggest pressure changes. Wording across this file follows the rule that
// flags use "discuss with your clinician" language; nothing about what
// the user should do.

export interface NightRow {
  date: string;
  usage_minutes: number | null;
  ahi: number | null;
  obstructive_index: number | null;
  central_index: number | null;
  hypopnea_index: number | null;
  rera_index: number | null;
  leak_median: number | null;
  leak_95: number | null;
  pressure_median: number | null;
  pressure_95: number | null;
}

export type FlagSeverity = "info" | "watch" | "discuss";

export interface TherapyFlag {
  id: string;
  severity: FlagSeverity;
  title: string;
  detail: string;
  /** Optional path inside the site where the user can read more on the topic. */
  guideHref?: string;
}

export interface DistributionBucket {
  /** Inclusive lower bound. */
  from: number;
  /** Exclusive upper bound (use null for "and above"). */
  to: number | null;
  label: string;
  count: number;
}

export interface DayOfWeekRow {
  /** 0 = Monday … 6 = Sunday (UK-friendly week start). */
  weekday: number;
  label: string;
  averageAhi: number | null;
  averageUsageHours: number | null;
  count: number;
}

export interface NightHighlight {
  date: string;
  ahi: number | null;
  usageHours: number | null;
  leak: number | null;
}

export interface EventComposition {
  obstructivePct: number | null;
  centralPct: number | null;
  hypopneaPct: number | null;
  reraPct: number | null;
  dominant: "obstructive" | "central" | "hypopnoea" | "rera" | "mixed" | null;
}

export interface RollingPoint {
  date: string;
  value: number | null;
}

export interface HeatCell {
  date: string;
  weekday: number;     // 0 = Monday … 6 = Sunday
  weekIndex: number;   // 0-based week from start of range
  usageHours: number | null;
}

export interface BeginnerMilestone {
  /** Stable id used by the UI to choose copy/icon. */
  id:
    | "first-night"
    | "first-four-hour"
    | "first-ahi-under-five"
    | "first-full-week"
    | "thirty-day-mark";
  achieved: boolean;
  date: string | null;
  description: string;
}

export interface BeginnerInfo {
  /** Auto-detected: looks like the user is in their first month or so. */
  isAutoDetectedBeginner: boolean;
  /** Plain-English reason for the detection result, useful for tooltips. */
  detectionReason: string;
  /** Days since the first recorded night of data. */
  daysSinceStart: number;
  /** Average usage hours in the first ISO week of data (or null). */
  week1AverageUsageHours: number | null;
  /** Average usage hours in the most recent 7-day window of data. */
  recentAverageUsageHours: number | null;
  /** Average AHI in the first ISO week of data. */
  week1AverageAhi: number | null;
  /** Average AHI in the most recent 7-day window. */
  recentAverageAhi: number | null;
  milestones: BeginnerMilestone[];
}

export interface TherapySummary {
  // Headline numbers (existing).
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  totalNights: number;
  averageUsageHours: number | null;
  percentNightsUsed: number | null;
  /** Lifetime % of nights ≥ 4 hours. */
  percentNightsCompliant: number | null;
  averageAhi: number | null;
  averageLeak: number | null;
  pressure95: number | null;

  // New: extras for richer reporting.
  /** Cumulative hours on therapy across the whole period. */
  totalUsageHours: number | null;
  /** Rolling 30-day compliance: % of nights ≥ 4h within the most recent
   *  30 calendar days of the date range. Null if fewer than ~7 nights. */
  rolling30DayCompliance: number | null;
  /** Median AHI across the period (less skewed by outlier nights). */
  medianAhi: number | null;
  /** Maximum AHI seen on any single night (for context, not alarm). */
  maxAhi: number | null;
  /** Longest run of consecutive nights with usage ≥ 4 hours. */
  longestCompliantStreak: number;
  /** Current run (ending on the most recent night) of nights ≥ 4 hours. */
  currentCompliantStreak: number;
  bestNight: NightHighlight | null;
  worstNight: NightHighlight | null;
  ahiDistribution: DistributionBucket[];
  dayOfWeek: DayOfWeekRow[];
  eventComposition: EventComposition;

  // Per-night derived series (used by overlays + heat calendar).
  rolling7AhiSeries: RollingPoint[];
  rolling7UsageHoursSeries: RollingPoint[];
  heatCalendar: HeatCell[];

  flags: TherapyFlag[];
  beginner: BeginnerInfo;
}

// ---- generic helpers ----------------------------------------------------

function toNumOr<T>(v: number | null | undefined, fallback: T): number | T {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(values: (number | null | undefined)[]): number | null {
  const nums = values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function pct(num: number, den: number): number | null {
  if (!den) return null;
  return (num / den) * 100;
}

function round(n: number | null, digits = 2): number | null {
  if (n === null) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Days between two ISO YYYY-MM-DD dates, as a non-negative integer. */
function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Convert JS getUTCDay() (0=Sun…6=Sat) to UK-style 0=Mon…6=Sun. */
function ukWeekday(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---- main entry ---------------------------------------------------------

export function summarise(nights: NightRow[]): TherapySummary {
  if (!nights.length) return emptySummary();

  const sorted = [...nights].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = sorted[sorted.length - 1].date;
  const firstDate = sorted[0].date;

  // -- Headline numbers (preserves the original behaviour) ----------------
  const usageMinutes = sorted.map(n => n.usage_minutes ?? null);
  const used = usageMinutes.filter((m): m is number => typeof m === "number" && m > 0);
  const compliant = usageMinutes.filter((m): m is number => typeof m === "number" && m >= 240);
  const totalUsageHoursVal = used.reduce((a, b) => a + b, 0) / 60;

  // -- Rolling 30-day compliance -----------------------------------------
  const last30Cutoff = new Date(Date.parse(lastDate + "T00:00:00Z") - 29 * 86_400_000)
    .toISOString().slice(0, 10);
  const last30 = sorted.filter(n => n.date >= last30Cutoff);
  const last30Compliant = last30.filter(n =>
    typeof n.usage_minutes === "number" && n.usage_minutes >= 240
  ).length;
  const rolling30 = last30.length >= 7 ? pct(last30Compliant, last30.length) : null;

  // -- Streaks -----------------------------------------------------------
  const { longest, current } = computeStreaks(sorted);

  // -- Best / worst nights -----------------------------------------------
  const nightsWithAhi = sorted.filter(n => typeof n.ahi === "number" && Number.isFinite(n.ahi));
  const sortedByAhi = [...nightsWithAhi].sort((a, b) => (a.ahi! - b.ahi!));
  const best = sortedByAhi[0] ? toHighlight(sortedByAhi[0]) : null;
  const worst = sortedByAhi[sortedByAhi.length - 1] ? toHighlight(sortedByAhi[sortedByAhi.length - 1]) : null;

  // -- AHI distribution --------------------------------------------------
  const ahiBuckets: { from: number; to: number | null; label: string }[] = [
    { from: 0,  to: 1,  label: "< 1" },
    { from: 1,  to: 3,  label: "1–3" },
    { from: 3,  to: 5,  label: "3–5" },
    { from: 5,  to: 10, label: "5–10" },
    { from: 10, to: 20, label: "10–20" },
    { from: 20, to: null, label: "20+" },
  ];
  const ahiDistribution: DistributionBucket[] = ahiBuckets.map(b => ({
    ...b,
    count: nightsWithAhi.filter(n => {
      const v = n.ahi as number;
      if (b.to === null) return v >= b.from;
      return v >= b.from && v < b.to;
    }).length,
  }));

  // -- Day-of-week breakdown --------------------------------------------
  const buckets: { ahis: number[]; hours: number[] }[] = Array.from(
    { length: 7 }, () => ({ ahis: [], hours: [] })
  );
  for (const n of sorted) {
    const wk = ukWeekday(new Date(n.date + "T12:00:00Z"));
    if (typeof n.ahi === "number") buckets[wk].ahis.push(n.ahi);
    if (typeof n.usage_minutes === "number") buckets[wk].hours.push(n.usage_minutes / 60);
  }
  const dayOfWeek: DayOfWeekRow[] = buckets.map((b, i) => ({
    weekday: i,
    label: WEEKDAY_LABELS[i],
    averageAhi: round(avg(b.ahis)),
    averageUsageHours: round(avg(b.hours)),
    count: Math.max(b.ahis.length, b.hours.length),
  }));

  // -- Event composition (% of summed events across the period) ---------
  const oa  = sumIndex(sorted, "obstructive_index");
  const ca  = sumIndex(sorted, "central_index");
  const hyp = sumIndex(sorted, "hypopnea_index");
  const rer = sumIndex(sorted, "rera_index");
  const total = oa + ca + hyp + rer;
  const eventComposition: EventComposition = {
    obstructivePct: total > 0 ? round((oa / total) * 100, 1) : null,
    centralPct:     total > 0 ? round((ca / total) * 100, 1) : null,
    hypopneaPct:    total > 0 ? round((hyp / total) * 100, 1) : null,
    reraPct:        total > 0 ? round((rer / total) * 100, 1) : null,
    dominant: dominantEvent({ oa, ca, hyp, rer, total }),
  };

  // -- Rolling 7-day averages -------------------------------------------
  const rolling7Ahi = rollingAverage(sorted, 7, n => n.ahi);
  const rolling7Hours = rollingAverage(sorted, 7, n =>
    typeof n.usage_minutes === "number" ? n.usage_minutes / 60 : null
  );

  // -- Heat calendar -----------------------------------------------------
  const heatCalendar = buildHeatCalendar(sorted, firstDate, lastDate);

  // -- Beginner detection + milestones ----------------------------------
  const beginner = detectBeginner(sorted, firstDate, lastDate);

  const summary: TherapySummary = {
    dateRangeStart: firstDate,
    dateRangeEnd: lastDate,
    totalNights: sorted.length,
    averageUsageHours: round(avg(used.map(m => m / 60))),
    percentNightsUsed: round(pct(used.length, sorted.length), 1),
    percentNightsCompliant: round(pct(compliant.length, sorted.length), 1),
    averageAhi: round(avg(sorted.map(n => n.ahi))),
    averageLeak: round(avg(sorted.map(n => n.leak_median ?? n.leak_95))),
    pressure95: round(avg(sorted.map(n => n.pressure_95))),

    totalUsageHours: round(totalUsageHoursVal, 1),
    rolling30DayCompliance: round(rolling30, 1),
    medianAhi: round(median(sorted.map(n => n.ahi))),
    maxAhi: nightsWithAhi.length ? round(Math.max(...nightsWithAhi.map(n => n.ahi as number))) : null,
    longestCompliantStreak: longest,
    currentCompliantStreak: current,
    bestNight: best,
    worstNight: worst,
    ahiDistribution,
    dayOfWeek,
    eventComposition,

    rolling7AhiSeries: rolling7Ahi,
    rolling7UsageHoursSeries: rolling7Hours,
    heatCalendar,

    flags: [],
    beginner,
  };

  summary.flags = buildFlags(sorted, summary);
  return summary;
}

// ---- pieces -------------------------------------------------------------

function emptySummary(): TherapySummary {
  return {
    dateRangeStart: null, dateRangeEnd: null,
    totalNights: 0,
    averageUsageHours: null, percentNightsUsed: null, percentNightsCompliant: null,
    averageAhi: null, averageLeak: null, pressure95: null,
    totalUsageHours: null, rolling30DayCompliance: null,
    medianAhi: null, maxAhi: null,
    longestCompliantStreak: 0, currentCompliantStreak: 0,
    bestNight: null, worstNight: null,
    ahiDistribution: [], dayOfWeek: [], eventComposition: {
      obstructivePct: null, centralPct: null, hypopneaPct: null, reraPct: null, dominant: null,
    },
    rolling7AhiSeries: [], rolling7UsageHoursSeries: [], heatCalendar: [],
    flags: [],
    beginner: {
      isAutoDetectedBeginner: false,
      detectionReason: "No data yet.",
      daysSinceStart: 0,
      week1AverageUsageHours: null,
      week1AverageAhi: null,
      recentAverageUsageHours: null,
      recentAverageAhi: null,
      milestones: [],
    },
  };
}

function toHighlight(n: NightRow): NightHighlight {
  return {
    date: n.date,
    ahi: typeof n.ahi === "number" ? round(n.ahi) : null,
    usageHours: typeof n.usage_minutes === "number" ? round(n.usage_minutes / 60, 1) : null,
    leak: typeof n.leak_95 === "number" ? round(n.leak_95, 1)
        : typeof n.leak_median === "number" ? round(n.leak_median, 1) : null,
  };
}

function sumIndex(rows: NightRow[], key: keyof NightRow): number {
  return rows.reduce((acc, r) => acc + (typeof r[key] === "number" ? (r[key] as number) : 0), 0);
}

function dominantEvent(t: { oa: number; ca: number; hyp: number; rer: number; total: number }):
  EventComposition["dominant"] {
  if (t.total <= 0) return null;
  const entries: [EventComposition["dominant"], number][] = [
    ["obstructive", t.oa], ["central", t.ca], ["hypopnoea", t.hyp], ["rera", t.rer],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  // If the top two are within 10% of total of each other, call it mixed.
  if (entries[1] && (entries[0][1] - entries[1][1]) / t.total < 0.1) return "mixed";
  return entries[0][0];
}

function computeStreaks(sorted: NightRow[]): { longest: number; current: number } {
  let longest = 0;
  let run = 0;
  for (const n of sorted) {
    const isCompliant = typeof n.usage_minutes === "number" && n.usage_minutes >= 240;
    run = isCompliant ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  // Current streak: count back from the end while compliant.
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const m = sorted[i].usage_minutes;
    if (typeof m === "number" && m >= 240) current++;
    else break;
  }
  return { longest, current };
}

function rollingAverage(
  sorted: NightRow[],
  window: number,
  pick: (n: NightRow) => number | null | undefined
): RollingPoint[] {
  // Calendar-aware rolling: average over the previous `window` nights of
  // data, even if dates have gaps. Lightweight implementation — for our
  // dataset sizes (≤ a few hundred nights) the O(n*window) cost is fine.
  return sorted.map((row, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
    const value = avg(slice.map(pick));
    return { date: row.date, value: value === null ? null : round(value) };
  });
}

function buildHeatCalendar(sorted: NightRow[], firstDate: string, lastDate: string): HeatCell[] {
  const byDate = new Map<string, NightRow>(sorted.map(n => [n.date, n]));
  const result: HeatCell[] = [];
  // Walk from the Monday of the first week through to the last date.
  const first = new Date(firstDate + "T12:00:00Z");
  const offsetToMonday = ukWeekday(first);
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - offsetToMonday);

  const end = new Date(lastDate + "T12:00:00Z");
  const cursor = new Date(start);
  let weekIndex = 0;
  while (cursor <= end) {
    const wk = ukWeekday(cursor);
    const iso = cursor.toISOString().slice(0, 10);
    const row = byDate.get(iso);
    const usageHours = row && typeof row.usage_minutes === "number"
      ? round(row.usage_minutes / 60, 1) : null;
    // Mark cells before the actual data start as missing too.
    const inRange = iso >= firstDate && iso <= lastDate;
    result.push({
      date: iso,
      weekday: wk,
      weekIndex,
      usageHours: inRange ? usageHours : null,
    });
    if (wk === 6) weekIndex++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// ---- beginner detection -------------------------------------------------

function detectBeginner(sorted: NightRow[], firstDate: string, lastDate: string): BeginnerInfo {
  const today = new Date().toISOString().slice(0, 10);
  // "Days since start" is from the user's first recorded night to *today*,
  // not to the last night, because someone uploading after a 2-month gap
  // is still 2 months in even if the data ends earlier.
  const daysSinceStart = daysBetween(firstDate, today);
  const totalNights = sorted.length;

  // Heuristic: first recorded night within the last 60 days, AND data
  // spans 30 nights or fewer. Charitable both ways — someone uploading
  // their first full month gets beginner mode; someone with 6 months of
  // data does not.
  const isAuto =
    daysSinceStart <= 60 &&
    totalNights <= 30 &&
    daysBetween(firstDate, lastDate) <= 45;

  const week1End = new Date(Date.parse(firstDate + "T00:00:00Z") + 6 * 86_400_000)
    .toISOString().slice(0, 10);
  const week1 = sorted.filter(n => n.date >= firstDate && n.date <= week1End);
  const recentStart = new Date(Date.parse(lastDate + "T00:00:00Z") - 6 * 86_400_000)
    .toISOString().slice(0, 10);
  const recent = sorted.filter(n => n.date >= recentStart && n.date <= lastDate);

  const reason = isAuto
    ? `Auto-on: started ${daysSinceStart} day(s) ago with ${totalNights} night(s) of data.`
    : `Auto-off: ${daysSinceStart} day(s) since first night${totalNights > 30 ? `, ${totalNights} nights of data` : ""}.`;

  return {
    isAutoDetectedBeginner: isAuto,
    detectionReason: reason,
    daysSinceStart,
    week1AverageUsageHours: round(avg(week1.map(n =>
      typeof n.usage_minutes === "number" ? n.usage_minutes / 60 : null))),
    week1AverageAhi: round(avg(week1.map(n => n.ahi))),
    recentAverageUsageHours: round(avg(recent.map(n =>
      typeof n.usage_minutes === "number" ? n.usage_minutes / 60 : null))),
    recentAverageAhi: round(avg(recent.map(n => n.ahi))),
    milestones: buildMilestones(sorted, daysSinceStart),
  };
}

function buildMilestones(sorted: NightRow[], daysSinceStart: number): BeginnerMilestone[] {
  const firstNight = sorted[0]?.date ?? null;
  const firstFour = sorted.find(n =>
    typeof n.usage_minutes === "number" && n.usage_minutes >= 240
  )?.date ?? null;
  const firstUnder5 = sorted.find(n =>
    typeof n.ahi === "number" && n.ahi < 5
  )?.date ?? null;
  // First "full week" = first 7-night window where every night used ≥ 4h.
  let firstFullWeek: string | null = null;
  for (let i = 0; i + 7 <= sorted.length; i++) {
    const window = sorted.slice(i, i + 7);
    if (window.every(n => typeof n.usage_minutes === "number" && n.usage_minutes >= 240)) {
      firstFullWeek = window[6].date;
      break;
    }
  }
  return [
    {
      id: "first-night",
      achieved: !!firstNight,
      date: firstNight,
      description: "Your first recorded night on therapy.",
    },
    {
      id: "first-four-hour",
      achieved: !!firstFour,
      date: firstFour,
      description: "First night with at least 4 hours of use — a common adjustment-phase milestone.",
    },
    {
      id: "first-ahi-under-five",
      achieved: !!firstUnder5,
      date: firstUnder5,
      description: "First night with AHI under 5. AHI takes time to settle as therapy is fine-tuned.",
    },
    {
      id: "first-full-week",
      achieved: !!firstFullWeek,
      date: firstFullWeek,
      description: "Seven nights in a row at ≥ 4 hours of use.",
    },
    {
      id: "thirty-day-mark",
      achieved: daysSinceStart >= 30,
      date: null,
      description: "Past the typical adjustment phase. Many people start to settle by here.",
    },
  ];
}

// ---- flags --------------------------------------------------------------

function buildFlags(nights: NightRow[], s: TherapySummary): TherapyFlag[] {
  const flags: TherapyFlag[] = [];
  const isBeginner = s.beginner.isAutoDetectedBeginner;

  // Low-usage flag. Severity changes in beginner mode but the flag still
  // appears so the user has a visible link to mask-comfort tips.
  if (s.percentNightsCompliant !== null && s.percentNightsCompliant < 70) {
    flags.push({
      id: "low-usage",
      severity: isBeginner ? "info" : "watch",
      title: isBeginner
        ? "Building up to longer nights"
        : "Lower than 4-hour usage on many nights",
      detail: isBeginner
        ? "Many people don't reach 4 hours every night in their first few weeks. The mask, ramp settings, and sleep position all take time to dial in. There are tried-and-tested tips in the CPAP beginner guide."
        : "Many sleep services use 4 hours per night as a rough usage benchmark. If most of your nights fall under that, this might be worth discussing with your sleep clinic to see whether mask comfort or pressure can be improved.",
      guideHref: "/cpap-guide",
    });
  }

  if (s.averageLeak !== null && s.averageLeak > 24) {
    flags.push({
      id: "high-leak",
      severity: "watch",
      title: "Average leak is on the higher side",
      detail:
        "A higher average leak rate often points to mask fit. This may be worth " +
        "discussing with your sleep clinic — they can check mask sizing and " +
        "headgear tension. You can also work through the mask-leak troubleshooting checklist.",
      guideHref: "/resources",
    });
  }

  // Severity for elevated AHI is unconditional — beginner or not, AHI ≥ 5
  // is something the clinician should know. We only soften wording.
  if (s.averageAhi !== null && s.averageAhi >= 5) {
    flags.push({
      id: "elevated-ahi",
      severity: "discuss",
      title: "AHI is above the common target",
      detail: isBeginner
        ? "Many clinicians aim for an AHI under 5 events per hour on therapy. AHI commonly takes time to settle in the first few weeks while the clinic fine-tunes therapy — but it's worth flagging the current number at your next appointment."
        : "Many clinicians aim for an AHI under 5 events per hour on therapy. If your average is sitting above that, please discuss it with your sleep clinic. We can't and won't suggest pressure changes here.",
    });
  }

  const fragmented = nights.filter(n =>
    typeof n.usage_minutes === "number" && n.usage_minutes > 0 && n.usage_minutes < 120
  ).length;
  if (fragmented >= 3 && fragmented / nights.length >= 0.15) {
    flags.push({
      id: "fragmented-usage",
      severity: "info",
      title: "Some nights show very short usage",
      detail:
        "There are nights where the machine ran for less than two hours. This " +
        "can happen for many reasons (mask removal, illness, travel). If it's " +
        "frequent, it's worth raising at your next clinic appointment.",
      guideHref: "/cpap-guide",
    });
  }

  if (nights.length >= 7) {
    const dates = new Set(nights.map(n => n.date));
    const start = new Date(nights[0].date);
    const end = new Date(nights[nights.length - 1].date);
    let missing = 0;
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      if (!dates.has(iso)) missing++;
    }
    if (missing > 0) {
      flags.push({
        id: "missing-nights",
        severity: "info",
        title: `${missing} night(s) missing from the data`,
        detail:
          "Gaps usually mean the machine wasn't used or data wasn't recorded. " +
          "This is informational only — your clinic looks at usage patterns " +
          "over weeks, not individual nights.",
      });
    }
  }

  // High share of central events is a different clinical conversation than
  // obstructive — call it out without telling the user what it means for them.
  if (s.eventComposition.centralPct !== null && s.eventComposition.centralPct >= 30 && (s.maxAhi ?? 0) > 1) {
    flags.push({
      id: "central-share",
      severity: "discuss",
      title: "A notable share of events were central",
      detail:
        "Across this period, around " +
        `${Math.round(s.eventComposition.centralPct)}%` +
        " of recorded events were classified as central rather than obstructive. " +
        "Central and obstructive events have different mechanisms and are sometimes " +
        "managed differently. Worth pointing this out at your next clinic visit.",
    });
  }

  // Suppress noisy `toNumOr` import warning in strict mode.
  void toNumOr;

  return flags;
}
