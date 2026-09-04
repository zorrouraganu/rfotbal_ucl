"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15_000;

export function LiveRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    lastRefreshAt.current = Date.now();
    function refresh() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (document.querySelector("form:focus-within")) return;

      const run = () => {
        router.refresh();
        lastRefreshAt.current = Date.now();
      };
      if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 1_200 });
      else setTimeout(run, 0);
    }

    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const refreshIfStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefreshAt.current >= REFRESH_INTERVAL_MS) refresh();
    };
    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("online", refreshIfStale);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("online", refreshIfStale);
    };
  }, [router]);

  return (
    <div className="live-refresh" title="Actualizare automată activă">
      <span aria-hidden="true" />
      <small>Live</small>
    </div>
  );
}
