export function validateEnvironment(env: NodeJS.ProcessEnv) {
  const errors: string[] = [];
  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required.");
  if (env.NODE_ENV === "production") {
    if (!env.APP_BASE_URL) errors.push("APP_BASE_URL is required in production.");
    if (!env.REDDIT_CLIENT_ID) errors.push("REDDIT_CLIENT_ID is required in production.");
    if (!env.REDDIT_CLIENT_SECRET) errors.push("REDDIT_CLIENT_SECRET is required in production.");
  }
  if (env.LIVE_SCORE_PROVIDER && !["manual", "espn"].includes(env.LIVE_SCORE_PROVIDER)) {
    errors.push("LIVE_SCORE_PROVIDER must be manual or espn.");
  }
  return { ok: errors.length === 0, errors };
}
