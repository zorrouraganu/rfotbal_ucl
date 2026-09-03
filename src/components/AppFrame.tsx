import Link from "next/link";
import type { Player } from "@prisma/client";
import { isAdminUsername } from "@/lib/adminIdentity";
import { BrandMark } from "@/components/BrandMark";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PlayerNav } from "@/components/PlayerNav";

export function AppFrame({ player, children }: { player: Player; children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/account" aria-label="UCL Predictions"><BrandMark /></Link>
          <PlayerNav />
          <div className="topbar-actions">
            <LiveRefresh />
            {isAdminUsername(player.redditUsername) && <Link className="admin-link" href="/admin">Admin</Link>}
            <Link className="reddit-id" href="/account">u/{player.redditUsername}</Link>
            <form action="/api/auth/logout" method="post"><button className="text-button" type="submit">Ieșire</button></form>
          </div>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="site-footer"><span>UCL Predictions · 2026–27</span><span>Rezultate live prin ESPN</span></footer>
    </div>
  );
}
