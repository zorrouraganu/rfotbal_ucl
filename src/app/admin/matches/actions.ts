"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import { canAdminUnlock } from "@/lib/locking";
import { getConfiguredLiveScoreProvider } from "@/lib/live";
import { buildProviderUpdateData, providerQualifiedTeamEspnId } from "@/lib/live/sync";
import { prisma } from "@/lib/prisma";

function refreshMatchPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/predictions");
  revalidatePath("/app");
  revalidatePath("/standings");
  revalidatePath("/leaderboard");
  revalidatePath("/account");
}

export async function finalizeMatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const publicId = String(formData.get("matchPublicId") ?? "");
  const homeScore = Number(formData.get("homeScore90"));
  const awayScore = Number(formData.get("awayScore90"));
  if (!Number.isInteger(homeScore) || homeScore < 0 || !Number.isInteger(awayScore) || awayScore < 0) return;
  const match = await prisma.match.findUnique({ where: { publicId }, include: { tie: { include: { firstTeam: true, secondTeam: true } } } });
  if (!match) return;
  const winnerPublicId = String(formData.get("qualifiedTeamPublicId") ?? "");
  let qualifiedTeamId: string | null = null;
  if (match.leg === "SECOND" || match.stage === "FINAL") {
    const candidates = [match.tie?.firstTeam, match.tie?.secondTeam].filter(Boolean);
    const winner = candidates.find((team) => team?.publicId === winnerPublicId);
    if (!winner) return;
    qualifiedTeamId = winner.id;
  }
  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "FINAL",
        homeScore90: homeScore,
        awayScore90: awayScore,
        liveHomeScore: homeScore,
        liveAwayScore: awayScore,
        resultFinalizedAt: new Date(),
        manualOverride: true,
      },
    });
    if (match.tieId && qualifiedTeamId) {
      await tx.knockoutTie.update({ where: { id: match.tieId }, data: { qualifiedTeamId } });
    }
    await tx.adminAuditLog.create({
      data: {
        actorRedditUsername: admin.redditUsername,
        action: "match.finalize",
        entityType: "Match",
        entityId: match.publicId,
        metadataJson: { homeScore, awayScore, qualifiedTeamId },
      },
    });
  });
  refreshMatchPages();
}

export async function clearMatchResultAction(formData: FormData) {
  const admin = await requireAdmin();
  const publicId = String(formData.get("matchPublicId") ?? "");
  const match = await prisma.match.findUnique({ where: { publicId } });
  if (!match) return;
  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: match.id }, data: { status: "SCHEDULED", homeScore90: null, awayScore90: null, liveHomeScore: null, liveAwayScore: null, resultFinalizedAt: null } });
    if (match.tieId && (match.leg === "SECOND" || match.stage === "FINAL")) await tx.knockoutTie.update({ where: { id: match.tieId }, data: { qualifiedTeamId: null } });
    await tx.adminAuditLog.create({ data: { actorRedditUsername: admin.redditUsername, action: "match.clear_result", entityType: "Match", entityId: match.publicId } });
  });
  refreshMatchPages();
}

export async function toggleMatchLockAction(formData: FormData) {
  await requireAdmin();
  const match = await prisma.match.findUnique({ where: { publicId: String(formData.get("matchPublicId") ?? "") } });
  if (!match) return;
  if (match.manuallyLockedAt && !canAdminUnlock(match)) return;
  await prisma.match.update({ where: { id: match.id }, data: { manuallyLockedAt: match.manuallyLockedAt ? null : new Date(), status: match.manuallyLockedAt ? "SCHEDULED" : "LOCKED" } });
  refreshMatchPages();
}

export async function saveMatchSettingsAction(formData: FormData) {
  await requireAdmin();
  const publicId = String(formData.get("matchPublicId") ?? "");
  const kickoff = new Date(String(formData.get("kickoffUtc") ?? ""));
  if (Number.isNaN(kickoff.getTime())) return;
  const externalId = String(formData.get("externalId") ?? "").trim();
  await prisma.match.update({
    where: { publicId },
    data: {
      kickoffUtc: kickoff,
      venue: String(formData.get("venue") ?? "").trim() || null,
      visibleToPlayers: formData.get("visibleToPlayers") === "on",
      externalProvider: externalId ? "espn" : null,
      externalId: externalId || null,
      providerUpdatesEnabled: Boolean(externalId) && formData.get("providerUpdatesEnabled") === "on",
    },
  });
  refreshMatchPages();
}

export async function forceEspnSyncAction(formData: FormData) {
  await requireAdmin();
  const match = await prisma.match.findUnique({ where: { publicId: String(formData.get("matchPublicId") ?? "") } });
  if (!match?.externalId) return;
  const provider = getConfiguredLiveScoreProvider();
  if (provider.name !== "espn") return;
  const providerMatch = await provider.getMatchByExternalId(match.externalId);
  if (!providerMatch) return;
  const data = buildProviderUpdateData(match, providerMatch);
  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: match.id }, data });
    const qualifiedEspnId = providerQualifiedTeamEspnId(providerMatch);
    if (match.tieId && qualifiedEspnId && providerMatch.status === "FINAL") {
      const team = await tx.team.findFirst({ where: { competitionId: match.competitionId, espnId: qualifiedEspnId } });
      if (team) await tx.knockoutTie.update({ where: { id: match.tieId }, data: { qualifiedTeamId: team.id } });
    }
  });
  refreshMatchPages();
}
