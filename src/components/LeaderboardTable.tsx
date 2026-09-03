import type { LeaderboardEntry } from "@/lib/leaderboard";

export function LeaderboardTable({ entries, currentPlayerId }: { entries: LeaderboardEntry[]; currentPlayerId?: string }) {
  return (
    <div className="leaderboard-list">
      {entries.map((entry) => (
        <article key={entry.playerId} className={`leaderboard-row ${entry.playerId === currentPlayerId ? "is-current" : ""}`}>
          <span className="leader-rank">#{entry.rank}</span>
          <div className="leader-name"><a href={`https://www.reddit.com/user/${encodeURIComponent(entry.redditUsername)}`}><strong>u/{entry.redditUsername}</strong></a>{entry.nickname && <small>{entry.nickname}</small>}</div>
          <div className="leader-stats"><span><b>{entry.correctSingles}</b> cote 3p</span><span><b>{entry.correctDoubleChances}</b> cote 1p</span><span><b>{entry.correctQualifiers}</b> calificări/câștigătoare</span></div>
          <strong className="leader-points">{entry.points}<small>puncte</small></strong>
        </article>
      ))}
    </div>
  );
}
