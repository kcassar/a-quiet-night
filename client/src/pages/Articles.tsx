import { useMemo, useState } from "react";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ArticleCard } from "../components/ArticleCard";
import { listArticles, listCategories } from "../content/articles";

// Articles hub. Lightweight in this phase: a header, a category filter,
// and a grid of cards. The full Phase 6 build adds featured articles,
// category landing pages, and search.

export function Articles() {
  useDocumentMeta({
    title: "Articles — A Quiet Night",
    description:
      "Plain-English articles on sleep apnoea, CPAP therapy and life with the machine. Educational only — not medical advice.",
    path: "/articles",
  });

  const all = useMemo(() => listArticles(), []);
  const categories = useMemo(() => listCategories(), []);
  const [filter, setFilter] = useState<string>("");

  const visible = useMemo(
    () => filter ? all.filter(a => a.category === filter) : all,
    [all, filter]
  );

  return (
    <>
      <PageHeader
        title="Articles"
        subtitle="Plain-English reading on sleep apnoea, CPAP therapy, and what nobody tells you about the adjustment."
      />

      <div className="app-content">
        {/* Category filter */}
        {categories.length > 1 ? (
          <div className="article-filters" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={filter === "" ? "active" : ""}
              onClick={() => setFilter("")}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c}
                type="button"
                className={filter === c ? "active" : ""}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        {visible.length === 0 ? (
          <Card>
            <EmptyState
              icon="search"
              title="No articles match that filter."
              body="Try clearing the filter."
            />
          </Card>
        ) : (
          <div className="grid grid-3">
            {visible.map(a => <ArticleCard key={a.slug} article={a} />)}
          </div>
        )}
      </div>
    </>
  );
}
