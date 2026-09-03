import { describe, expect, it } from "vitest";
import { buildLeagueFixturePlan } from "./fixtureImport";
import type { NormalizedProviderMatch } from "./types";
import { generateLeaguePairings } from "@/lib/simulation";

function validFeed() {
  const matches: NormalizedProviderMatch[] = [];
  for (const [round, pairings] of generateLeaguePairings().entries()) {
    for (const [index, pairing] of pairings.entries()) {
      matches.push(fixture(`${round}-${index}`, pairing.homeIndex, pairing.awayIndex, round, index));
    }
  }
  return matches;
}

function fixture(id: string, home: number, away: number, round: number, index: number): NormalizedProviderMatch {
  const kickoff = new Date(Date.UTC(2026, 8, 1 + round * 7 + (index >= 9 ? 1 : 0), index % 2 ? 19 : 17));
  const team = (value: number) => ({ externalId: String(value), name: `Team ${value}`, abbreviation: `T${value}`, crestUrl: null, advanced: false });
  return {
    provider: "espn",
    externalId: id,
    status: "SCHEDULED",
    homeTeam: team(home),
    awayTeam: team(away),
    liveHomeScore: null,
    liveAwayScore: null,
    homeScore90: null,
    awayScore90: null,
    kickoffUtc: kickoff,
    venue: null,
    seasonSlug: "league-phase",
    rawPayload: {},
  };
}

describe("ESPN league fixture planning", () => {
  it("maps a validated 144-match feed into eight matchdays", () => {
    const plan = buildLeagueFixturePlan(validFeed());
    expect(plan).toHaveLength(144);
    expect(plan.filter((match) => match.matchday === 1)).toHaveLength(18);
    expect(plan.filter((match) => match.matchday === 8)).toHaveLength(18);
  });

  it("refuses incomplete provider data", () => {
    expect(() => buildLeagueFixturePlan(validFeed().slice(1))).toThrow(/expected 144/i);
  });
});
