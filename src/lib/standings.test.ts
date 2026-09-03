import { describe, expect, it } from "vitest";
import { buildLeagueStandings, zoneForRank } from "@/lib/standings";

const teams = [
  { id: "a", name: "Alpha", shortName: "Alpha", abbreviation: "ALP", crestUrl: null, coefficient: 10 },
  { id: "b", name: "Beta", shortName: "Beta", abbreviation: "BET", crestUrl: null, coefficient: 9 },
  { id: "c", name: "Charlie", shortName: "Charlie", abbreviation: "CHA", crestUrl: null, coefficient: 8 },
];

describe("league phase standings", () => {
  it("calculates points and UEFA interim tie-breakers", () => {
    const rows = buildLeagueStandings(teams, [
      { homeTeamId: "a", awayTeamId: "b", homeScore90: 2, awayScore90: 0, homeDisciplinaryPoints: 1, awayDisciplinaryPoints: 2, resultFinalizedAt: new Date() },
      { homeTeamId: "c", awayTeamId: "a", homeScore90: 1, awayScore90: 1, homeDisciplinaryPoints: 1, awayDisciplinaryPoints: 0, resultFinalizedAt: new Date() },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["a", "c", "b"]);
    expect(rows[0]).toMatchObject({ points: 4, played: 2, goalDifference: 2 });
  });

  it("maps the three qualification zones", () => {
    expect(zoneForRank(8)).toBe("ROUND_OF_16");
    expect(zoneForRank(9)).toBe("PLAYOFF");
    expect(zoneForRank(24)).toBe("PLAYOFF");
    expect(zoneForRank(25)).toBe("ELIMINATED");
  });
});
