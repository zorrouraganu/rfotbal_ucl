import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const hasEliminationPhaseStarted = cache(async () => {
  const [unfinishedLeagueMatches, eliminationMatches] = await Promise.all([
    prisma.match.count({
      where: {
        competition: { isActive: true },
        stage: "LEAGUE_PHASE",
        resultFinalizedAt: null,
      },
    }),
    prisma.match.count({
      where: {
        competition: { isActive: true },
        stage: { not: "LEAGUE_PHASE" },
        visibleToPlayers: true,
      },
    }),
  ]);

  return unfinishedLeagueMatches === 0 && eliminationMatches > 0;
});
