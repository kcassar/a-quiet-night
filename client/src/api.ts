// Tiny fetch wrapper. Keeps API typing in one place.

export interface TherapyFlag {
  id: string;
  severity: "info" | "watch" | "discuss";
  title: string;
  detail: string;
  guideHref?: string;
}

export interface DistributionBucket {
  from: number;
  to: number | null;
  label: string;
  count: number;
}

export interface DayOfWeekRow {
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
  weekday: number;
  weekIndex: number;
  usageHours: number | null;
}

export interface BeginnerMilestone {
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
  isAutoDetectedBeginner: boolean;
  detectionReason: string;
  daysSinceStart: number;
  week1AverageUsageHours: number | null;
  week1AverageAhi: number | null;
  recentAverageUsageHours: number | null;
  recentAverageAhi: number | null;
  milestones: BeginnerMilestone[];
}

export interface TherapySummary {
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  totalNights: number;
  averageUsageHours: number | null;
  percentNightsUsed: number | null;
  percentNightsCompliant: number | null;
  averageAhi: number | null;
  averageLeak: number | null;
  pressure95: number | null;

  totalUsageHours: number | null;
  rolling30DayCompliance: number | null;
  medianAhi: number | null;
  maxAhi: number | null;
  longestCompliantStreak: number;
  currentCompliantStreak: number;
  bestNight: NightHighlight | null;
  worstNight: NightHighlight | null;
  ahiDistribution: DistributionBucket[];
  dayOfWeek: DayOfWeekRow[];
  eventComposition: EventComposition;

  rolling7AhiSeries: RollingPoint[];
  rolling7UsageHoursSeries: RollingPoint[];
  heatCalendar: HeatCell[];

  flags: TherapyFlag[];
  beginner: BeginnerInfo;
}

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

export interface SummaryResponse {
  uploadId: string;
  status: string;
  parserUsed: string | null;
  message: string | null;
  summary: TherapySummary;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  best_for_tags: string[];
  pros: string[];
  cons: string[];
  affiliate_url: string | null;
  fallback_url: string | null;
  image_url: string | null;
}

export interface ProductsResponse {
  products: Product[];
  categories: string[];
  tags: string[];
}

export interface Retailer {
  id: string;
  rank: number;
  name: string;
  tagline: string;
  url: string;
  affiliateUrl: string;
  logoUrl: string | null;
  accentColour: string;
  score: { value: number; outOf: number } | null;
  badge: string | null;
  highlight: string;
  terms: { label: string; value: string }[];
  whyWeLikeThem: string[];
  active: boolean;
}

export interface RetailersResponse {
  retailers: Retailer[];
}

export interface JournalEntry {
  id: number;
  date: string;
  sleep_quality: number | null;
  mask_comfort: number | null;
  dry_mouth: number | null;
  headache: number | null;
  congestion: number | null;
  alcohol_before_bed: number | null;
  notes: string | null;
  created_at: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getSummary: (id: string) => getJson<SummaryResponse>(`/api/upload/${id}/summary`),
  getNights: (id: string) =>
    getJson<{ nights: NightRow[] }>(`/api/upload/${id}/nights`),
  getProducts: (params?: { category?: string; tag?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.tag) q.set("tag", params.tag);
    const suffix = q.toString() ? `?${q}` : "";
    return getJson<ProductsResponse>(`/api/products${suffix}`);
  },
  getRetailers: () => getJson<RetailersResponse>("/api/retailers"),
  getJournal: () => getJson<{ entries: JournalEntry[] }>("/api/journal"),
  postJournal: async (entry: Partial<JournalEntry>) => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to save journal entry.");
    }
    return res.json() as Promise<{ id: number }>;
  },
  getGlossary: () => getJson<{ entries: GlossaryEntry[] }>("/api/glossary"),
};
