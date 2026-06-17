import { useEffect, useState } from "react";

// Thin progress bar fixed to the top of the viewport that tracks how far
// the user has scrolled through the article.
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function update() {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight - h.clientHeight;
      setPct(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="read-progress" aria-hidden="true">
      <div className="read-progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
