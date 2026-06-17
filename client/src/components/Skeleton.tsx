// Lightweight loading skeletons. Pure CSS animation; hidden when the user
// prefers reduced motion (handled in global.css).

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="skel skel-line" style={{ width }} />;
}

export function SkeletonBlock({ height = 96 }: { height?: number }) {
  return <div className="skel" style={{ height }} />;
}

export function MetricSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="metric">
          <div className="skel skel-line" style={{ width: "40%" }} />
          <div className="skel" style={{ height: 38, marginTop: 12, width: "70%" }} />
          <div className="skel skel-line" style={{ marginTop: 14, width: "60%" }} />
        </div>
      ))}
    </div>
  );
}
