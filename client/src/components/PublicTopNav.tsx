import { useEffect, useState, useRef, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";

// Top navigation for all *public* pages (everything outside /my-data).
//
// On wide screens we render a horizontal sticky bar with the wordmark on the
// left and the section links on the right. On narrow screens the links
// collapse into a hamburger drawer.

interface NavItem {
  to: string;
  label: string;
  /** When true, the link is active for any path that starts with `to`. */
  prefix?: boolean;
}

const ITEMS: NavItem[] = [
  { to: "/learn",         label: "Learn",         prefix: true },
  { to: "/cpap-therapy",  label: "CPAP Therapy",  prefix: true },
  { to: "/my-data",       label: "My Data",       prefix: true },
  { to: "/articles",      label: "Articles",      prefix: true },
  // { to: "/products",      label: "Products" }, // Hidden until affiliate partnerships are set up
  { to: "/resources",     label: "Resources" },
  { to: "/about",         label: "About" },
];

export function PublicTopNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Handle Escape key to close the drawer
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus trap: keep focus within the drawer while it's open
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (!open || !drawerRef.current || e.key !== "Tab") return;

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [open, handleFocusTrap]);

  // Focus the first link when drawer opens
  useEffect(() => {
    if (open && drawerRef.current) {
      const firstLink = drawerRef.current.querySelector<HTMLElement>("a");
      firstLink?.focus();
    }
  }, [open]);

  return (
    <header className="public-nav">
      <div className="public-nav-inner">
        <Link to="/" className="public-nav-brand" aria-label="A Quiet Night — home">
          <img src="/aquietnight-logo.png" alt="" />
        </Link>

        <nav className="public-nav-links" aria-label="Primary">
          {ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={!item.prefix}
              // Mark "prefix" routes (e.g. /learn) active for nested pages too.
              className={({ isActive }) => {
                const active = item.prefix
                  ? pathname === item.to || pathname.startsWith(item.to + "/")
                  : isActive;
                return active ? "active" : undefined;
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="public-nav-actions">
          <ThemeToggle />
          <button
            ref={burgerRef}
            type="button"
            className="public-nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={() => setOpen(o => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div
            className="public-nav-scrim"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            className="public-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav aria-label="Mobile navigation">
              {ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={!item.prefix}
                  className={({ isActive }) => {
                    const active = item.prefix
                      ? pathname === item.to || pathname.startsWith(item.to + "/")
                      : isActive;
                    return active ? "active" : undefined;
                  }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
