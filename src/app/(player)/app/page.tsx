import type { CompetitionStage } from "@prisma/client";
import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { PageTransition } from "@/components/PageTransition";
import { requirePlayer } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { stageLabels, stageOrder } from "@/lib/stages";

export const metadata = { title: "Predicții" };

export default async function PredictionsPage({ searchParams }: {
  searchParams: Promise<{ stage?: string; matchday?: string }>;
}) {
  const player = await requirePlayer();
  const params = await searchParams;
  const competition = await prisma.competition.findFirst({ where: { isActive: true } });
  if (!competition) return <PageTransition><div className="empty-state"><h1>Competiția nu este configurată</h1></div></PageTransition>;

  const stageCounts = await prisma.match.groupBy({
    by: ["stage"],
    where: { competitionId: competition.id, visibleToPlayers: true },
    _count: true,
  });
  const availableStages = stageOrder.filter((stage) => stageCounts.some((entry) => entry.stage === stage));
  const requestedStage = params.stage as CompetitionStage | undefined;
  const selectedStage = requestedStage && availableStages.includes(requestedStage)
    ? requestedStage
    : availableStages.at(-1) ?? "LEAGUE_PHASE";

  let matchday: number | undefined;
  if (selectedStage === "LEAGUE_PHASE") {
    const firstOpen = await prisma.match.findFirst({
      where: { competitionId: competition.id, stage: "LEAGUE_PHASE", resultFinalizedAt: null },
      orderBy: { matchday: "asc" },
      select: { matchday: true },
    });
    const parsed = Number(params.matchday);
    matchday = Number.isInteger(parsed) && parsed >= 1 && parsed <= 8 ? parsed : firstOpen?.matchday ?? 8;
  }

  const matches = await prisma.match.findMany({
    where: {
      competitionId: competition.id,
      visibleToPlayers: true,
      stage: selectedStage,
      ...(matchday ? { matchday } : {}),
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tie: { include: { firstTeam: true, secondTeam: true } },
      predictions: {
        where: { playerId: player.id },
        include: { qualifyingTeam: { select: { publicId: true } } },
      },
    },
    orderBy: [{ kickoffUtc: "asc" }, { label: "asc" }],
  });
  const saved = matches.filter((match) => match.predictions.length > 0).length;
  const remaining = matches.length - saved;
  const completion = matches.length ? Math.round((saved / matches.length) * 100) : 0;

  return (
    <PageTransition>
      <section className="hero compact-hero">
        <h1>Predicții</h1>
      </section>
      <nav className="chip-nav" aria-label="Faza competiției">
        {availableStages.map((stage) => <Link key={stage} href={`/app?stage=${stage}`} className={stage === selectedStage ? "active" : ""}>{stageLabels[stage]}</Link>)}
      </nav>
      {selectedStage === "LEAGUE_PHASE" && (
        <nav className="matchday-nav" aria-label="Etapa fazei ligii">
          {Array.from({ length: 8 }, (_, index) => index + 1).map((day) => (
            <Link key={day} href={`/app?stage=LEAGUE_PHASE&matchday=${day}`} className={day === matchday ? "active" : ""}>{day}</Link>
          ))}
        </nav>
      )}
      <div className="section-heading match-list-heading"><h2>{matchday ? `Etapa ${matchday}` : stageLabels[selectedStage]}</h2><span>{saved}/{matches.length} salvate</span></div>
      {!!matches.length && (
        <section className={`prediction-progress ${remaining ? "is-incomplete" : "is-complete"}`} aria-label="Progresul predicțiilor">
          <div className="prediction-progress-copy">
            <span className="prediction-progress-icon" aria-hidden="true">{remaining ? "!" : "✓"}</span>
            <div>
              <strong>{remaining
                ? `${remaining} ${remaining === 1 ? "predicție rămasă" : "predicții rămase"}`
                : "Toate predicțiile sunt salvate"}</strong>
            </div>
            <b>{completion}%</b>
          </div>
          <div className="prediction-progress-track" aria-hidden="true"><span style={{ width: `${completion}%` }} /></div>
        </section>
      )}
      <section className="match-grid">
        {matches.map((match, index) => <MatchCard key={match.id} match={match} eager={index < 2} />)}
      </section>
      {!matches.length && <div className="empty-state"><h2>Niciun meci</h2></div>}
    </PageTransition>
  );
}
