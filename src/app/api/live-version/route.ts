import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const playerScopes = new Set(["/account", "/app", "/leaderboard", "/standings"]);

export async function GET(request: Request) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedScope = new URL(request.url).searchParams.get("scope") ?? "/account";
  const scope = playerScopes.has(requestedScope) ? requestedScope : "/account";
  const includeOwnPredictions = scope === "/app" || scope === "/account";
  const includePlayers = scope === "/leaderboard" || scope === "/account";

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true, publicId: true, name: true, seasonLabel: true },
  });
  if (!competition) return versionResponse("no-active-competition");

  const [matches, teams, ties, predictions, players] = await Promise.all([
    prisma.match.findMany({
      where: { competitionId: competition.id, visibleToPlayers: true },
      orderBy: { publicId: "asc" },
      select: {
        publicId: true,
        stage: true,
        leg: true,
        matchday: true,
        kickoffUtc: true,
        status: true,
        liveHomeScore: true,
        liveAwayScore: true,
        homeScore90: true,
        awayScore90: true,
        homeDisciplinaryPoints: true,
        awayDisciplinaryPoints: true,
        manuallyLockedAt: true,
        resultFinalizedAt: true,
      },
    }),
    prisma.team.findMany({
      where: { competitionId: competition.id },
      orderBy: { publicId: "asc" },
      select: { publicId: true, name: true, shortName: true, abbreviation: true, crestUrl: true, coefficient: true },
    }),
    prisma.knockoutTie.findMany({
      where: { competitionId: competition.id },
      orderBy: { publicId: "asc" },
      select: { publicId: true, qualifiedTeam: { select: { publicId: true } } },
    }),
    includeOwnPredictions
      ? prisma.prediction.findMany({
          where: { playerId: player.id, match: { competitionId: competition.id } },
          orderBy: { matchId: "asc" },
          select: {
            selection: true,
            match: { select: { publicId: true } },
            qualifyingTeam: { select: { publicId: true } },
          },
        })
      : Promise.resolve([]),
    includePlayers
      ? prisma.player.findMany({
          where: { isActive: true },
          orderBy: { publicId: "asc" },
          select: { publicId: true, redditUsername: true, nickname: true },
        })
      : Promise.resolve([]),
  ]);

  const state = JSON.stringify({
    competition: { publicId: competition.publicId, name: competition.name, seasonLabel: competition.seasonLabel },
    matches,
    teams,
    ties,
    predictions,
    players,
  });
  const version = createHash("sha256").update(state).digest("hex").slice(0, 20);

  return versionResponse(version);
}

function versionResponse(version: string) {
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "private, no-cache, no-store, max-age=0" } },
  );
}
