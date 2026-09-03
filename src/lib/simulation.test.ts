import { describe, expect, it } from "vitest";
import { generateLeaguePairings } from "@/lib/simulation";

describe("36-team league phase fixture generator", () => {
  it("creates eight rounds of 18 unique fixtures with four home games per club", () => {
    const rounds = generateLeaguePairings();
    expect(rounds).toHaveLength(8);
    expect(rounds.every((round) => round.length === 18)).toBe(true);
    const opponents = Array.from({ length: 36 }, () => new Set<number>());
    const homeGames = Array(36).fill(0) as number[];
    for (const round of rounds) {
      const appearances = new Set<number>();
      for (const match of round) {
        expect(appearances.has(match.homeIndex)).toBe(false);
        expect(appearances.has(match.awayIndex)).toBe(false);
        appearances.add(match.homeIndex);
        appearances.add(match.awayIndex);
        opponents[match.homeIndex].add(match.awayIndex);
        opponents[match.awayIndex].add(match.homeIndex);
        homeGames[match.homeIndex] += 1;
      }
      expect(appearances.size).toBe(36);
    }
    expect(opponents.every((set) => set.size === 8)).toBe(true);
    expect(homeGames.every((count) => count === 4)).toBe(true);
  });
});
