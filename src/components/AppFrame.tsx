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
          <Link href="/account" aria-label="UCL r/fotbal"><BrandMark /></Link>
          <PlayerNav />
          <div className="topbar-actions">
            <LiveRefresh />
            <a
              className="subreddit-link"
              href="https://www.reddit.com/r/fotbal/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Deschide r/fotbal pe Reddit"
            >
              <RedditSnooIcon />
              <span>r/fotbal</span>
            </a>
            {isAdminUsername(player.redditUsername) && <Link className="admin-link" href="/admin">Admin</Link>}
            <Link className="reddit-id" href="/account">u/{player.redditUsername}</Link>
            <form action="/api/auth/logout" method="post"><button className="text-button" type="submit">Ieșire</button></form>
          </div>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="site-footer"><span>UCL r/fotbal</span><span>Rezultate live prin ESPN</span></footer>
    </div>
  );
}

function RedditSnooIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 10.2c-1.9.2-3.3 1.5-3.3 3.2 0 2.9 3.6 5.2 8.1 5.2s8.1-2.3 8.1-5.2c0-1.7-1.4-3-3.3-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.1 10.5c1.1-.4 2.4-.6 3.9-.6s2.8.2 3.9.6M9 15.6c.8.6 1.8.9 3 .9s2.2-.3 3-.9M12.8 9.8l.9-4 3.4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18.4" cy="6.8" r="1.45" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.5" cy="13.2" r=".9" fill="currentColor" />
      <circle cx="15.5" cy="13.2" r=".9" fill="currentColor" />
      <path d="M4.2 11.2c-1-.7-1.1-2-.3-2.7.8-.7 2.1-.5 2.8.4M19.8 11.2c1-.7 1.1-2 .3-2.7-.8-.7-2.1-.5-2.8.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
