import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentPlayer())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [competition, matches, predictions, players] = await Promise.all([
    prisma.competition.aggregate({
      where: { isActive: true },
      _max: { updatedAt: true },
    }),
    prisma.match.aggregate({
      where: { competition: { isActive: true }, visibleToPlayers: true },
      _max: { updatedAt: true },
    }),
    prisma.prediction.aggregate({ _max: { updatedAt: true } }),
    prisma.player.aggregate({
      where: { isActive: true },
      _max: { updatedAt: true },
    }),
  ]);

  const state = [
    competition._max.updatedAt?.toISOString() ?? "",
    matches._max.updatedAt?.toISOString() ?? "",
    predictions._max.updatedAt?.toISOString() ?? "",
    players._max.updatedAt?.toISOString() ?? "",
  ].join("|");
  const version = createHash("sha256").update(state).digest("hex").slice(0, 20);

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "private, no-cache, no-store, max-age=0" } },
  );
}
