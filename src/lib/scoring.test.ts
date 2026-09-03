import { describe, expect, it } from "vitest";
import { automaticFinalWinnerSide, outcomeFromScore, scorePrediction, selectionCoversOutcome } from "@/lib/scoring";

describe("UCL prediction scoring", () => {
  it("derives the 90-minute 1/X/2 outcome", () => {
    expect(outcomeFromScore(2, 1)).toBe("HOME");
    expect(outcomeFromScore(1, 1)).toBe("DRAW");
    expect(outcomeFromScore(0, 3)).toBe("AWAY");
  });

  it("awards three points for a correct single selection", () => {
    expect(scorePrediction({ selection: "DRAW", qualifyingTeamId: null, homeScore90: 2, awayScore90: 2, leg: "SINGLE", qualifiedTeamId: null, resultFinalized: true })).toMatchObject({ marketPoints: 3, totalPoints: 3 });
  });

  it("awards one point for a correct double chance and zero for a miss", () => {
    expect(selectionCoversOutcome("HOME_OR_DRAW", "DRAW")).toBe(true);
    expect(scorePrediction({ selection: "HOME_OR_DRAW", qualifyingTeamId: null, homeScore90: 1, awayScore90: 1, leg: "FIRST", qualifiedTeamId: null, resultFinalized: true }).totalPoints).toBe(1);
    expect(scorePrediction({ selection: "HOME_OR_AWAY", qualifyingTeamId: null, homeScore90: 1, awayScore90: 1, leg: "FIRST", qualifiedTeamId: null, resultFinalized: true }).totalPoints).toBe(0);
  });

  it("derives an automatic final winner only from 1 or 2", () => {
    expect(automaticFinalWinnerSide("HOME")).toBe("HOME");
    expect(automaticFinalWinnerSide("AWAY")).toBe("AWAY");
    expect(automaticFinalWinnerSide("DRAW")).toBeNull();
    expect(automaticFinalWinnerSide("HOME_OR_DRAW")).toBeNull();
    expect(automaticFinalWinnerSide("DRAW_OR_AWAY")).toBeNull();
    expect(automaticFinalWinnerSide("HOME_OR_AWAY")).toBeNull();
  });

  it("adds two points for a correct second-leg qualifier or final winner", () => {
    expect(scorePrediction({ selection: "AWAY", qualifyingTeamId: "team-a", homeScore90: 0, awayScore90: 1, leg: "SECOND", qualifiedTeamId: "team-a", resultFinalized: true })).toMatchObject({ marketPoints: 3, qualifierPoints: 2, totalPoints: 5 });
    expect(scorePrediction({ selection: "DRAW", qualifyingTeamId: "team-a", homeScore90: 1, awayScore90: 1, leg: "SINGLE", qualifiedTeamId: "team-a", resultFinalized: true })).toMatchObject({ marketPoints: 3, qualifierPoints: 2, totalPoints: 5 });
    expect(scorePrediction({ selection: "AWAY", qualifyingTeamId: "team-a", homeScore90: 0, awayScore90: 1, leg: "FIRST", qualifiedTeamId: "team-a", resultFinalized: true }).qualifierPoints).toBe(0);
  });

  it("never scores an unfinalized match", () => {
    expect(scorePrediction({ selection: "HOME", qualifyingTeamId: null, homeScore90: 3, awayScore90: 0, leg: "SINGLE", qualifiedTeamId: null, resultFinalized: false }).totalPoints).toBe(0);
  });
});
