import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildRedditAuthorizationUrl } from "@/lib/redditOAuth";
import { generateSecureToken } from "@/lib/tokens";

export async function GET() {
  try {
    const state = generateSecureToken(24);
    (await cookies()).set("ucl_reddit_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return NextResponse.redirect(buildRedditAuthorizationUrl(state));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth-config", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }
}
