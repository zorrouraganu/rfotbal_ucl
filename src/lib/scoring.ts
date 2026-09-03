import type { MatchLeg, PredictionSelection } from "@prisma/client";

export type MatchOutcome = "HOME" | "DRAW" | "AWAY";

export type PredictionScore = {
  marketPoints: number;
  qualifierPoints: number;
  totalPoints: number;
  marketCorrect: boolean;
  qualifierCorrect: boolean;
};

export const marketOptions: ReadonlyArray<{
  value: PredictionSelection;
  label: string;
  description: string;
  points: 1 | 3;
}> = [
  { value: "HOME", label: "1", description: "Victorie gazde", points: 3 },
  { value: "DRAW", label: "X", description: "Egal", points: 3 },
  { value: "AWAY", label: "2", description: "Victorie oaspeți", points: 3 },
  { value: "HOME_OR_DRAW", label: "1X", description: "Gazde sau egal", points: 1 },
  { value: "DRAW_OR_AWAY", label: "X2", description: "Egal sau oaspeți", points: 1 },
  { value: "HOME_OR_AWAY", label: "12", description: "Oricare echipă câștigă", points: 1 },
];

const singleSelections = new Set<PredictionSelection>(["HOME", "DRAW", "AWAY"]);

export function outcomeFromScore(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

export function selectionCoversOutcome(
  selection: PredictionSelection,
  outcome: MatchOutcome,
) {
  if (selection === "HOME") return outcome === "HOME";
  if (selection === "DRAW") return outcome === "DRAW";
  if (selection === "AWAY") return outcome === "AWAY";
  if (selection === "HOME_OR_DRAW") return outcome !== "AWAY";
  if (selection === "DRAW_OR_AWAY") return outcome !== "HOME";
  return outcome !== "DRAW";
}

export function pointsForSelection(selection: PredictionSelection) {
  return singleSelections.has(selection) ? 3 : 1;
}

export function automaticFinalWinnerSide(selection: PredictionSelection): "HOME" | "AWAY" | null {
  if (selection === "HOME") return "HOME";
  if (selection === "AWAY") return "AWAY";
  return null;
}

export function scorePrediction(input: {
  selection: PredictionSelection;
  qualifyingTeamId: string | null;
  homeScore90: number | null;
  awayScore90: number | null;
  leg: MatchLeg;
  qualifiedTeamId: string | null;
  resultFinalized: boolean;
}): PredictionScore {
  if (
    !input.resultFinalized ||
    input.homeScore90 === null ||
    input.awayScore90 === null
  ) {
    return {
      marketPoints: 0,
      qualifierPoints: 0,
      totalPoints: 0,
      marketCorrect: false,
      qualifierCorrect: false,
    };
  }

  const outcome = outcomeFromScore(input.homeScore90, input.awayScore90);
  const marketCorrect = selectionCoversOutcome(input.selection, outcome);
  const marketPoints = marketCorrect ? pointsForSelection(input.selection) : 0;
  const qualifierCorrect =
    (input.leg === "SECOND" || input.leg === "SINGLE") &&
    input.qualifyingTeamId !== null &&
    input.qualifiedTeamId !== null &&
    input.qualifyingTeamId === input.qualifiedTeamId;
  const qualifierPoints = qualifierCorrect ? 2 : 0;

  return {
    marketPoints,
    qualifierPoints,
    totalPoints: marketPoints + qualifierPoints,
    marketCorrect,
    qualifierCorrect,
  };
}

export function marketLabel(selection: PredictionSelection) {
  return marketOptions.find((option) => option.value === selection)?.label ?? selection;
}
