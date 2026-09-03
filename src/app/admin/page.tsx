import Link from "next/link";
import { AdminFrame } from "@/components/AdminFrame";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const competition = await prisma.competition.findFirst({ where: { isActive: true } });
  const [players, matches, finalized, predictions, mapped] = await Promise.all([
    prisma.player.count({ where: { isActive: true } }),
    competition ? prisma.match.count({ where: { competitionId: competition.id } }) : 0,
    competition ? prisma.match.count({ where: { competitionId: competition.id, resultFinalizedAt: { not: null } } }) : 0,
    prisma.prediction.count(),
    competition ? prisma.match.count({ where: { competitionId: competition.id, externalProvider: "espn" } }) : 0,
  ]);
  return (
    <AdminFrame player={admin}>
      <section className="admin-title"><div><p className="eyebrow">CONTROL ROOM</p><h1>Dashboard</h1></div><span className="scenario-badge">LIVE</span></section>
      <section className="admin-stat-grid">
        <article><span>Jucători activi</span><strong>{players}</strong></article>
        <article><span>Meciuri</span><strong>{matches}</strong><small>{finalized} finalizate</small></article>
        <article><span>Predicții</span><strong>{predictions}</strong></article>
        <article><span>Mapări ESPN</span><strong>{mapped}</strong><small>din {matches}</small></article>
      </section>
      <section className="admin-card-grid">
        <Link href="/admin/matches" className="admin-action-card"><b>01</b><h2>Meciuri și rezultate</h2></Link>
        <Link href="/admin/predictions" className="admin-action-card"><b>02</b><h2>Audit predicții</h2></Link>
        <Link href="/admin/players" className="admin-action-card"><b>03</b><h2>Jucători Reddit</h2></Link>
        <Link href="/admin/diagnostics" className="admin-action-card accent-card"><b>API</b><h2>ESPN Debug</h2></Link>
      </section>
    </AdminFrame>
  );
}
