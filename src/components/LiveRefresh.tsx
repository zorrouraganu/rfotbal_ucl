"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15_000;

export function LiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const timer = window.setTimeout(() => router.refresh(), 360);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  useEffect(() => {
    function refresh() {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    }

    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return (
    <div className="live-refresh" title="Actualizare automată activă">
      <span aria-hidden="true" />
      <small>Live</small>
    </div>
  );
}
