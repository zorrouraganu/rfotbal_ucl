"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { createSessionRecord } from "@/lib/sessions";
import { demoPlayers } from "@/lib/simulation";

export async function devLoginAction(formData: FormData) {
  if (process.env.NODE_ENV === "production") return;
  const username = String(formData.get("username") ?? "");
  const demo = demoPlayers.find((player) => player.redditUsername === username);
  if (!demo) return;
  const existing = await prisma.player.findFirst({ where: { redditUsernameNormalized: demo.redditUsername.toLowerCase() } });
  const player = existing ?? await prisma.player.create({
    data: { ...demo, redditUsernameNormalized: demo.redditUsername.toLowerCase() },
  });
  const session = await createSessionRecord(prisma, player.id);
  await setSessionCookie(session.token, session.expiresAt);
  redirect(username === "satibagipula" ? "/admin/diagnostics" : "/account");
}
