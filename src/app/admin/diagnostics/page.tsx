import { importEspnFixturesAction } from "@/app/admin/actions";
import { syncEspnNowAction } from "@/app/admin/diagnostics/actions";
import { AdminFrame } from "@/components/AdminFrame";
import { LocalDateTime } from "@/components/LocalDateTime";
import { requireAdmin } from "@/lib/auth-server";
import { probeEspnFeed } from "@/lib/live/diagnostics";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "ESPN Debug" };

const statusOrder = ["LIVE", "HALF_TIME", "SCHEDULED", "FINAL", "POSTPONED", "LOCKED"];

export default async function EspnDiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const admin = await requireAdmin();
  const { result } = await searchParams;
  const competition = await prisma.competition.findFirst({ where: { isActive: true } });
  const [databaseMatches, recentLogs] = await Promise.all([
    competition
      ? prisma.match.findMany({
          where: { competitionId: competition.id },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { kickoffUtc: "asc" },
        })
      : [],
    prisma.providerSyncLog.findMany({
      where: { provider: "espn" },
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const { matches: feedMatches, error: feedError, latencyMs } = await probeEspnFeed();

  const mappedIds = new Set(databaseMatches.map((match) => match.externalId).filter(Boolean));
  const feedMapped = feedMatches.filter((match) => mappedIds.has(match.externalId)).length;
  const enabled = databaseMatches.filter((match) => match.providerUpdatesEnabled).length;
  const manual = databaseMatches.filter((match) => match.manualOverride).length;
  const lastSync = databaseMatches.reduce<Date | null>((latest, match) => {
    if (!match.providerLastSyncAt) return latest;
    return !latest || match.providerLastSyncAt > latest ? match.providerLastSyncAt : latest;
  }, null);
  const endpoint = safeEndpoint(process.env.ESPN_SCOREBOARD_URL);
  const feedStatusCounts = countStatuses(feedMatches.map((match) => match.status));
  const databaseStatusCounts = countStatuses(databaseMatches.map((match) => match.status));
  const feedPreview = [...feedMatches]
    .sort((a, b) => (a.kickoffUtc?.getTime() ?? 0) - (b.kickoffUtc?.getTime() ?? 0))
    .slice(0, 18);

  return (
    <AdminFrame player={admin}>
      <section className="admin-title diagnostics-title">
        <div><p className="eyebrow">LIVE PROVIDER</p><h1>ESPN Debug</h1></div>
        <div className="diagnostic-actions">
          <form action={syncEspnNowAction}><button className="button button-secondary">Sync scoruri</button></form>
          <form action={importEspnFixturesAction}><button className="button button-primary">Reconciliere 144</button></form>
        </div>
      </section>

      {result === "sync-ok" && <p className="form-success">Sync ESPN finalizat.</p>}
      {result === "sync-error" && <p className="form-error">Sync ESPN eșuat.</p>}
      {result === "provider-disabled" && <p className="form-error">LIVE_SCORE_PROVIDER nu este ESPN.</p>}

      <section className="diagnostic-grid">
        <article className={`diagnostic-card ${feedError ? "is-error" : "is-ok"}`}>
          <span>API</span><strong>{feedError ? "EROARE" : "ONLINE"}</strong><small>{latencyMs} ms</small>
        </article>
        <article className="diagnostic-card"><span>Feed curent</span><strong>{feedMatches.length}</strong><small>{feedMapped} mapate</small></article>
        <article className="diagnostic-card"><span>Bază de date</span><strong>{databaseMatches.length}</strong><small>{enabled} cu update activ</small></article>
        <article className="diagnostic-card"><span>Override manual</span><strong>{manual}</strong><small>rezultate protejate</small></article>
      </section>

      {feedError && <div className="diagnostic-error"><strong>{feedError}</strong></div>}

      <section className="diagnostic-columns">
        <article className="panel diagnostic-panel">
          <header><p className="eyebrow">CONFIG</p><h2>Provider</h2></header>
          <dl className="diagnostic-kv">
            <div><dt>Mod</dt><dd>{process.env.LIVE_SCORE_PROVIDER ?? "manual"}</dd></div>
            <div><dt>Endpoint</dt><dd>{endpoint}</dd></div>
            <div><dt>Interval bază</dt><dd>{process.env.LIVE_POLL_INTERVAL_SECONDS ?? "60"}s</dd></div>
            <div><dt>Interval live</dt><dd>{process.env.LIVE_POLL_LIVE_INTERVAL_SECONDS ?? "10"}s</dd></div>
            <div><dt>Ultimul sync DB</dt><dd>{lastSync ? <LocalDateTime value={lastSync.toISOString()} /> : "—"}</dd></div>
          </dl>
        </article>
        <article className="panel diagnostic-panel">
          <header><p className="eyebrow">STATUS</p><h2>Evenimente</h2></header>
          <div className="status-matrix">
            {statusOrder.map((status) => (
              <div key={status}><span>{status}</span><strong>{feedStatusCounts[status] ?? 0}</strong><small>feed</small><strong>{databaseStatusCounts[status] ?? 0}</strong><small>DB</small></div>
            ))}
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">NORMALIZED FEED</p><h2>Evenimente ESPN</h2></div><span>{feedMatches.length}</span></div>
        <div className="table-scroll panel-table">
          <table className="diagnostic-table">
            <thead><tr><th>Start</th><th>Meci</th><th>Status</th><th>ID ESPN</th><th>Mapare</th></tr></thead>
            <tbody>{feedPreview.map((match) => (
              <tr key={match.externalId}>
                <td>{match.kickoffUtc ? <LocalDateTime value={match.kickoffUtc.toISOString()} /> : "—"}</td>
                <td><strong>{match.homeTeam.abbreviation ?? match.homeTeam.name ?? "?"} – {match.awayTeam.abbreviation ?? match.awayTeam.name ?? "?"}</strong></td>
                <td><span className="market-badge">{match.status}</span></td>
                <td><code>{match.externalId}</code></td>
                <td><span className={mappedIds.has(match.externalId) ? "mapping-ok" : "mapping-missing"}>{mappedIds.has(match.externalId) ? "MAPAT" : "LIPSĂ"}</span></td>
              </tr>
            ))}</tbody>
          </table>
          {!feedPreview.length && !feedError && <div className="empty-state compact-empty">0 evenimente în fereastra curentă</div>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">PROVIDER LOG</p><h2>Ultimele operațiuni</h2></div><span>{recentLogs.length}</span></div>
        <div className="table-scroll panel-table">
          <table className="diagnostic-table">
            <thead><tr><th>Timp</th><th>Acțiune</th><th>Meci</th><th>Tranziție</th></tr></thead>
            <tbody>{recentLogs.map((log) => (
              <tr key={log.id}>
                <td><LocalDateTime value={log.createdAt.toISOString()} /></td>
                <td><code>{log.action}</code></td>
                <td>{log.match ? `${log.match.homeTeam.abbreviation} – ${log.match.awayTeam.abbreviation}` : "GLOBAL"}</td>
                <td>{log.statusBefore || log.statusAfter ? `${log.statusBefore ?? "—"} → ${log.statusAfter ?? "—"}` : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AdminFrame>
  );
}

function countStatuses(statuses: string[]) {
  return statuses.reduce<Record<string, number>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
}

function safeEndpoint(value?: string) {
  try {
    const url = new URL(value ?? "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard");
    return `${url.origin}${url.pathname}`;
  } catch {
    return "invalid endpoint";
  }
}
