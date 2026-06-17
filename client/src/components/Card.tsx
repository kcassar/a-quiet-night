import type { HTMLAttributes, ReactNode } from "react";

// Standard surface for content. Variants control density and elevation.
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  elevated?: boolean;
  hoverPop?: boolean;
  flush?: boolean;
  children?: ReactNode;
}

export function Card({ compact, elevated, hoverPop, flush, className, children, ...rest }: CardProps) {
  const cls = [
    "card",
    compact ? "compact" : "",
    elevated ? "elevated" : "",
    hoverPop ? "hover-pop" : "",
    flush ? "flush" : "",
    className ?? "",
  ].filter(Boolean).join(" ");
  return <div {...rest} className={cls}>{children}</div>;
}
