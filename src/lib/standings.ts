export type StandingTeam = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  crestUrl: string | null;
  coefficient: number;
};

export type StandingMatch = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore90: number | null;
  awayScore90: number | null;
  homeDisciplinaryPoints: number;
  awayDisciplinaryPoints: number;
  resultFinalizedAt: Date | null;
};

export type QualificationZone = "ROUND_OF_16" | "PLAYOFF" | "ELIMINATED";

export type StandingRow = StandingTeam & {
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  awayGoals: number;
  awayWins: number;
  points: number;
  opponentPoints: number;
  opponentGoalDifference: number;
  opponentGoalsFor: number;
  disciplinaryPoints: number;
  zone: QualificationZone;
};

type MutableRow = Omit<StandingRow, "rank" | "zone"> & { opponentIds: string[] };

export function buildLeagueStandings(
  teams: StandingTeam[],
  matches: StandingMatch[],
): StandingRow[] {
  const rows = new Map<string, MutableRow>();
  for (const team of teams) {
    rows.set(team.id, {
      ...team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      awayGoals: 0,
      awayWins: 0,
      points: 0,
      opponentPoints: 0,
      opponentGoalDifference: 0,
      opponentGoalsFor: 0,
      disciplinaryPoints: 0,
      opponentIds: [],
    });
  }

  for (const match of matches) {
    if (
      !match.resultFinalizedAt ||
      match.homeScore90 === null ||
      match.awayScore90 === null
    ) continue;
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore90;
    home.goalsAgainst += match.awayScore90;
    away.goalsFor += match.awayScore90;
    away.goalsAgainst += match.homeScore90;
    away.awayGoals += match.awayScore90;
    home.disciplinaryPoints += match.homeDisciplinaryPoints;
    away.disciplinaryPoints += match.awayDisciplinaryPoints;
    home.opponentIds.push(away.id);
    away.opponentIds.push(home.id);

    if (match.homeScore90 > match.awayScore90) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (match.awayScore90 > match.homeScore90) {
      away.wins += 1;
      away.awayWins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rows.values()) row.goalDifference = row.goalsFor - row.goalsAgainst;

  const leagueComplete = teams.length === 36 && [...rows.values()].every((row) => row.played >= 8);
  if (leagueComplete) {
    for (const row of rows.values()) {
      for (const opponentId of row.opponentIds) {
        const opponent = rows.get(opponentId);
        if (!opponent) continue;
        row.opponentPoints += opponent.points;
        row.opponentGoalDifference += opponent.goalDifference;
        row.opponentGoalsFor += opponent.goalsFor;
      }
    }
  }

  return [...rows.values()]
    .sort((a, b) => compareRows(a, b, leagueComplete))
    .map(({ opponentIds, ...row }, index) => {
      void opponentIds;
      return {
        ...row,
        rank: index + 1,
        zone: zoneForRank(index + 1),
      };
    });
}

function compareRows(a: MutableRow, b: MutableRow, leagueComplete: boolean) {
  const descending = [
    [a.points, b.points],
    [a.goalDifference, b.goalDifference],
    [a.goalsFor, b.goalsFor],
    [a.awayGoals, b.awayGoals],
    [a.wins, b.wins],
    [a.awayWins, b.awayWins],
  ];
  if (leagueComplete) {
    descending.push(
      [a.opponentPoints, b.opponentPoints],
      [a.opponentGoalDifference, b.opponentGoalDifference],
      [a.opponentGoalsFor, b.opponentGoalsFor],
    );
  }
  for (const [left, right] of descending) {
    if (left !== right) return right - left;
  }
  if (leagueComplete && a.disciplinaryPoints !== b.disciplinaryPoints) {
    return a.disciplinaryPoints - b.disciplinaryPoints;
  }
  if (leagueComplete && a.coefficient !== b.coefficient) {
    return b.coefficient - a.coefficient;
  }
  return a.abbreviation.localeCompare(b.abbreviation, "en");
}

export function zoneForRank(rank: number): QualificationZone {
  if (rank <= 8) return "ROUND_OF_16";
  if (rank <= 24) return "PLAYOFF";
  return "ELIMINATED";
}
