"use client";

import { BarChart3, CircleUserRound, ListChecks, TableProperties } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const items = [
  { href: "/account", label: "Cont", icon: CircleUserRound },
  { href: "/app", label: "Predicții", icon: ListChecks },
  { href: "/standings", label: "Clasament UCL", icon: TableProperties },
  { href: "/leaderboard", label: "Jucători", icon: BarChart3 },
];

export function PlayerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const [highlight, setHighlight] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const measureHighlight = useCallback(() => {
    const activeIndex = items.findIndex(({ href }) => href === pathname);
    const link = linksRef.current[activeIndex];
    if (!link) return;
    setHighlight({
      left: link.offsetLeft,
      top: link.offsetTop,
      width: link.offsetWidth,
      height: link.offsetHeight,
    });
  }, [pathname]);

  useEffect(() => {
    const warmRoutes = () => items.filter(({ href }) => href !== pathname).forEach(({ href }) => router.prefetch(href));
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmRoutes, { timeout: 900 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = setTimeout(warmRoutes, 250);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  useLayoutEffect(() => {
    measureHighlight();
    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(measureHighlight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [measureHighlight]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      delete document.documentElement.dataset.playerNavigating;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  function markNavigationStarted() {
    document.documentElement.dataset.playerNavigating = "true";
    window.setTimeout(() => {
      delete document.documentElement.dataset.playerNavigating;
    }, 2_500);
  }

  return (
    <nav className="bottom-nav" aria-label="Navigație jucător">
      <div className="bottom-nav-inner" ref={navRef}>
        <span
          className={`nav-highlight ${highlight ? "is-ready" : ""}`}
          aria-hidden="true"
          style={highlight ?? undefined}
        />
        {items.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onNavigate={markNavigationStarted}
              className={active ? "active" : ""}
              ref={(node) => { linksRef.current[index] = node; }}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
