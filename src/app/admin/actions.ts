"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import { importEspnLeaguePhaseFixtures } from "@/lib/live/fixtureImport";
import { prisma } from "@/lib/prisma";

export async function togglePlayerActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const publicId = String(formData.get("playerPublicId") ?? "");
  const player = await prisma.player.findUnique({ where: { publicId } });
  if (!player || player.id === admin.id) return;
  await prisma.player.update({ where: { id: player.id }, data: { isActive: !player.isActive } });
  await prisma.adminAuditLog.create({
    data: {
      actorRedditUsername: admin.redditUsername,
      action: player.isActive ? "player.deactivate" : "player.activate",
      entityType: "Player",
      entityId: player.publicId,
    },
  });
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");
}

export async function importEspnFixturesAction() {
  const admin = await requireAdmin();
  const result = await importEspnLeaguePhaseFixtures();
  await prisma.adminAuditLog.create({
    data: {
      actorRedditUsername: admin.redditUsername,
      action: "espn.fixtures.import",
      entityType: "Competition",
      metadataJson: result,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/diagnostics");
  revalidatePath("/admin/matches");
  revalidatePath("/app");
  revalidatePath("/standings");
}
