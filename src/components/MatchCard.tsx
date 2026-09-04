import type { CompetitionStage, MatchLeg, MatchStatus, PredictionSelection } from "@prisma/client";
import { LocalDateTime } from "@/components/LocalDateTime";
import { PredictionForm } from "@/components/PredictionForm";
import { TeamCrest } from "@/components/TeamCrest";
import { isPredictionLocked } from "@/lib/locking";
import { marketLabel, scorePrediction } from "@/lib/scoring";

type Team = { id: string; publicId: string; name: string; shortName: string; abbreviation: string; crestUrl: string | null };

export function MatchCard({ match, eager = false }: {
  match: {
    publicId: string;
    label: string;
    stage: CompetitionStage;
    leg: MatchLeg;
    status: MatchStatus;
    kickoffUtc: Date;
    manuallyLockedAt: Date | null;
    homeScore90: number | null;
    awayScore90: number | null;
    liveHomeScore: number | null;
    liveAwayScore: number | null;
    resultFinalizedAt: Date | null;
    homeTeam: Team;
    awayTeam: Team;
    tie: { qualifiedTeamId: string | null; firstTeam: Team; secondTeam: Team } | null;
    predictions: Array<{
      selection: PredictionSelection;
      qualifyingTeamId: string | null;
      qualifyingTeam: { publicId: string } | null;
    }>;
  };
  eager?: boolean;
}) {
  const prediction = match.predictions[0] ?? null;
  const locked = isPredictionLocked(match);
  const final = Boolean(match.resultFinalizedAt);
  const score = prediction
    ? scorePrediction({
        selection: prediction.selection,
        qualifyingTeamId: prediction.qualifyingTeamId,
        homeScore90: match.homeScore90,
        awayScore90: match.awayScore90,
        leg: match.leg,
        qualifiedTeamId: match.tie?.qualifiedTeamId ?? null,
        resultFinalized: final,
      })
    : null;
  const displayHome = final ? match.homeScore90 : match.liveHomeScore;
  const displayAway = final ? match.awayScore90 : match.liveAwayScore;
  const winnerKind = match.stage === "FINAL" ? "champion" : match.leg === "SECOND" ? "qualifier" : null;

  return (
    <article className={`match-card ${prediction ? "has-prediction" : "needs-prediction"} ${final ? "is-final" : match.status === "LIVE" ? "is-live" : ""}`}>
      <div className="match-card-meta">
        <span>{match.label}</span>
        <div className="match-card-badges">
          <span className={`prediction-state ${prediction ? "is-saved" : "is-missing"}`}>
            <span aria-hidden="true">{prediction ? "✓" : "!"}</span>
            {prediction ? "Predicție salvată" : "Lipsește predicția"}
          </span>
          <span className={`status status-${match.status.toLowerCase()}`}>{statusLabel(match.status)}</span>
        </div>
      </div>
      <div className="match-teams">
        <div className="match-team home">
          <TeamCrest {...match.homeTeam} size={52} eager={eager} />
          <strong>{match.homeTeam.shortName}</strong>
        </div>
        <div className="match-score">
          {displayHome !== null && displayAway !== null ? (
            <strong>{displayHome} <span>–</span> {displayAway}</strong>
          ) : <strong className="versus">VS</strong>}
          <small><LocalDateTime value={match.kickoffUtc.toISOString()} /></small>
        </div>
        <div className="match-team away">
          <TeamCrest {...match.awayTeam} size={52} eager={eager} />
          <strong>{match.awayTeam.shortName}</strong>
        </div>
      </div>

      {!locked && (
        <PredictionForm
          matchPublicId={match.publicId}
          existingSelection={prediction?.selection ?? null}
          existingQualifierPublicId={prediction?.qualifyingTeam?.publicId ?? null}
          winnerKind={winnerKind}
          qualifierTeams={winnerKind && match.tie
            ? winnerKind === "champion"
              ? [match.homeTeam, match.awayTeam]
              : [match.tie.firstTeam, match.tie.secondTeam]
            : null}
        />
      )}

      {locked && prediction && (
        <div className="prediction-receipt">
          <span>Predicția ta</span>
          <strong>{marketLabel(prediction.selection)}</strong>
          {winnerKind && prediction.qualifyingTeamId && (
            <small>{winnerKind === "champion" ? "Câștigătoare" : "Calificată"}: {prediction.qualifyingTeamId === match.tie?.firstTeam.id
              ? match.tie.firstTeam.shortName
              : match.tie?.secondTeam.shortName}</small>
          )}
          {final && score && <b className={score.totalPoints > 0 ? "points-win" : "points-zero"}>+{score.totalPoints}p</b>}
        </div>
      )}
      {locked && !prediction && <p className="missed-pick">Fără predicție pentru acest meci.</p>}
    </article>
  );
}

function statusLabel(status: MatchStatus) {
  const labels: Record<MatchStatus, string> = {
    SCHEDULED: "Deschis",
    LOCKED: "Blocat",
    LIVE: "LIVE",
    HALF_TIME: "Pauză",
    FINAL: "Final",
    POSTPONED: "Amânat",
  };
  return labels[status];
}
