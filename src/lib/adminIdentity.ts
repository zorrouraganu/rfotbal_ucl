export const ADMIN_REDDIT_USERNAME = "satibagipula";

export function normalizeRedditUsername(username: string) {
  return username.trim().replace(/^u\//i, "").replace(/^@/, "").toLowerCase();
}

export function isAdminUsername(username: string) {
  return normalizeRedditUsername(username) === ADMIN_REDDIT_USERNAME;
}
