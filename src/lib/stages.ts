import type { CompetitionStage, MatchLeg } from "@prisma/client";

export const stageOrder: CompetitionStage[] = [
  "LEAGUE_PHASE",
  "KNOCKOUT_PLAYOFF",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
];

export const stageLabels: Record<CompetitionStage, string> = {
  LEAGUE_PHASE: "Faza ligii",
  KNOCKOUT_PLAYOFF: "Baraj eliminatoriu",
  ROUND_OF_16: "Optimi de finală",
  QUARTER_FINAL: "Sferturi de finală",
  SEMI_FINAL: "Semifinale",
  FINAL: "Finala",
};

export const legLabels: Record<MatchLeg, string> = {
  SINGLE: "Meci unic",
  FIRST: "Tur",
  SECOND: "Retur",
};
