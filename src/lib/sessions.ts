import { addDays } from "@/lib/time";
import { generateSecureToken, sha256TokenHash } from "@/lib/tokens";

export const SESSION_COOKIE = "ucl_session";
export const SESSION_DAYS = 365;

export async function createSessionRecord(
  client: {
    session: {
      create: (args: {
        data: { playerId: string; tokenHash: string; expiresAt: Date };
      }) => Promise<unknown>;
    };
  },
  playerId: string,
  now = new Date(),
) {
  const token = generateSecureToken();
  const expiresAt = addDays(now, SESSION_DAYS);
  await client.session.create({
    data: { playerId, tokenHash: sha256TokenHash(token), expiresAt },
  });
  return { token, expiresAt };
}

export function getSessionTokenHash(rawToken: string) {
  return sha256TokenHash(rawToken);
}
