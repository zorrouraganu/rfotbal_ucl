import { LeagueTable } from "@/components/LeagueTable";
import { PageTransition } from "@/components/PageTransition";
import { prisma } from "@/lib/prisma";
import { buildLeagueStandings } from "@/lib/standings";

export const metadata = { title: "Clasament UCL" };

export default async function StandingsPage() {
  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    include: {
      teams: true,
      matches: { where: { stage: "LEAGUE_PHASE" } },
    },
  });
  const rows = competition ? buildLeagueStandings(competition.teams, competition.matches) : [];
  return (
    <PageTransition>
      <section className="hero compact-hero"><h1>Clasament UCL</h1></section>
      <div className="zone-legend"><span className="direct">1–8 · Optimi</span><span className="playoff">9–24 · Baraj</span><span className="out">25–36 · Eliminate</span></div>
      {rows.length ? <LeagueTable rows={rows} /> : <div className="empty-state">Clasamentul va apărea după configurarea echipelor.</div>}
    </PageTransition>
  );
}
