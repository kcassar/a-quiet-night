import { Link } from "react-router-dom";
import type { ArticleMeta } from "../content/articles/types";
import { Icon } from "./Icon";

// Card used on the Articles hub and (optionally) in "Related reading"
// blocks at the foot of an article. Keep it calm and editorial — no
// "click to read more!" pressure.

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link to={`/articles/${article.slug}`} className="article-card">
      <div className="article-card-meta">
        <span className="chip neutral">{article.category}</span>
        <span className="article-card-read">
          {article.readingMinutes} min read
        </span>
      </div>
      <h3 className="article-card-title">{article.title}</h3>
      <p className="article-card-summary">{article.summary}</p>
      <div className="article-card-foot">
        <span>{formatDate(article.publishedAt)}</span>
        <span className="article-card-arrow">
          Read <Icon name="arrow-right" size={14} />
        </span>
      </div>
    </Link>
  );
}
