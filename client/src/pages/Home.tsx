import { Link } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { SectionHeader } from "../components/SectionHeader";
import { Accordion } from "../components/Accordion";

// Homepage organised around user intent rather than features.
//
// The brief asks for three things on the first screen:
//   1. A question to the visitor ("What brings you here?")
//   2. Two intent CTAs (educational vs already-on-CPAP)
//   3. No data-upload pressure — most first-time visitors don't know
//      what AHI or OSCAR even are.
//
// Everything below the hero progressively introduces the rest of the site
// — Learn, CPAP Therapy and My Data — without forcing any one path.

export function Home() {
  useDocumentMeta({
    title: "A Quiet Night — calm, plain-English CPAP companion",
    description:
      "Understand sleep apnoea and CPAP therapy in plain English. Educational, private and free. No accounts. Not medical advice.",
    path: "/",
  });

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="hero hero-intent">
        <div className="hero-inner">
          <span className="eyebrow">A Quiet Night</span>
          <h1>What brings you here?</h1>
          <p className="lede">
            A calm, plain-English companion for sleep apnoea and CPAP therapy.
            Pick the path that matches where you are. We&apos;ll explain the
            rest.
          </p>
        </div>

        <div className="intent-cards">
          <Link to="/learn" className="intent-card intent-card-blue">
            <div className="intent-card-icon" aria-hidden="true">
              <Icon name="info" size={20} />
            </div>
            <div className="intent-card-body">
              <h2>I think I may have sleep apnoea</h2>
              <p>
                What it is in plain English, common symptoms, when to see a
                doctor, and how diagnosis actually works.
              </p>
              <span className="intent-card-cta">
                Start with the basics <Icon name="arrow-right" size={14} />
              </span>
            </div>
          </Link>

          <Link to="/cpap-therapy" className="intent-card intent-card-peach">
            <div className="intent-card-icon" aria-hidden="true">
              <Icon name="cpap" size={20} />
            </div>
            <div className="intent-card-body">
              <h2>I already use CPAP</h2>
              <p>
                Mask choices, common first-month problems, cleaning, and how
                to read what your machine is telling you.
              </p>
              <span className="intent-card-cta">
                Get practical help <Icon name="arrow-right" size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Reassurance ─── */}
      <section className="reassurance">
        <p className="reassurance-quote">You&apos;re not alone.</p>
        <p className="reassurance-body">
          Millions of people use CPAP every night. The first weeks are hard.
          The numbers can be confusing. A Quiet Night explains it all calmly,
          in plain English — without pretending to be your doctor.
        </p>
      </section>

      <div className="app-content">
        {/* ─── Three lanes ─── */}
        <SectionHeader
          title="Three paths through the site."
          subtitle="Read at your own pace. Nothing is gated. No account required."
        />
        <div className="lanes-grid">
          <Lane
            accent="var(--accent-blue)"
            eyebrow="Learn"
            title="Understanding sleep apnoea"
            bullets={[
              "What sleep apnoea actually is",
              "Common symptoms",
              "How diagnosis works",
              "What AHI means",
            ]}
            to="/learn"
            cta="Open the Learn section"
          />
          <Lane
            accent="var(--accent-peach)"
            eyebrow="CPAP Therapy"
            title="Getting on with the machine"
            bullets={[
              "Your first night with CPAP",
              "Choosing a mask",
              "Common first-month problems",
              "What good therapy looks like",
            ]}
            to="/cpap-therapy"
            cta="Open CPAP Therapy"
          />
          <Lane
            accent="var(--success)"
            eyebrow="My Data"
            title="Optional — only if you want to"
            bullets={[
              "Upload an OSCAR export or SD-card ZIP",
              "See your trends in plain English",
              "Print a clinician-friendly PDF report",
              "Private by default — raw files deleted",
            ]}
            to="/my-data"
            cta="Open the optional tool"
            quiet
          />
        </div>

        {/* ─── Why this exists ─── */}
        <SectionHeader
          title="Why this site exists"
          subtitle="Most CPAP information is either too clinical or too commercial. We sit in the middle."
        />
        <div className="grid grid-3">
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="leaf" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Plain English first</h3>
            <p className="muted" style={{ margin: 0 }}>
              No jargon. We explain what AHI, leak rate and pressure actually
              mean, and what they don&apos;t mean.
            </p>
          </Card>
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="info" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Educational, not diagnostic</h3>
            <p className="muted" style={{ margin: 0 }}>
              We don&apos;t diagnose, prescribe, or suggest pressure
              changes — those decisions belong with your sleep clinician.
            </p>
          </Card>
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="download" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Private by default</h3>
            <p className="muted" style={{ margin: 0 }}>
              No accounts. If you upload data, the raw file is deleted after
              parsing. Only per-night summary numbers are kept.
            </p>
          </Card>
        </div>

        {/* ─── FAQ ─── */}
        <SectionHeader title="Common questions" />
        <div className="stack-3">
          <Accordion title="Is A Quiet Night medical advice?">
            <p>No. It&apos;s an educational tool. We don&apos;t diagnose, prescribe, or recommend pressure changes. Therapy decisions belong with a qualified sleep clinician.</p>
          </Accordion>
          <Accordion title="I just got a CPAP — where should I start?">
            <p>The <Link to="/cpap-therapy">CPAP Therapy section</Link> is built for the first few weeks: choosing a mask, common problems, and what good therapy looks like.</p>
          </Accordion>
          <Accordion title="I think I might have sleep apnoea — what now?">
            <p>The <Link to="/learn">Learn section</Link> covers what sleep apnoea is, the common symptoms, and how to start the conversation with your GP. We can&apos;t diagnose you — only a clinician can — but we can help you ask the right questions.</p>
          </Accordion>
          <Accordion title="Do I need an account?">
            <p>No. The site works without one. If you upload data, the dashboard is keyed by upload ID and stored only as derived summary numbers.</p>
          </Accordion>
          <Accordion title="Is it really free?">
            <p>Yes. We plan to add optional affiliate links in the future, clearly disclosed and separate from medical content. For now, it&apos;s simply a passion project.</p>
          </Accordion>
          <Accordion title="What if my CPAP isn't ResMed?">
            <p>The OSCAR CSV/HTML export path is the most reliable today. Manufacturer-specific binary parsers (ResMed, Philips, Fisher &amp; Paykel) are in the pipeline; the site will tell you clearly if your format isn&apos;t yet supported.</p>
          </Accordion>
        </div>
      </div>
    </>
  );
}

// ─── A single lane card on the homepage ───
interface LaneProps {
  accent: string;
  eyebrow: string;
  title: string;
  bullets: string[];
  to: string;
  cta: string;
  /** Render with reduced visual emphasis. Used for "My Data" so it doesn't
   *  push first-time visitors toward upload. */
  quiet?: boolean;
}

function Lane({ accent, eyebrow, title, bullets, to, cta, quiet }: LaneProps) {
  return (
    <article className={`lane ${quiet ? "lane-quiet" : ""}`}>
      <span
        className="lane-accent"
        aria-hidden="true"
        style={{ background: accent }}
      />
      <span className="eyebrow" style={{ color: "var(--text-muted)" }}>{eyebrow}</span>
      <h3>{title}</h3>
      <ul className="lane-bullets">
        {bullets.map(b => (
          <li key={b}>
            <span className="lane-dot" style={{ background: accent }} aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
      <Link to={to} className="lane-cta">
        {cta} <Icon name="arrow-right" size={14} />
      </Link>
    </article>
  );
}
