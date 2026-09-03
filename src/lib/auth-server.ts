import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminUsername } from "@/lib/adminIdentity";
import { prisma } from "@/lib/prisma";
import { getSessionTokenHash, SESSION_COOKIE, SESSION_DAYS } from "@/lib/sessions";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    ...cookieOptions,
    expires: expiresAt,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentPlayer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: getSessionTokenHash(token) },
    include: { player: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.player.isActive) return null;
  return session.player;
}

export async function requirePlayer() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");
  return player;
}

export async function requireAdmin() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login?returnTo=/admin");
  if (!isAdminUsername(player.redditUsername)) redirect("/account");
  return player;
}

export async function deleteCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: getSessionTokenHash(token) } });
  }
  await clearSessionCookie();
}
