"use server";

import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export type ProfileActionState = { error?: string; success?: boolean };

export async function updateNicknameAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const player = await requirePlayer();
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length > 32) return { error: "Porecla poate avea cel mult 32 de caractere." };
  await prisma.player.update({ where: { id: player.id }, data: { nickname: nickname || null } });
  revalidatePath("/account");
  revalidatePath("/leaderboard");
  return { success: true };
}
