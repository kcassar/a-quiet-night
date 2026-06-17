// Central registry for the Articles section.
//
// To add a new article:
//   1. Create a sibling .tsx file exporting `meta` + a default component.
//   2. Import it here and push it into MODULES.
//
// No route changes needed — /articles and /articles/:slug both consume
// this registry.

import type { ArticleCategory, ArticleMeta, ArticleModule } from "./types";

import * as acceptingDiagnosis from "./accepting-sleep-apnoea-diagnosis";

const MODULES: ArticleModule[] = [
  acceptingDiagnosis as unknown as ArticleModule,
];

/** Sorted newest-first; useful default order for the hub. */
export function listArticles(): ArticleMeta[] {
  return MODULES
    .map(m => m.meta)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function listByCategory(category: ArticleCategory): ArticleMeta[] {
  return listArticles().filter(a => a.category === category);
}

export function listCategories(): ArticleCategory[] {
  const seen = new Set<ArticleCategory>();
  for (const a of listArticles()) seen.add(a.category);
  return Array.from(seen);
}

export function getArticleBySlug(slug: string): ArticleModule | undefined {
  return MODULES.find(m => m.meta.slug === slug);
}

/** Articles other than the current one, optionally filtered to the same
 *  category, used for the "related reading" block at the bottom of a page. */
export function relatedArticles(
  currentSlug: string,
  opts: { sameCategoryOnly?: boolean; limit?: number } = {}
): ArticleMeta[] {
  const current = getArticleBySlug(currentSlug)?.meta;
  let pool = listArticles().filter(a => a.slug !== currentSlug);
  if (opts.sameCategoryOnly && current) {
    pool = pool.filter(a => a.category === current.category);
  }
  return pool.slice(0, opts.limit ?? 3);
}

export type { ArticleCategory, ArticleMeta, ArticleModule } from "./types";
