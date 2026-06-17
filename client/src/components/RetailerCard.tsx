import { useState } from "react";
import type { Retailer } from "../api";
import { Icon } from "./Icon";

// A retailer affiliate card modelled on the directory-style format
// (rank, score, wordmark, highlight, key terms, primary CTA, secondary
// disclosure, footer disclaimer) — but redrawn in the A Quiet Night
// palette and type system. No fake clinical claims. Affiliate disclosure
// is always visible.

export function RetailerCard({ retailer }: { retailer: Retailer }) {
  const [open, setOpen] = useState(false);
  const accent = retailer.accentColour;

  // Split terms into two columns so the bottom of the card has a tidy grid.
  const left = retailer.terms.slice(0, 2);
  const right = retailer.terms.slice(2, 4);

  return (
    <article className="retailer-card">
      <header
        className="retailer-card-head"
        style={{
          // Soft tinted band — the retailer's accent colour, muted right down.
          background: `linear-gradient(180deg,
            color-mix(in srgb, ${accent} 24%, var(--surface)),
            var(--surface))`,
        }}
      >
        <div className="retailer-card-rank" style={{ background: accent }}>
          {retailer.rank}
        </div>
        {retailer.score ? <ScorePill score={retailer.score} /> : null}

        <div className="retailer-card-brand">
          {retailer.logoUrl ? (
            <img src={retailer.logoUrl} alt={retailer.name} />
          ) : (
            <div className="retailer-card-wordmark">{retailer.name}</div>
          )}
          <p className="retailer-card-tagline">{retailer.tagline}</p>
        </div>
      </header>

      <div className="retailer-card-body">
        <div className="retailer-card-highlight" style={{ borderColor: accent }}>
          <Icon name="leaf" size={14} />
          <span>{retailer.highlight}</span>
        </div>

        <dl className="retailer-card-terms">
          <div>
            {left.map(t => (
              <div key={t.label}>
                <dt>{t.label}</dt>
                <dd>{t.value}</dd>
              </div>
            ))}
          </div>
          <div>
            {right.map(t => (
              <div key={t.label}>
                <dt>{t.label}</dt>
                <dd>{t.value}</dd>
              </div>
            ))}
          </div>
        </dl>

        <a
          className="btn btn-primary retailer-card-cta"
          href={retailer.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Visit store
          <Icon name="external" size={14} />
        </a>

        <button
          type="button"
          className="btn btn-ghost retailer-card-disclosure"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? "Hide notes" : "Why we like them"}
          <Icon name={open ? "chevron-down" : "chevron-right"} size={14} />
        </button>

        {open ? (
          <div className="retailer-card-notes">
            <ul>
              {retailer.whyWeLikeThem.map(t => <li key={t}>{t}</li>)}
            </ul>
            {retailer.badge ? (
              <p className="retailer-card-badge">
                <span className="dot" style={{ background: accent }} />
                {retailer.badge}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="retailer-card-foot">
        Affiliate link · Not medical advice — discuss therapy with your clinician.
      </footer>
    </article>
  );
}

function ScorePill({ score }: { score: { value: number; outOf: number } }) {
  // 4.5 / 5 displayed with a small star icon. We avoid arbitrary point
  // scores (e.g. 67/100) because they imply false precision.
  const stars = Math.round(score.value * 2) / 2; // 0.5 increments
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;
  return (
    <div className="retailer-card-score" aria-label={`Rating ${score.value} out of ${score.outOf}`}>
      <span className="retailer-card-score-stars" aria-hidden="true">
        {Array.from({ length: fullStars }).map((_, i) => <span key={`f${i}`}>★</span>)}
        {hasHalf ? <span style={{ opacity: 0.55 }}>★</span> : null}
      </span>
      <span className="retailer-card-score-value">{score.value.toFixed(1)}</span>
    </div>
  );
}
