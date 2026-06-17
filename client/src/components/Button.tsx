import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

// Unified button + anchor + Link primitive. Picks the right element based
// on whether `href` (external/anchor) or `to` (router link) is passed,
// and shares the same `.btn` class structure for consistent styling.

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: undefined; href?: undefined;
};
type AsLink = CommonProps & {
  to: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;
type AsAnchor = CommonProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = AsButton | AsLink | AsAnchor;

function classes(variant: Variant = "primary", size: Size = "md", fullWidth?: boolean, extra?: string) {
  return [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    fullWidth ? "w-full" : "",
    extra ?? "",
  ].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", iconLeft, iconRight, fullWidth, className, children } = props;
  const cls = classes(variant, size, fullWidth, className);
  const inner = (
    <>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </>
  );
  if ("to" in props && props.to) {
    const { to, ...rest } = props;
    return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  }
  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    return <a href={href} className={cls} {...rest}>{inner}</a>;
  }
  const { type = "button", ...rest } = props as AsButton;
  return <button type={type} {...rest} className={cls}>{inner}</button>;
}
