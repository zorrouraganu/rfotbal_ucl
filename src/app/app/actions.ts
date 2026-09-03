"use server";

import type { PredictionSelection } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/auth-server";
import { assertCanSubmitPrediction } from "@/lib/locking";
import { prisma } from "@/lib/prisma";
import { automaticFinalWinnerSide } from "@/lib/scoring";

export type PredictionActionState = { error?: string; success?: boolean };
const validSelections = new Set<PredictionSelection>([
  "HOME", "DRAW", "AWAY", "HOME_OR_DRAW", "DRAW_OR_AWAY", "HOME_OR_AWAY",
]);

export async function savePredictionAction(_: PredictionActionState, formData: FormData): Promise<PredictionActionState> {
  const player = await requirePlayer();
  const matchPublicId = String(formData.get("matchPublicId") ?? "");
  const selection = String(formData.get("selection") ?? "") as PredictionSelection;
  if (!validSelections.has(selection)) return { error: "Selectează una dintre cele șase piețe." };
  const match = await prisma.match.findUnique({
    where: { publicId: matchPublicId },
    include: { tie: { include: { firstTeam: true, secondTeam: true } } },
  });
  if (!match || !match.visibleToPlayers) return { error: "Meciul nu este disponibil." };
  try { assertCanSubmitPrediction(match); } catch (error) {
    return { error: error instanceof Error ? error.message : "Meciul este blocat." };
  }

  let qualifyingTeamId: string | null = null;
  if (match.leg === "SECOND" || match.stage === "FINAL") {
    if (!match.tie) return { error: "Meciul nu are echipele pentru câștigătoare configurate." };
    const qualifyingTeamPublicId = String(formData.get("qualifyingTeamPublicId") ?? "");
    const candidates = [match.tie?.firstTeam, match.tie?.secondTeam].filter(Boolean);
    const automaticSide = match.stage === "FINAL" ? automaticFinalWinnerSide(selection) : null;
    const automaticTeamId = automaticSide === "HOME"
      ? match.homeTeamId
      : automaticSide === "AWAY"
        ? match.awayTeamId
        : null;
    const selectedTeam = automaticTeamId
      ? candidates.find((team) => team?.id === automaticTeamId)
      : candidates.find((team) => team?.publicId === qualifyingTeamPublicId);
    if (!selectedTeam) return { error: match.stage === "FINAL"
      ? "Selectează echipa pe care o vezi câștigând trofeul."
      : "Selectează echipa pe care o vezi calificată." };
    qualifyingTeamId = selectedTeam.id;
  }

  await prisma.prediction.upsert({
    where: { playerId_matchId: { playerId: player.id, matchId: match.id } },
    update: { selection, qualifyingTeamId, submittedAt: new Date() },
    create: { playerId: player.id, matchId: match.id, selection, qualifyingTeamId },
  });
  revalidatePath("/app");
  revalidatePath("/account");
  revalidatePath("/leaderboard");
  return { success: true };
}
