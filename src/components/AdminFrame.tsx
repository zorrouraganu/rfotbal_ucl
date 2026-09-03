import Link from "next/link";
import type { Player } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { BrandMark } from "@/components/BrandMark";
import { LiveRefresh } from "@/components/LiveRefresh";

export function AdminFrame({ player, children }: { player: Player; children: React.ReactNode }) {
  return (
    <div className="admin-frame shell">
      <header className="admin-header">
        <Link href="/admin"><BrandMark /></Link>
        <div><LiveRefresh /><span>u/{player.redditUsername}</span><Link href="/account" className="button button-secondary">Aplicație</Link></div>
      </header>
      <AdminNav />
      <main className="admin-content">{children}</main>
    </div>
  );
}
