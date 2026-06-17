// Shared types for the Articles content registry. Each article is a
// TypeScript module that exports a `meta` constant + a default React
// component. The registry in `./index.ts` lists them all so the hub and
// individual article pages can render without per-article route wiring.

import type { ComponentType } from "react";

/** Top-level category for hub filtering. Keep aligned with the IA brief. */
export type ArticleCategory =
  | "Sleep Apnoea"
  | "CPAP Problems"
  | "Product Comparisons"
  | "Lifestyle"
  | "Travel"
  | "Relationships"
  | "Side Effects"
  | "Troubleshooting";

export interface ArticleTocItem {
  /** Matches an `id` attribute on a heading inside the article body. */
  id: string;
  label: string;
}

export interface ArticleMeta {
  /** URL slug — used at /articles/:slug. Lower-case, hyphenated. */
  slug: string;
  /** Card and SEO title. */
  title: string;
  /** SEO meta description (120–160 chars ideal). */
  description: string;
  /** Slightly longer summary shown on the hub card + at the top of the article. */
  summary: string;
  category: ArticleCategory;
  /** Free-form tags for filtering and "related" lookups. */
  tags: string[];
  /** ISO date string, e.g. 2026-05-15. */
  publishedAt: string;
  /** Optional ISO date string. */
  updatedAt?: string;
  /** Estimated read time in minutes (whole number). */
  readingMinutes: number;
  /** In-page TOC; omit for very short pieces. */
  toc?: ArticleTocItem[];
  /** Flag a piece as featured on the hub. */
  featured?: boolean;
}

export interface ArticleModule {
  meta: ArticleMeta;
  default: ComponentType;
}
