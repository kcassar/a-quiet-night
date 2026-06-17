import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, NightRow, SummaryResponse, TherapyFlag } from "../api";
import type { TherapySummary } from "../api";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import { MetricCard } from "../components/MetricCard";
import { AlertFlag } from "../components/AlertFlag";
import { TherapyTrendChart } from "../components/TherapyTrendChart";
import { AhiDistributionChart } from "../components/AhiDistributionChart";
import { DayOfWeekChart } from "../components/DayOfWeekChart";
import { HeatCalendar } from "../components/HeatCalendar";
import { MilestonesCard } from "../components/MilestonesCard";
import { TrajectoryCard } from "../components/TrajectoryCard";
import { InsightCard } from "../components/InsightCard";
import { EmptyState } from "../components/EmptyState";
import { MetricSkeletonGrid } from "../components/Skeleton";
import { Icon } from "../components/Icon";
import { StatusChip, Tone } from "../components/StatusChip";
import { RangeFilter, Range } from "../components/RangeFilter";
import { Accordion } from "../components/Accordion";

const LAST_UPLOAD_KEY = "sac:lastUploadId";
const BEGINNER_PREF_PREFIX = "aqn:beginner:";

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${n}${suffix}`;
}

function readBeginnerPref(uploadId: string): "auto" | "on" | "off" {
  try {
    const raw = localStorage.getItem(BEGINNER_PREF_PREFIX + uploadId);
    if (raw === "on" || raw === "off") return raw;
  } catch { /* ignore */ }
  return "auto";
}

function writeBeginnerPref(uploadId: string, v: "auto" | "on" | "off") {
  try { localStorage.setItem(BEGINNER_PREF_PREFIX + uploadId, v); } catch { /* ignore */ }
}

function rangeStart(lastDate: string, range: Range): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 6 : range === "30d" ? 29 : 89;
  const d = new Date(Date.parse(lastDate + "T00:00:00Z") - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function Dashboard() {
  useDocumentMeta({
    title: "CPAP therapy dashboard",
    description:
      "Your CPAP usage, AHI, leak and pressure trends with plain-English explanations. Download a print-ready PDF for your sleep clinic.",
    path: "/dashboard",
  });
  const { uploadId: paramId } = useParams();
  const navigate = useNavigate();
  const [uploadId, setUploadId] = useState<string | null>(paramId ?? null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [nights, setNights] = useState<NightRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [beginnerPref, setBeginnerPref] = useState<"auto" | "on" | "off">("auto");
  const [range, setRange] = useState<Range>("all");

  useEffect(() => {
    if (!paramId) {
      try {
        const last = localStorage.getItem(LAST_UPLOAD_KEY);
        if (last) navigate(`/dashboard/${last}`, { replace: true });
      } catch { /* ignore */ }
    } else {
      setUploadId(paramId);
      setBeginnerPref(readBeginnerPref(paramId));
    }
  }, [paramId, navigate]);

  useEffect(() => {
    if (!uploadId) return;
    setLoading(true);
    setError(null);
    Promise.all([api.getSummary(uploadId), api.getNights(uploadId)])
      .then(([s, n]) => { setSummary(s); setNights(n.nights); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uploadId]);

  const beginnerActive = useMemo(() => {
    if (!summary) return false;
    if (beginnerPref === "on") return true;
    if (beginnerPref === "off") return false;
    return summary.summary.beginner.isAutoDetectedBeginner;
  }, [summary, beginnerPref]);

  // Filter nights and rolling series by selected range. Keeps headline
  // metrics period-wide for consistency.
  const filteredNights = useMemo(() => {
    if (!summary || !summary.summary.dateRangeEnd) return nights;
    const start = rangeStart(summary.summary.dateRangeEnd, range);
    if (!start) return nights;
    return nights.filter(n => n.date >= start);
  }, [nights, summary, range]);

  const rolling7Ahi = useMemo(() => {
    if (!summary || !summary.summary.dateRangeEnd) return [];
    const start = rangeStart(summary.summary.dateRangeEnd, range);
    if (!start) return summary.summary.rolling7AhiSeries;
    return summary.summary.rolling7AhiSeries.filter(p => p.date >= start);
  }, [summary, range]);

  // ── Empty / loading / error / not-ready states ──────────────────────

  if (!uploadId) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Upload data to see your therapy trends." />
        <div className="app-content">
          <Card>
            <EmptyState
              icon="upload"
              title="You haven't uploaded any data yet."
              body="Drop in a ZIP from your CPAP SD card or an OSCAR export to see usage, AHI, leak, and pressure trends."
              action={<Button to="/upload" variant="primary" iconLeft={<Icon name="upload" size={14} />}>Upload your CPAP data</Button>}
            />
          </Card>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Loading your therapy summary…" />
        <div className="app-content">
          <MetricSkeletonGrid count={6} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="app-content">
          <Card>
            <EmptyState
              icon="info"
              title="Couldn't load this upload"
              body={error}
              action={<Button to="/upload" variant="secondary">Upload another file</Button>}
            />
          </Card>
        </div>
      </>
    );
  }

  if (!summary) return null;

  if (summary.status !== "ready") {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="app-content">
          <Card>
            <EmptyState
              icon="info"
              title="We couldn't show a dashboard for this upload"
              body={summary.message ?? "The data format wasn't recognised."}
              action={<Button to="/upload" variant="primary">Try a different file</Button>}
            />
            <p className="muted small mt-4" style={{ textAlign: "center" }}>
              Parser tried: {summary.parserUsed ?? "unknown"}.
            </p>
          </Card>
        </div>
      </>
    );
  }

  const s = summary.summary;
  const beginner = s.beginner;

  // ── Series for charts (range-filtered) ─────────────────────────────

  const usageHoursSeries = filteredNights.map(n => ({
    date: n.date,
    value: typeof n.usage_minutes === "number" ? Math.round((n.usage_minutes / 60) * 100) / 100 : null,
  }));
  const ahiSeries = filteredNights.map(n => ({ date: n.date, value: n.ahi }));
  const leakSeries = filteredNights.map(n => ({ date: n.date, value: n.leak_95 ?? n.leak_median }));
  const pressureSeries = filteredNights.map(n => ({ date: n.date, value: n.pressure_95 ?? n.pressure_median }));

  const shadeBand = beginnerActive && s.dateRangeStart ? {
    fromDate: s.dateRangeStart,
    toDate: addDays(s.dateRangeStart, 13),
    label: "Settling-in",
  } : undefined;

  const sortedFlags = sortFlags(s.flags);
  const insights = buildInsights(s);
  const subtitle = `${s.dateRangeStart ?? "—"} → ${s.dateRangeEnd ?? "—"} · ${s.totalNights} nights · ${s.totalUsageHours ?? 0}h on therapy`;

  return (
    <>
      <PageHeader
        title="Therapy dashboard"
        subtitle={subtitle}
        actions={
          <div className="flex gap-2 items-center">
            <Button href={`/api/upload/${uploadId}/export/pdf`} variant="primary" size="sm" iconLeft={<Icon name="download" size={14} />}>
              <span style={{ fontSize: "var(--fs-13)" }}>PDF</span>
            </Button>
            <Button href={`/api/upload/${uploadId}/export/csv`} variant="secondary" size="sm" iconLeft={<Icon name="download" size={14} />}>
              <span style={{ fontSize: "var(--fs-13)" }}>CSV</span>
            </Button>
          </div>
        }
      />

      <div className="app-content">

        {/* ── Beginner banner ── */}
        {beginnerActive ? (
          <div className="beginner-banner">
            <span className="eyebrow">You're early in CPAP therapy</span>
            <h2>Settling-in phase — different numbers, same support.</h2>
            <p className="muted">
              Many people don't reach 4 hours every night, and AHI hasn't fully settled
              while your clinic fine-tunes therapy. We've reframed the dashboard for
              this stage. Big swings are normal. The trajectory is what matters.
            </p>
            <p className="tiny faint">{beginner.detectionReason}</p>
            <BeginnerToggle
              value={beginnerPref}
              onChange={v => { setBeginnerPref(v); writeBeginnerPref(uploadId, v); }}
            />
          </div>
        ) : (
          <div className="mb-4">
            <BeginnerToggle
              value={beginnerPref}
              onChange={v => { setBeginnerPref(v); writeBeginnerPref(uploadId, v); }}
            />
          </div>
        )}

        <DisclaimerBanner>
          We describe what your data shows. We don't tell you to change pressure,
          mask, or therapy. Anything that looks unusual is worth raising with
          your sleep clinic.
        </DisclaimerBanner>

        {/* ── Beginner cards (top-of-page) ── */}
        {beginnerActive ? (
          <div className="grid grid-2 mb-6">
            <TrajectoryCard beginner={beginner} />
            <MilestonesCard beginner={beginner} />
          </div>
        ) : null}

        {/* ── Insight panel (plain-English observations) ── */}
        {insights.length ? (
          <>
            <SectionHeader title="In plain English" subtitle="Descriptive observations from your data — no diagnosis." />
            <div className="grid grid-2">
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} title={ins.title}>{ins.body}</InsightCard>
              ))}
            </div>
          </>
        ) : null}

        {/* ── Headline metrics ── */}
        <SectionHeader title="Therapy summary" subtitle="Headline numbers across the whole period." />
        <div className="grid grid-3">
          <MetricCard
            label="Average AHI"
            value={fmt(s.averageAhi)}
            status={statusForAhi(s.averageAhi)}
            explanation="Apnoea-Hypopnoea Index averaged across nights. Many clinicians aim for under 5 on therapy — your target is individual."
          />
          <MetricCard
            label="Rolling 30-day compliance"
            value={fmt(s.rolling30DayCompliance)}
            suffix="%"
            status={statusForCompliance(s.rolling30DayCompliance)}
            explanation="Percentage of the most recent 30 nights with at least 4 hours of use. The metric many sleep services and insurers use."
          />
          <MetricCard
            label="Average usage"
            value={fmt(s.averageUsageHours)}
            suffix=" h"
            status={s.percentNightsCompliant !== null && s.percentNightsCompliant >= 70 ? { tone: "success", label: "Stable" } : { tone: "info", label: "Informational" }}
            explanation="Average hours of CPAP use per night where the machine ran."
          />
          <MetricCard
            label="Median AHI"
            value={fmt(s.medianAhi)}
            status={{ tone: "info", label: "Informational" }}
            explanation="The middle night's AHI — less affected by one-off bad nights than the mean."
          />
          <MetricCard
            label="Highest single-night AHI"
            value={fmt(s.maxAhi)}
            status={{ tone: "info", label: "Informational" }}
            explanation="Single-night peaks are common and rarely a verdict on therapy."
          />
          <MetricCard
            label="Average leak"
            value={fmt(s.averageLeak)}
            suffix=" L/min"
            status={s.averageLeak !== null && s.averageLeak > 24 ? { tone: "warning", label: "Worth discussing" } : { tone: "success", label: "Stable" }}
            explanation="Median leak averaged across nights. Higher rates can affect comfort and effectiveness."
          />
          <MetricCard
            label="95th percentile pressure"
            value={fmt(s.pressure95)}
            suffix=" cmH₂O"
            status={{ tone: "info", label: "Informational" }}
            explanation="The pressure your machine reaches or stays under for 95% of the night."
          />
          <MetricCard
            label="Longest compliant streak"
            value={`${s.longestCompliantStreak}`}
            suffix=" nights"
            status={s.currentCompliantStreak > 0 ? { tone: "success", label: `Currently ${s.currentCompliantStreak}` } : { tone: "neutral", label: "Streak ended" }}
            explanation={`The longest run of consecutive nights with at least 4 hours of use. Currently ${s.currentCompliantStreak} in a row.`}
          />
          <MetricCard
            label="Total hours on therapy"
            value={fmt(s.totalUsageHours)}
            suffix=" h"
            status={{ tone: "success", label: "Cumulative" }}
            explanation="Total hours of CPAP use across the date range above."
          />
        </div>

        {/* ── Best / worst nights ── */}
        {(s.bestNight || s.worstNight) ? (
          <div className="grid grid-2 mt-6">
            {s.bestNight ? <NightHighlightCard tone="success" title="Best night" night={s.bestNight} /> : null}
            {s.worstNight ? <NightHighlightCard tone="discuss" title="Highest-AHI night" night={s.worstNight} note="A single high night is rarely meaningful on its own." /> : null}
          </div>
        ) : null}

        {/* ── Flags ── */}
        {sortedFlags.length ? (
          <>
            <SectionHeader title="Things you might discuss with your clinician" subtitle="Educational — not a diagnosis." />
            <div className="stack-3">
              {sortedFlags.map(f => <AlertFlag key={f.id} flag={f} />)}
            </div>
          </>
        ) : null}

        {/* ── Trends ── */}
        <SectionHeader
          title="Trends over time"
          subtitle="AHI, usage, leak and pressure — across the selected range."
          actions={<RangeFilter value={range} onChange={setRange} />}
        />
        <div className="grid grid-2">
          <TherapyTrendChart
            title="AHI"
            data={ahiSeries}
            threshold={{ value: 5, label: "common target" }}
            overlay={{ name: "7-day avg", data: rolling7Ahi, colour: "var(--text)" }}
            shadeBand={shadeBand}
          />
          <TherapyTrendChart
            title="Usage"
            unit="hours"
            data={usageHoursSeries}
            kind="bar"
            colour="var(--primary)"
            shadeBand={shadeBand}
          />
          <TherapyTrendChart title="Leak rate" unit="L/min" data={leakSeries} colour="var(--warning)" />
          <TherapyTrendChart title="Pressure" unit="cmH₂O" data={pressureSeries} colour="var(--accent-blue)" />
        </div>

        {/* ── Distribution + patterns ── */}
        <SectionHeader title="Distribution &amp; patterns" subtitle="A bigger picture than the averages above." />
        <div className="grid grid-2">
          <AhiDistributionChart data={s.ahiDistribution} />
          <DayOfWeekChart data={s.dayOfWeek} />
        </div>
        <div className="grid grid-2 mt-4">
          <HeatCalendar cells={s.heatCalendar} />
          <EventCompositionCard composition={s.eventComposition} />
        </div>

        {/* ── Glossary ── */}
        <SectionHeader title="What every metric means" />
        <Card>
          <Accordion title="AHI — Apnoea-Hypopnoea Index">
            <p>Average breathing events per hour. Lower is generally better; many clinicians target under 5 on therapy. Targets are individual.</p>
          </Accordion>
          <Accordion title="Usage hours">
            <p>How long the machine actually ran each night. The 4-hour mark is a common benchmark, not a target.</p>
          </Accordion>
          <Accordion title="Leak rate">
            <p>Air escaping the mask. Higher rates can affect comfort and effectiveness. Mask fit is the most common cause.</p>
          </Accordion>
          <Accordion title="Pressure (95th percentile)">
            <p>The pressure your machine reached or stayed under for 95% of the night. APAP machines vary night to night.</p>
          </Accordion>
          <Accordion title="Rolling 30-day compliance">
            <p>The percentage of the most recent 30 nights with at least 4 hours of use. The metric many sleep services and insurers track.</p>
          </Accordion>
          <Accordion title="Median AHI">
            <p>The middle value across your nights. Less skewed by individual outliers than the mean.</p>
          </Accordion>
        </Card>
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function BeginnerToggle({
  value, onChange,
}: { value: "auto" | "on" | "off"; onChange: (v: "auto" | "on" | "off") => void }) {
  return (
    <div className="segmented" role="group" aria-label="Beginner mode">
      <span className="segmented-label">Beginner</span>
      {(["auto", "on", "off"] as const).map(opt => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          className={value === opt ? "active" : ""}
          onClick={() => onChange(opt)}
        >{opt}</button>
      ))}
    </div>
  );
}

function NightHighlightCard({ tone, title, night, note }: {
  tone: Tone;
  title: string;
  night: { date: string; ahi: number | null; usageHours: number | null; leak: number | null };
  note?: string;
}) {
  const fmtN = (n: number | null, suf = "") => n === null || n === undefined ? "—" : `${n}${suf}`;
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div>
          <span className="eyebrow">{title}</span>
          <h3 style={{ marginBottom: 0 }}>{night.date}</h3>
        </div>
        <StatusChip tone={tone}>{tone === "success" ? "Best" : "Highest"}</StatusChip>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        AHI {fmtN(night.ahi)} · Usage {fmtN(night.usageHours, "h")} · Leak 95% {fmtN(night.leak, " L/min")}
      </p>
      {note ? <p className="muted small mt-3" style={{ margin: 0, marginTop: "var(--space-3)" }}>{note}</p> : null}
    </Card>
  );
}

function EventCompositionCard({ composition }: { composition: import("../api").EventComposition }) {
  const c = composition;
  const total = (c.obstructivePct ?? 0) + (c.centralPct ?? 0) + (c.hypopneaPct ?? 0) + (c.reraPct ?? 0);
  if (total <= 0) {
    return (
      <Card>
        <h3 style={{ margin: 0 }}>Event composition</h3>
        <EmptyState icon="info" title="No event-level data in this upload." />
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h3 style={{ margin: 0 }} id="composition-title">Event composition</h3>
        <StatusChip tone="info">{c.dominant === "mixed" ? "Mixed" : `${c.dominant ?? ""} dominant`}</StatusChip>
      </div>
      <p className="muted small mt-2" id="composition-desc">
        Share of scored events by type, across the whole period.
      </p>
      <figure role="figure" aria-labelledby="composition-title" aria-describedby="composition-desc">
        {/* Visual bar chart - decorative */}
        <div className="composition-bar" aria-hidden="true">
          <span style={{ width: `${c.obstructivePct ?? 0}%`, background: "var(--accent-peach)" }} />
          <span style={{ width: `${c.hypopneaPct   ?? 0}%`, background: "var(--warning)" }} />
          <span style={{ width: `${c.centralPct    ?? 0}%`, background: "var(--accent-blue)" }} />
          <span style={{ width: `${c.reraPct       ?? 0}%`, background: "color-mix(in srgb, var(--accent-blue) 50%, var(--accent-peach))" }} />
        </div>
        {/* Accessible legend with data */}
        <figcaption>
          <dl className="composition-legend" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <dt className="sr-only">Obstructive events</dt>
              <dd style={{ display: "flex", alignItems: "center", margin: 0, fontSize: "var(--fs-13)", color: "var(--text-muted)" }}>
                <span className="swatch" style={{ background: "var(--accent-peach)" }} aria-hidden="true" />
                Obstructive {fmt(c.obstructivePct, "%")}
              </dd>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <dt className="sr-only">Hypopnoea events</dt>
              <dd style={{ display: "flex", alignItems: "center", margin: 0, fontSize: "var(--fs-13)", color: "var(--text-muted)" }}>
                <span className="swatch" style={{ background: "var(--warning)" }} aria-hidden="true" />
                Hypopnoea {fmt(c.hypopneaPct, "%")}
              </dd>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <dt className="sr-only">Central events</dt>
              <dd style={{ display: "flex", alignItems: "center", margin: 0, fontSize: "var(--fs-13)", color: "var(--text-muted)" }}>
                <span className="swatch" style={{ background: "var(--accent-blue)" }} aria-hidden="true" />
                Central {fmt(c.centralPct, "%")}
              </dd>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <dt className="sr-only">RERA events</dt>
              <dd style={{ display: "flex", alignItems: "center", margin: 0, fontSize: "var(--fs-13)", color: "var(--text-muted)" }}>
                <span className="swatch" style={{ background: "color-mix(in srgb, var(--accent-blue) 50%, var(--accent-peach))" }} aria-hidden="true" />
                RERA {fmt(c.reraPct, "%")}
              </dd>
            </div>
          </dl>
        </figcaption>
      </figure>
      <p className="muted small mt-3">
        Informational. A clinician interprets the mix in context with your sleep study.
      </p>
    </Card>
  );
}

function statusForAhi(ahi: number | null): { tone: Tone; label: string } {
  if (ahi === null) return { tone: "neutral", label: "—" };
  if (ahi < 1)  return { tone: "success", label: "Very low" };
  if (ahi < 5)  return { tone: "success", label: "Stable" };
  if (ahi < 15) return { tone: "warning", label: "Worth discussing" };
  return { tone: "discuss", label: "Worth discussing" };
}

function statusForCompliance(pct: number | null): { tone: Tone; label: string } {
  if (pct === null) return { tone: "neutral", label: "—" };
  if (pct >= 70) return { tone: "success", label: "On track" };
  if (pct >= 50) return { tone: "warning", label: "Building up" };
  return { tone: "info", label: "Informational" };
}

function buildInsights(s: TherapySummary): { icon: "spark" | "info" | "leaf"; title: string; body: string }[] {
  const out: { icon: "spark" | "info" | "leaf"; title: string; body: string }[] = [];

  // Distribution shape
  const total = s.ahiDistribution.reduce((a, b) => a + b.count, 0);
  if (total > 0) {
    const under1 = s.ahiDistribution[0]?.count ?? 0;
    const under5 = (s.ahiDistribution[0]?.count ?? 0) + (s.ahiDistribution[1]?.count ?? 0) + (s.ahiDistribution[2]?.count ?? 0);
    const under1Pct = Math.round((under1 / total) * 100);
    const under5Pct = Math.round((under5 / total) * 100);
    if (under5Pct >= 80) {
      out.push({
        icon: "leaf",
        title: "AHI distribution looks settled",
        body: `${under5Pct}% of your nights had AHI under 5, and ${under1Pct}% had AHI under 1. That's a settled-looking distribution — your clinician is the right person to interpret targets for your case.`,
      });
    } else if (under5Pct >= 60) {
      out.push({
        icon: "info",
        title: "Distribution is mostly under 5",
        body: `${under5Pct}% of your nights had AHI under 5. The remainder are spread above. Worth flagging the higher nights at your next clinic visit.`,
      });
    }
  }

  // Streak
  if (s.currentCompliantStreak >= 7) {
    out.push({
      icon: "leaf",
      title: `You're on a ${s.currentCompliantStreak}-night streak`,
      body: `Consecutive nights at 4+ hours of use. The longest compliant run on this dataset is ${s.longestCompliantStreak} nights.`,
    });
  }

  // Day-of-week pattern
  const dow = s.dayOfWeek.filter(d => d.averageAhi !== null);
  if (dow.length >= 4) {
    const hi = dow.reduce((a, b) => ((b.averageAhi ?? 0) > (a.averageAhi ?? 0) ? b : a));
    const lo = dow.reduce((a, b) => ((b.averageAhi ?? Infinity) < (a.averageAhi ?? Infinity) ? b : a));
    if (hi.averageAhi && lo.averageAhi && hi.averageAhi - lo.averageAhi >= 1.0) {
      out.push({
        icon: "info",
        title: `${hi.label} nights look different`,
        body: `Average AHI on ${hi.label}s is ${hi.averageAhi}, compared with ${lo.averageAhi} on ${lo.label}s. Worth looking at what's different about those nights.`,
      });
    }
  }

  return out.slice(0, 3);
}

function sortFlags(flags: TherapyFlag[]): TherapyFlag[] {
  const order = { discuss: 0, watch: 1, info: 2 } as const;
  return [...flags].sort((a, b) => order[a.severity] - order[b.severity]);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
