import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ArticleMeta } from "../content/articles/types";
import { TableOfContents } from "./TableOfContents";
import { ReadingProgress } from "./ReadingProgress";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { ArticleCard } from "./ArticleCard";
import { Icon } from "./Icon";
import { relatedArticles } from "../content/articles";

// Editorial shell for a single article. Renders the breadcrumb,
// metadata header, optional TOC sidebar, article body, and a calm
// "related reading" footer.

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export function ArticleLayout({
  meta, children,
}: {
  meta: ArticleMeta;
  children: ReactNode;
}) {
  const related = relatedArticles(meta.slug, { limit: 3 });

  return (
    <>
      <ReadingProgress />
      <div className="app-content article-page">
        {/* Breadcrumb back to hub — gives readers an obvious way out. */}
        <p className="article-breadcrumb">
          <Link to="/articles">
            <Icon name="arrow-right" size={12} className="ico-flip" /> All articles
          </Link>
        </p>

        {/* Article header */}
        <header className="article-header">
          <span className="eyebrow">{meta.category}</span>
          <h1>{meta.title}</h1>
          <p className="lede">{meta.summary}</p>
          <div className="article-meta-row">
            <span>Published {formatDate(meta.publishedAt)}</span>
            {meta.updatedAt ? <span>· Updated {formatDate(meta.updatedAt)}</span> : null}
            <span>· {meta.readingMinutes} min read</span>
          </div>
        </header>

        <DisclaimerBanner />

        {/* Body + optional TOC */}
        {meta.toc && meta.toc.length ? (
          <div className="with-toc">
            <TableOfContents items={meta.toc} />
            <article className="article">{children}</article>
          </div>
        ) : (
          <article className="article">{children}</article>
        )}

        {/* Tags row, calmly stated */}
        {meta.tags.length ? (
          <div className="article-tags">
            {meta.tags.map(t => <span key={t} className="chip neutral" style={{ textTransform: "capitalize" }}>{t}</span>)}
          </div>
        ) : null}

        {/* Related reading */}
        {related.length > 0 ? (
          <section className="article-related">
            <h2>Keep reading</h2>
            <div className="grid grid-3">
              {related.map(r => <ArticleCard key={r.slug} article={r} />)}
            </div>
          </section>
        ) : null}

        <p className="article-footer-back">
          <Link to="/articles">Browse all articles</Link>
        </p>
      </div>
    </>
  );
}
