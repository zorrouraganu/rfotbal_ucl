import type { CompetitionStage } from "@prisma/client";
import Link from "next/link";
import { AdminFrame } from "@/components/AdminFrame";
import { LocalDateTime } from "@/components/LocalDateTime";
import { TeamCrest } from "@/components/TeamCrest";
import { clearMatchResultAction, finalizeMatchAction, forceEspnSyncAction, saveMatchSettingsAction, toggleMatchLockAction } from "@/app/admin/matches/actions";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { legLabels, stageLabels, stageOrder } from "@/lib/stages";

export default async function AdminMatchesPage({ searchParams }: { searchParams: Promise<{ stage?: string; matchday?: string }> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const competition = await prisma.competition.findFirst({ where: { isActive: true } });
  const selectedStage = stageOrder.includes(params.stage as CompetitionStage) ? params.stage as CompetitionStage : "LEAGUE_PHASE";
  const selectedMatchday = selectedStage === "LEAGUE_PHASE" ? Math.min(8, Math.max(1, Number(params.matchday) || 1)) : undefined;
  const matches = competition ? await prisma.match.findMany({
    where: { competitionId: competition.id, stage: selectedStage, ...(selectedMatchday ? { matchday: selectedMatchday } : {}) },
    include: { homeTeam: true, awayTeam: true, tie: { include: { firstTeam: true, secondTeam: true } }, _count: { select: { predictions: true } } },
    orderBy: [{ kickoffUtc: "asc" }, { label: "asc" }],
  }) : [];
  const existingStages = competition ? (await prisma.match.findMany({ where: { competitionId: competition.id }, distinct: ["stage"], select: { stage: true } })).map((row) => row.stage) : [];
  return (
    <AdminFrame player={admin}>
      <section className="admin-title"><div><p className="eyebrow">PROGRAM & LIVE DATA</p><h1>Meciuri</h1></div><span>{matches.length} afișate</span></section>
      <nav className="chip-nav admin-chips">{stageOrder.filter((stage) => existingStages.includes(stage)).map((stage) => <Link key={stage} href={`/admin/matches?stage=${stage}`} className={stage === selectedStage ? "active" : ""}>{stageLabels[stage]}</Link>)}</nav>
      {selectedMatchday && <nav className="matchday-nav">{Array.from({ length: 8 }, (_, i) => i + 1).map((day) => <Link key={day} href={`/admin/matches?stage=LEAGUE_PHASE&matchday=${day}`} className={day === selectedMatchday ? "active" : ""}>{day}</Link>)}</nav>}
      <div className="admin-match-list">
        {matches.map((match) => (
          <article key={match.id} className="admin-match-card">
            <header><span>{legLabels[match.leg]} · {match._count.predictions} predicții</span><b>{match.status}</b></header>
            <div className="admin-match-teams"><div><TeamCrest {...match.homeTeam} size={34} /><strong>{match.homeTeam.shortName}</strong></div><span>{match.homeScore90 ?? "–"} : {match.awayScore90 ?? "–"}</span><div><TeamCrest {...match.awayTeam} size={34} /><strong>{match.awayTeam.shortName}</strong></div></div>
            <p className="admin-match-date"><LocalDateTime value={match.kickoffUtc.toISOString()} /> · {match.venue ?? "Fără stadion"}</p>
            <div className="admin-form-grid">
              <form action={finalizeMatchAction} className="inline-admin-form">
                <input type="hidden" name="matchPublicId" value={match.publicId} />
                <label>90&apos; gazde<input className="input score-input" type="number" min="0" name="homeScore90" defaultValue={match.homeScore90 ?? ""} required /></label>
                <label>90&apos; oaspeți<input className="input score-input" type="number" min="0" name="awayScore90" defaultValue={match.awayScore90 ?? ""} required /></label>
                {(match.leg === "SECOND" || match.stage === "FINAL") && match.tie && <label>Se califică / câștigă<select className="input" name="qualifiedTeamPublicId" defaultValue={match.tie.qualifiedTeamId === match.tie.firstTeamId ? match.tie.firstTeam.publicId : match.tie.qualifiedTeamId === match.tie.secondTeamId ? match.tie.secondTeam.publicId : ""} required><option value="" disabled>Alege</option><option value={match.tie.firstTeam.publicId}>{match.tie.firstTeam.shortName}</option><option value={match.tie.secondTeam.publicId}>{match.tie.secondTeam.shortName}</option></select></label>}
                <button className="button button-primary">Finalizează</button>
              </form>
              <form action={saveMatchSettingsAction} className="inline-admin-form settings-form">
                <input type="hidden" name="matchPublicId" value={match.publicId} />
                <label>Start UTC<input className="input" type="datetime-local" name="kickoffUtc" defaultValue={match.kickoffUtc.toISOString().slice(0, 16)} required /></label>
                <label>Stadion<input className="input" name="venue" defaultValue={match.venue ?? ""} /></label>
                <label>ID ESPN<input className="input" name="externalId" defaultValue={match.externalId ?? ""} /></label>
                <label className="checkbox"><input type="checkbox" name="visibleToPlayers" defaultChecked={match.visibleToPlayers} /> Vizibil</label>
                <label className="checkbox"><input type="checkbox" name="providerUpdatesEnabled" defaultChecked={match.providerUpdatesEnabled} /> ESPN activ</label>
                <button className="button button-secondary">Salvează setări</button>
              </form>
            </div>
            <footer>
              <form action={toggleMatchLockAction}><input type="hidden" name="matchPublicId" value={match.publicId} /><button className="text-button">{match.manuallyLockedAt ? "Deblochează" : "Blochează"}</button></form>
              {match.resultFinalizedAt && <form action={clearMatchResultAction}><input type="hidden" name="matchPublicId" value={match.publicId} /><button className="text-button danger">Șterge rezultatul</button></form>}
              {match.externalId && <form action={forceEspnSyncAction}><input type="hidden" name="matchPublicId" value={match.publicId} /><button className="text-button">Sync ESPN</button></form>}
            </footer>
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
