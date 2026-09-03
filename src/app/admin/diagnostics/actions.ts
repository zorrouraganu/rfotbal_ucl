"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-server";
import { getConfiguredLiveScoreProvider } from "@/lib/live";
import { buildProviderUpdateData, providerQualifiedTeamEspnId } from "@/lib/live/sync";
import { prisma } from "@/lib/prisma";

function refreshLivePages() {
  revalidatePath("/admin");
  revalidatePath("/admin/diagnostics");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/predictions");
  revalidatePath("/app");
  revalidatePath("/standings");
  revalidatePath("/leaderboard");
  revalidatePath("/account");
}

export async function syncEspnNowAction() {
  const admin = await requireAdmin();
  const provider = getConfiguredLiveScoreProvider();
  if (provider.name !== "espn") redirect("/admin/diagnostics?result=provider-disabled");

  let result = "sync-ok";
  try {
    const providerMatches = await provider.getMatches();
    const externalIds = providerMatches.map((match) => match.externalId).filter(Boolean);
    const databaseMatches = await prisma.match.findMany({
      where: { externalProvider: "espn", externalId: { in: externalIds } },
    });
    const byExternalId = new Map(databaseMatches.map((match) => [match.externalId, match]));
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const providerMatch of providerMatches) {
        const match = byExternalId.get(providerMatch.externalId);
        if (!match) continue;
        await tx.match.update({
          where: { id: match.id },
          data: buildProviderUpdateData(match, providerMatch),
        });
        const qualifiedEspnId = providerQualifiedTeamEspnId(providerMatch);
        if (match.tieId && qualifiedEspnId && providerMatch.status === "FINAL") {
          const team = await tx.team.findFirst({
            where: { competitionId: match.competitionId, espnId: qualifiedEspnId },
          });
          if (team) {
            await tx.knockoutTie.update({
              where: { id: match.tieId },
              data: { qualifiedTeamId: team.id },
            });
          }
        }
        if (match.status !== providerMatch.status) {
          await tx.providerSyncLog.create({
            data: {
              matchId: match.id,
              provider: "espn",
              externalId: providerMatch.externalId,
              action: "status.transition.manual",
              statusBefore: match.status,
              statusAfter: providerMatch.status,
            },
          });
        }
        updated += 1;
      }
      await tx.providerSyncLog.create({
        data: {
          provider: "espn",
          action: "diagnostics.manual_sync",
          metadataJson: { received: providerMatches.length, mapped: databaseMatches.length, updated },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorRedditUsername: admin.redditUsername,
          action: "espn.manual_sync",
          entityType: "Provider",
          metadataJson: { received: providerMatches.length, mapped: databaseMatches.length, updated },
        },
      });
    }, { timeout: 30_000 });
  } catch (error) {
    result = "sync-error";
    const message = error instanceof Error ? error.message.slice(0, 240) : "unknown ESPN error";
    await prisma.providerSyncLog.create({
      data: { provider: "espn", action: "diagnostics.manual_sync.error", metadataJson: { message } },
    }).catch(() => undefined);
  }

  refreshLivePages();
  redirect(`/admin/diagnostics?result=${result}`);
}
