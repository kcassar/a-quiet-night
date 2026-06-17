import { useEffect } from "react";

// Tiny no-dependency replacement for react-helmet. Sets the document title,
// meta description and canonical URL per page so each route looks right when
// shared on social, in browser tabs and in search results. Modern crawlers
// (Googlebot, Bingbot) execute JS, so this updates what they see for the
// route too.
//
// Pass a `path` matching the route (e.g. "/learn") so the canonical URL
// stays in sync if the user lands on a deep link.
export function useDocumentMeta(opts: {
  title: string;
  description?: string;
  path?: string;
}) {
  useEffect(() => {
    const fullTitle = `${opts.title} · A Quiet Night`;
    document.title = fullTitle;

    if (opts.description) {
      setMeta("name", "description", opts.description);
      setMeta("property", "og:description", opts.description);
      setMeta("name", "twitter:description", opts.description);
    }
    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);

    const path = opts.path ?? window.location.pathname;
    const url = `https://www.aquietnight.com${path === "/" ? "/" : path}`;
    setMeta("property", "og:url", url);
    setLinkRel("canonical", url);
  }, [opts.title, opts.description, opts.path]);
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkRel(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
