import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PageTransition } from "@/components/PageTransition";
import { requirePlayer } from "@/lib/auth-server";
import { hasEliminationPhaseStarted } from "@/lib/competitionPhase";
import { loadLeaderboard } from "@/lib/leaderboard";

export const metadata = { title: "Clasament jucători" };

export default async function LeaderboardPage() {
  const player = await requirePlayer();
  const [entries, showQualifierStats] = await Promise.all([
    loadLeaderboard(),
    hasEliminationPhaseStarted(),
  ]);
  return (
    <PageTransition>
      <section className="hero compact-hero"><h1>Clasament jucători</h1></section>
      <LeaderboardTable entries={entries} currentPlayerId={player.id} showQualifierStats={showQualifierStats} />
    </PageTransition>
  );
}
