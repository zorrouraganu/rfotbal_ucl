import { PageTransition } from "@/components/PageTransition";
import { ProfileForm } from "@/components/ProfileForm";
import { loadLeaderboard } from "@/lib/leaderboard";
import { requirePlayer } from "@/lib/auth-server";
import { hasEliminationPhaseStarted } from "@/lib/competitionPhase";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Cont" };

export default async function AccountPage() {
  const player = await requirePlayer();
  const [leaderboard, predictionCount, showQualifierStats] = await Promise.all([
    loadLeaderboard(),
    prisma.prediction.count({ where: { playerId: player.id } }),
    hasEliminationPhaseStarted(),
  ]);
  const own = leaderboard.find((entry) => entry.playerId === player.id);
  return (
    <PageTransition>
      <section className="hero account-hero">
        <h1>u/{player.redditUsername}</h1>
        {player.nickname && <p className="nickname">{player.nickname}</p>}
      </section>
      <section className="stat-grid">
        <article className="stat-card accent"><span>Total</span><strong>{own?.points ?? 0}</strong><small>puncte</small></article>
        <article className="stat-card"><span>Poziție</span><strong>#{own?.rank ?? "–"}</strong><small>din {leaderboard.length} jucători</small></article>
        <article className="stat-card"><span>Predicții</span><strong>{predictionCount}</strong><small>salvate</small></article>
        {showQualifierStats && <article className="stat-card"><span>Calificări / trofeu</span><strong>{own?.correctQualifiers ?? 0}</strong><small>corecte</small></article>}
      </section>
      <section className="panel section-card"><div className="section-heading"><h2>Porecla ta</h2></div><ProfileForm nickname={player.nickname} /></section>
    </PageTransition>
  );
}
