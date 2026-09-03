import "server-only";

import { normalizeRedditUsername } from "@/lib/adminIdentity";

const AUTHORIZE_URL = "https://www.reddit.com/api/v1/authorize";
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const IDENTITY_URL = "https://oauth.reddit.com/api/v1/me?raw_json=1";

type RedditIdentity = { id: string; name: string };

export function getRedditConfig() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const redirectUri =
    process.env.REDDIT_REDIRECT_URI ??
    `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/auth/reddit/callback`;
  const userAgent =
    process.env.REDDIT_USER_AGENT ?? "web:ucl-predictions:0.1 (by /u/satibagipula)";
  if (!clientId || !clientSecret) {
    throw new Error("Reddit OAuth is not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.");
  }
  return { clientId, clientSecret, redirectUri, userAgent };
}

export function buildRedditAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = getRedditConfig();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("duration", "temporary");
  url.searchParams.set("scope", "identity");
  return url;
}

export async function exchangeRedditCodeForIdentity(code: string): Promise<RedditIdentity> {
  const { clientId, clientSecret, redirectUri, userAgent } = getRedditConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body,
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(`Reddit token exchange failed (${tokenResponse.status}).`);
  const tokenPayload = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenPayload.access_token) {
    throw new Error(`Reddit token exchange did not return a token${tokenPayload.error ? `: ${tokenPayload.error}` : "."}`);
  }

  const identityResponse = await fetch(IDENTITY_URL, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "User-Agent": userAgent,
    },
    cache: "no-store",
  });
  if (!identityResponse.ok) throw new Error(`Reddit identity request failed (${identityResponse.status}).`);
  const identity = (await identityResponse.json()) as Partial<RedditIdentity>;
  if (!identity.id || !identity.name || !normalizeRedditUsername(identity.name)) {
    throw new Error("Reddit returned an invalid identity payload.");
  }
  return { id: identity.id, name: identity.name };
}
