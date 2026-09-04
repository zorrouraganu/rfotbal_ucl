"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15_000;

export function LiveRefresh() {
  const router = useRouter();
  const version = useRef<string | null>(null);
  const lastCheckAt = useRef(0);
  const checking = useRef(false);

  useEffect(() => {
    let disposed = false;

    async function checkForUpdates() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (document.querySelector("form:focus-within")) return;
      if (document.documentElement.dataset.playerNavigating === "true") return;
      if (checking.current) return;

      checking.current = true;
      try {
        const response = await fetch("/api/live-version", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok || disposed) return;
        const data = await response.json() as { version?: string };
        if (!data.version) return;
        lastCheckAt.current = Date.now();

        if (version.current === null) {
          version.current = data.version;
          return;
        }
        if (version.current === data.version) return;

        const refreshChangedContent = () => {
          if (disposed || document.documentElement.dataset.playerNavigating === "true") return;
          if (document.querySelector("form:focus-within")) return;
          version.current = data.version ?? version.current;
          router.refresh();
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(refreshChangedContent, { timeout: 1_200 });
        else setTimeout(refreshChangedContent, 0);
      } catch {
        // A transient network failure should never disturb the current screen.
      } finally {
        checking.current = false;
      }
    }

    void checkForUpdates();
    const timer = window.setInterval(checkForUpdates, REFRESH_INTERVAL_MS);
    const checkIfStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheckAt.current >= REFRESH_INTERVAL_MS) {
        void checkForUpdates();
      }
    };
    document.addEventListener("visibilitychange", checkIfStale);
    window.addEventListener("online", checkIfStale);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", checkIfStale);
      window.removeEventListener("online", checkIfStale);
    };
  }, [router]);

  return (
    <div className="live-refresh" title="Actualizare automată activă">
      <span aria-hidden="true" />
      <small>Live</small>
    </div>
  );
}
