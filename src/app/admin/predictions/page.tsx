import { AdminFrame } from "@/components/AdminFrame";
import { TeamCrest } from "@/components/TeamCrest";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { marketLabel, scorePrediction } from "@/lib/scoring";

export default async function AdminPredictionsPage() {
  const admin = await requireAdmin();
  const predictions = await prisma.prediction.findMany({
    include: {
      player: true,
      qualifyingTeam: true,
      match: { include: { homeTeam: true, awayTeam: true, tie: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
  return (
    <AdminFrame player={admin}>
      <section className="admin-title"><div><p className="eyebrow">AUDIT</p><h1>Predicții</h1></div><span>{predictions.length} selecții recente</span></section>
      <div className="table-scroll panel-table">
        <table className="audit-table">
          <thead><tr><th>Jucător</th><th>Meci</th><th>Piață</th><th>Calificată / câștigătoare</th><th>Rezultat</th><th>Puncte</th></tr></thead>
          <tbody>{predictions.map((prediction) => {
            const score = scorePrediction({
              selection: prediction.selection,
              qualifyingTeamId: prediction.qualifyingTeamId,
              homeScore90: prediction.match.homeScore90,
              awayScore90: prediction.match.awayScore90,
              leg: prediction.match.leg,
              qualifiedTeamId: prediction.match.tie?.qualifiedTeamId ?? null,
              resultFinalized: Boolean(prediction.match.resultFinalizedAt),
            });
            return <tr key={prediction.id}>
              <td><strong>u/{prediction.player.redditUsername}</strong>{prediction.player.nickname && <small>{prediction.player.nickname}</small>}</td>
              <td><div className="audit-match"><TeamCrest {...prediction.match.homeTeam} size={24} />{prediction.match.homeTeam.abbreviation}–{prediction.match.awayTeam.abbreviation}<TeamCrest {...prediction.match.awayTeam} size={24} /></div></td>
              <td><span className="market-badge">{marketLabel(prediction.selection)}</span></td>
              <td>{prediction.qualifyingTeam?.shortName ?? "—"}</td>
              <td>{prediction.match.resultFinalizedAt ? `${prediction.match.homeScore90}–${prediction.match.awayScore90}` : "În așteptare"}</td>
              <td><strong>{prediction.match.resultFinalizedAt ? `${score.totalPoints}p` : "—"}</strong></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </AdminFrame>
  );
}
