import type { PredictionSelection } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scorePrediction } from "@/lib/scoring";

export type LeaderboardEntry = {
  playerId: string;
  publicId: string;
  redditUsername: string;
  nickname: string | null;
  rank: number;
  points: number;
  correctSingles: number;
  correctDoubleChances: number;
  correctQualifiers: number;
  scoredPredictions: number;
};

export type LeaderboardPrediction = {
  playerId: string;
  selection: PredictionSelection;
  qualifyingTeamId: string | null;
  match: {
    leg: "SINGLE" | "FIRST" | "SECOND";
    homeScore90: number | null;
    awayScore90: number | null;
    resultFinalizedAt: Date | null;
    tie: { qualifiedTeamId: string | null } | null;
  };
};

export function buildLeaderboard(
  players: Array<{
    id: string;
    publicId: string;
    redditUsername: string;
    nickname: string | null;
  }>,
  predictions: LeaderboardPrediction[],
): LeaderboardEntry[] {
  const byPlayer = new Map<string, LeaderboardPrediction[]>();
  for (const prediction of predictions) {
    const group = byPlayer.get(prediction.playerId) ?? [];
    group.push(prediction);
    byPlayer.set(prediction.playerId, group);
  }

  return players
    .map((player) => {
      let points = 0;
      let correctSingles = 0;
      let correctDoubleChances = 0;
      let correctQualifiers = 0;
      let scoredPredictions = 0;
      for (const prediction of byPlayer.get(player.id) ?? []) {
        if (!prediction.match.resultFinalizedAt) continue;
        scoredPredictions += 1;
        const score = scorePrediction({
          selection: prediction.selection,
          qualifyingTeamId: prediction.qualifyingTeamId,
          homeScore90: prediction.match.homeScore90,
          awayScore90: prediction.match.awayScore90,
          leg: prediction.match.leg,
          qualifiedTeamId: prediction.match.tie?.qualifiedTeamId ?? null,
          resultFinalized: true,
        });
        points += score.totalPoints;
        if (score.marketCorrect) {
          if (["HOME", "DRAW", "AWAY"].includes(prediction.selection)) correctSingles += 1;
          else correctDoubleChances += 1;
        }
        if (score.qualifierCorrect) correctQualifiers += 1;
      }
      return {
        playerId: player.id,
        publicId: player.publicId,
        redditUsername: player.redditUsername,
        nickname: player.nickname,
        rank: 0,
        points,
        correctSingles,
        correctDoubleChances,
        correctQualifiers,
        scoredPredictions,
      };
    })
    .sort((a, b) =>
      b.points - a.points ||
      b.correctSingles - a.correctSingles ||
      b.correctQualifiers - a.correctQualifiers ||
      a.redditUsername.localeCompare(b.redditUsername, "en"),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function loadLeaderboard() {
  const [players, predictions] = await Promise.all([
    prisma.player.findMany({
      where: { isActive: true },
      select: { id: true, publicId: true, redditUsername: true, nickname: true },
    }),
    prisma.prediction.findMany({
      include: {
        match: {
          select: {
            leg: true,
            homeScore90: true,
            awayScore90: true,
            resultFinalizedAt: true,
            tie: { select: { qualifiedTeamId: true } },
          },
        },
      },
    }),
  ]);
  return buildLeaderboard(players, predictions);
}
