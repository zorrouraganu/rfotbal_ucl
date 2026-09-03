import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PageTransition } from "@/components/PageTransition";
import { requirePlayer } from "@/lib/auth-server";
import { loadLeaderboard } from "@/lib/leaderboard";

export const metadata = { title: "Clasament jucători" };

export default async function LeaderboardPage() {
  const player = await requirePlayer();
  const entries = await loadLeaderboard();
  return (
    <PageTransition>
      <section className="hero compact-hero"><p className="eyebrow">CLASAMENT GENERAL</p><h1>Clasament jucători</h1></section>
      <LeaderboardTable entries={entries} currentPlayerId={player.id} />
    </PageTransition>
  );
}
