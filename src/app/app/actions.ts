"use server";

import type { PredictionSelection, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/auth-server";
import { assertCanSubmitPrediction } from "@/lib/locking";
import { prisma } from "@/lib/prisma";
import { automaticFinalWinnerSide } from "@/lib/scoring";

export type PredictionActionState = { error?: string; success?: boolean };
export type PredictionBatchActionState = PredictionActionState & { savedCount?: number };
type PredictionMatch = Prisma.MatchGetPayload<{
  include: { tie: { include: { firstTeam: true; secondTeam: true } } };
}>;
type BatchPredictionInput = {
  matchPublicId: string;
  selection: PredictionSelection;
  qualifyingTeamPublicId: string | null;
};
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
  let qualifyingTeamId: string | null;
  try {
    assertCanSubmitPrediction(match);
    qualifyingTeamId = resolveQualifyingTeamId(
      match,
      selection,
      String(formData.get("qualifyingTeamPublicId") ?? "") || null,
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Meciul este blocat." };
  }

  await prisma.prediction.upsert({
    where: { playerId_matchId: { playerId: player.id, matchId: match.id } },
    update: { selection, qualifyingTeamId, submittedAt: new Date() },
    create: { playerId: player.id, matchId: match.id, selection, qualifyingTeamId },
  });
  revalidatePredictionPages();
  return { success: true };
}

export async function savePredictionsBatchAction(
  _: PredictionBatchActionState,
  formData: FormData,
): Promise<PredictionBatchActionState> {
  const player = await requirePlayer();
  let inputs: BatchPredictionInput[];
  try {
    inputs = parseBatchInputs(formData.get("predictions"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Predicțiile nu au putut fi citite." };
  }
  if (!inputs.length) return { error: "Nu există predicții modificate de salvat." };

  const matches = await prisma.match.findMany({
    where: { publicId: { in: inputs.map((input) => input.matchPublicId) } },
    include: { tie: { include: { firstTeam: true, secondTeam: true } } },
  });
  const matchesByPublicId = new Map(matches.map((match) => [match.publicId, match]));
  const prepared: Array<{ match: PredictionMatch; selection: PredictionSelection; qualifyingTeamId: string | null }> = [];

  try {
    for (const input of inputs) {
      const match = matchesByPublicId.get(input.matchPublicId);
      if (!match || !match.visibleToPlayers) throw new Error("Unul dintre meciuri nu mai este disponibil.");
      assertCanSubmitPrediction(match);
      prepared.push({
        match,
        selection: input.selection,
        qualifyingTeamId: resolveQualifyingTeamId(match, input.selection, input.qualifyingTeamPublicId),
      });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Una dintre predicții nu poate fi salvată." };
  }

  const submittedAt = new Date();
  await prisma.$transaction(prepared.map(({ match, selection, qualifyingTeamId }) =>
    prisma.prediction.upsert({
      where: { playerId_matchId: { playerId: player.id, matchId: match.id } },
      update: { selection, qualifyingTeamId, submittedAt },
      create: { playerId: player.id, matchId: match.id, selection, qualifyingTeamId, submittedAt },
    }),
  ));
  revalidatePredictionPages();
  return { success: true, savedCount: prepared.length };
}

function parseBatchInputs(value: FormDataEntryValue | null): BatchPredictionInput[] {
  if (typeof value !== "string") throw new Error("Predicțiile nu au putut fi citite.");
  if (value.length > 100_000) throw new Error("Setul de predicții este prea mare.");
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.length > 144) throw new Error("Setul de predicții nu este valid.");
  const seen = new Set<string>();
  return parsed.map((candidate) => {
    if (!candidate || typeof candidate !== "object") throw new Error("O predicție nu este validă.");
    const record = candidate as Record<string, unknown>;
    const matchPublicId = typeof record.matchPublicId === "string" ? record.matchPublicId : "";
    const selection = String(record.selection ?? "") as PredictionSelection;
    const qualifyingTeamPublicId = typeof record.qualifyingTeamPublicId === "string"
      ? record.qualifyingTeamPublicId
      : null;
    if (!matchPublicId || seen.has(matchPublicId) || !validSelections.has(selection)) {
      throw new Error("Setul de predicții nu este valid.");
    }
    seen.add(matchPublicId);
    return { matchPublicId, selection, qualifyingTeamPublicId };
  });
}

function resolveQualifyingTeamId(
  match: PredictionMatch,
  selection: PredictionSelection,
  qualifyingTeamPublicId: string | null,
) {
  if (match.leg !== "SECOND" && match.stage !== "FINAL") return null;
  if (!match.tie) throw new Error("Meciul nu are echipele pentru câștigătoare configurate.");
  const candidates = [match.tie.firstTeam, match.tie.secondTeam];
  const automaticSide = match.stage === "FINAL" ? automaticFinalWinnerSide(selection) : null;
  const automaticTeamId = automaticSide === "HOME"
    ? match.homeTeamId
    : automaticSide === "AWAY"
      ? match.awayTeamId
      : null;
  const selectedTeam = automaticTeamId
    ? candidates.find((team) => team.id === automaticTeamId)
    : candidates.find((team) => team.publicId === qualifyingTeamPublicId);
  if (!selectedTeam) throw new Error(match.stage === "FINAL"
    ? "Selectează echipa pe care o vezi câștigând trofeul."
    : "Selectează echipa pe care o vezi calificată.");
  return selectedTeam.id;
}

function revalidatePredictionPages() {
  revalidatePath("/app");
  revalidatePath("/account");
  revalidatePath("/leaderboard");
}
