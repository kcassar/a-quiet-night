// Tiny inline SVG icon set. Strokes use currentColor so they recolour with
// the surrounding text. No icon library — keeps the bundle small and the
// icons consistent in weight (1.6px stroke, 24×24 viewport).

import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export type IconName =
  | "dashboard" | "upload" | "learn" | "cpap" | "products" | "resources"
  | "about" | "menu" | "close" | "sun" | "moon" | "chevron-right"
  | "chevron-down" | "spark" | "info" | "check" | "download" | "print"
  | "search" | "calendar" | "leaf" | "external" | "arrow-right" | "filter";

export function Icon({ name, className, size = 18, "aria-label": ariaLabel, "aria-hidden": ariaHidden }: {
  name: IconName;
  className?: string;
  size?: number;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  // If an aria-label is provided, the icon conveys meaning and should be
  // announced. Otherwise, mark it as decorative (aria-hidden="true").
  const isDecorative = !ariaLabel && ariaHidden !== false;
  const props = {
    ...base,
    width: size,
    height: size,
    className: `ico ${className ?? ""}`,
    "aria-hidden": isDecorative ? true : undefined,
    "aria-label": ariaLabel,
    role: ariaLabel ? "img" : undefined,
  };
  switch (name) {
    case "dashboard": return (
      <svg {...props}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>
    );
    case "upload": return (
      <svg {...props}><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
    );
    case "learn": return (
      <svg {...props}><path d="M2 5a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2Z" /><path d="M22 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2Z" /></svg>
    );
    case "cpap": return (
      <svg {...props}><path d="M4 14a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3H4Z" /><path d="M8 10V7a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v3" /><path d="M2 17h20" /></svg>
    );
    case "products": return (
      <svg {...props}><path d="M3 7h18l-1.5 12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2Z" /><path d="M8 7V5a4 4 0 0 1 8 0v2" /></svg>
    );
    case "resources": return (
      <svg {...props}><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4Z" /><path d="M14 4v6h6" /><path d="M8 13h8M8 17h6" /></svg>
    );
    case "about": return (
      <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8v.01M11 12h1v5h1" /></svg>
    );
    case "menu": return (
      <svg {...props}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
    );
    case "close": return (
      <svg {...props}><path d="M18 6 6 18M6 6l12 12" /></svg>
    );
    case "sun": return (
      <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></svg>
    );
    case "moon": return (
      <svg {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
    );
    case "chevron-right": return (
      <svg {...props}><path d="m9 6 6 6-6 6" /></svg>
    );
    case "chevron-down": return (
      <svg {...props}><path d="m6 9 6 6 6-6" /></svg>
    );
    case "spark": return (
      <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" /></svg>
    );
    case "info": return (
      <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg>
    );
    case "check": return (
      <svg {...props}><path d="M5 12.5 10 17l9-10" /></svg>
    );
    case "download": return (
      <svg {...props}><path d="M12 4v12" /><path d="m6 10 6 6 6-6" /><path d="M4 20h16" /></svg>
    );
    case "print": return (
      <svg {...props}><path d="M6 9V4h12v5" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v6H6Z" /></svg>
    );
    case "search": return (
      <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
    );
    case "calendar": return (
      <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
    );
    case "leaf": return (
      <svg {...props}><path d="M4 20s8-1 12-5 4-11 4-11-7 0-11 4-5 12-5 12Z" /><path d="M4 20 14 10" /></svg>
    );
    case "external": return (
      <svg {...props}><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></svg>
    );
    case "arrow-right": return (
      <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    );
    case "filter": return (
      <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4Z" /></svg>
    );
  }
}
