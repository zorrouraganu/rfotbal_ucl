"use client";

import { BarChart3, CircleUserRound, ListChecks, TableProperties } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, ViewTransition } from "react";

const items = [
  { href: "/account", label: "Cont", icon: CircleUserRound },
  { href: "/app", label: "Predicții", icon: ListChecks },
  { href: "/standings", label: "Clasament UCL", icon: TableProperties },
  { href: "/leaderboard", label: "Jucători", icon: BarChart3 },
];

export function PlayerNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const warmRoutes = () => items.forEach(({ href }) => router.prefetch(href));
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmRoutes, { timeout: 900 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = setTimeout(warmRoutes, 250);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <nav className="bottom-nav" aria-label="Navigație jucător">
      <div className="bottom-nav-inner">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              transitionTypes={["player-tab"]}
              className={active ? "active" : ""}
            >
              {active && (
                <ViewTransition name="player-nav-highlight">
                  <span className="nav-highlight" aria-hidden="true" />
                </ViewTransition>
              )}
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
