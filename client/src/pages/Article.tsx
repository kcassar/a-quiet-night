import { useParams } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { ArticleLayout } from "../components/ArticleLayout";
import { getArticleBySlug } from "../content/articles";
import { NotFound } from "./NotFound";

// Single article page. The slug is read from the URL, looked up in the
// content registry, and rendered with the shared ArticleLayout. Adding a
// new article is a content-file change only — this route is unchanged.

export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const mod = slug ? getArticleBySlug(slug) : undefined;

  useDocumentMeta({
    title: mod ? `${mod.meta.title} | A Quiet Night` : "Article not found",
    description: mod?.meta.description,
    path: mod ? `/articles/${mod.meta.slug}` : undefined,
  });

  if (!mod) return <NotFound />;

  const Body = mod.default;
  return (
    <ArticleLayout meta={mod.meta}>
      <Body />
    </ArticleLayout>
  );
}
