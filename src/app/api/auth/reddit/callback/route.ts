import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { normalizeRedditUsername } from "@/lib/adminIdentity";
import { buildAppUrl } from "@/lib/appUrl";
import { setSessionCookie } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { exchangeRedditCodeForIdentity } from "@/lib/redditOAuth";
import { createSessionRecord } from "@/lib/sessions";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const denied = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ucl_reddit_oauth_state")?.value;
  cookieStore.delete("ucl_reddit_oauth_state");

  if (denied || !state || !code || !expectedState || state !== expectedState) {
    return NextResponse.redirect(buildAppUrl("/login?error=oauth-denied", request.url));
  }

  try {
    const identity = await exchangeRedditCodeForIdentity(code);
    const normalized = normalizeRedditUsername(identity.name);
    const player = await prisma.player.upsert({
      where: { redditId: identity.id },
      update: {
        redditUsername: identity.name,
        redditUsernameNormalized: normalized,
        isActive: true,
        lastLoginAt: new Date(),
      },
      create: {
        redditId: identity.id,
        redditUsername: identity.name,
        redditUsernameNormalized: normalized,
      },
    });
    const session = await createSessionRecord(prisma, player.id);
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.redirect(buildAppUrl("/account", request.url));
  } catch (error) {
    console.error(
      "Reddit OAuth callback failed:",
      error instanceof Error ? error.message : "unknown OAuth error",
    );
    return NextResponse.redirect(buildAppUrl("/login?error=oauth-failed", request.url));
  }
}
