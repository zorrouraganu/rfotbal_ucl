import { TeamCrest } from "@/components/TeamCrest";
import type { StandingRow } from "@/lib/standings";

export function LeagueTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  const visibleRows = compact ? rows.slice(0, 12) : rows;
  return (
    <div className="table-scroll">
      <table className="league-table">
        <thead><tr><th>#</th><th>Echipă</th><th>MJ</th><th>V</th><th>E</th><th>Î</th><th>GM</th><th>GP</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id} className={`zone-${row.zone.toLowerCase()}`}>
              <td><span className="rank-dot">{row.rank}</span></td>
              <td><div className="table-team"><TeamCrest {...row} size={28} /><strong>{row.shortName}</strong><small>{row.abbreviation}</small></div></td>
              <td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td>
              <td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference > 0 ? "+" : ""}{row.goalDifference}</td><td><strong>{row.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
