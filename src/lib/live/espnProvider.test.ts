import { describe, expect, it } from "vitest";
import { EspnProvider } from "@/lib/live/espnProvider";

describe("ESPN UCL normalization", () => {
  it("keeps 90-minute scoring separate and exposes crest/account IDs", () => {
    const match = new EspnProvider().normalizeProviderMatch({
      id: "401",
      status: { type: { state: "post", completed: true, name: "STATUS_FINAL" } },
      competitions: [{
        date: "2026-09-15T19:00:00Z",
        competitors: [
          { id: "359", homeAway: "home", score: "2", team: { id: "359", displayName: "Arsenal", abbreviation: "ARS", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png" } },
          { id: "160", homeAway: "away", score: "1", team: { id: "160", displayName: "PSG", abbreviation: "PSG", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/160.png" } },
        ],
      }],
    });
    expect(match).toMatchObject({ externalId: "401", status: "FINAL", homeScore90: 2, awayScore90: 1 });
    expect(match.homeTeam).toMatchObject({ externalId: "359", abbreviation: "ARS" });
  });
});
