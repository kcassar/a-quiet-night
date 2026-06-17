import { useEffect, useState } from "react";

// Sticky article TOC. Tracks which heading is in view (via
// IntersectionObserver) and highlights the matching link. Hidden on
// narrow widths via global.css.
export interface TocItem { id: string; label: string; }

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    items.forEach(i => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="toc" aria-label="On this page">
      <h4>On this page</h4>
      <ol>
        {items.map(item => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={activeId === item.id ? "active" : ""}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
