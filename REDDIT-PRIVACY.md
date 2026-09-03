# Reddit account and privacy

This document is the plain-language inventory of what UCL Predictions does when you choose **Sign in with Reddit**. It is intentionally specific so that the claims can be checked against the source.

## The short version

UCL Predictions asks Reddit for one permission: `identity`. It uses the resulting temporary access token once, on the server, to fetch your Reddit account ID and username. The token is never written to the database, placed in the app session cookie, sent back to the browser, or reused as a refresh token.

The app cannot read your password, email, posts, comments, votes, saved items, subscriptions, moderation activity, chat, or private messages. It does not receive permission to post, comment, vote, subscribe, or modify your Reddit account.

Your Reddit username, optional app nickname, and leaderboard score are visible to other players. The sole administrator can see player identities and submitted predictions in the admin interface.

## Permission requested from Reddit

The authorization request uses:

- scope: `identity`
- access duration: `temporary`
- OAuth response type: authorization code

The relevant code is in [`src/lib/redditOAuth.ts`](./src/lib/redditOAuth.ts) and the two OAuth routes under [`src/app/api/auth/reddit`](./src/app/api/auth/reddit).

The temporary Reddit token exists only inside `exchangeRedditCodeForIdentity()`. It is used to request Reddit's `/api/v1/me` endpoint and is then discarded. This application does not request or store a Reddit refresh token.

## Data the application stores

After a successful login, the PostgreSQL database stores:

- Reddit's account ID for stable account matching;
- your current Reddit username and a normalized copy used for uniqueness and authorization;
- an optional nickname that you choose inside this app;
- account creation, update, and last-login timestamps;
- whether the local player account is active;
- your UCL predictions and their submission/update timestamps;
- app session records containing a SHA-256 hash of a random session token, its creation time, and expiry.

The raw app session token is stored only in an `HttpOnly`, `SameSite=Lax` cookie named `ucl_session`; JavaScript running in the page cannot read it. The database stores only the token hash. Cookies are marked `Secure` in production. App sessions expire after 365 days and are rejected after expiry even if an expired database record has not yet been cleaned up.

The random OAuth state is held for at most ten minutes in a separate `HttpOnly`, `SameSite=Lax` cookie, checked on callback to reduce login-forgery risk, and deleted when the callback is handled.

The exact schema is in [`prisma/schema.prisma`](./prisma/schema.prisma). Session creation and cookie handling are in [`src/lib/sessions.ts`](./src/lib/sessions.ts) and [`src/lib/auth-server.ts`](./src/lib/auth-server.ts).

## Data the application does not collect through Reddit

UCL Predictions does not request, retrieve, or store:

- your Reddit password or email address;
- posts, comments, drafts, or private messages;
- votes, saved items, followed users, or subscribed communities;
- moderator status, moderator actions, or account preferences;
- Reddit access tokens or refresh tokens after the identity request completes.

There are no advertising SDKs, tracking pixels, or third-party browser analytics in the application. The schema contains a legacy `PageView` model, but current application code does not write to it.

## Who sees what

- Other signed-in players can see your Reddit username, optional nickname, rank, and aggregate prediction performance on the leaderboard.
- The sole app administrator can see player usernames, nicknames, active status, and submitted match predictions through the admin interface.
- Database/server operators can necessarily access the stored application data and disaster-recovery backups. Raw Reddit access tokens are not present there because the app never persists them.
- ESPN supplies fixture, team, crest, and live-score data. The app does not send your Reddit identity or predictions to ESPN.

The web server and reverse proxy may produce ordinary security/access logs containing an IP address, user agent, requested path, timestamp, and response status. Those infrastructure logs are separate from Reddit OAuth data and are not used to build advertising profiles.

## Logout, revocation, and deletion

Logging out deletes the current app session record and clears its cookie. It does not delete your player profile, predictions, or other signed-in sessions.

Because the Reddit grant is temporary and no refresh token is retained, the app cannot continue making Reddit API requests on your behalf after login. You can also revoke the app from Reddit's account connection settings.

There is not yet a self-service account deletion screen. A player can request deletion from the operator; removing the player record cascades to app sessions and predictions. Operational backups may retain a recovery copy until their normal rotation completes. Do not post private deletion or security details in a public GitHub issue.

## Verification pointers

These are the most useful files for an independent review:

- OAuth URL, scope, token exchange, and `/api/v1/me`: [`src/lib/redditOAuth.ts`](./src/lib/redditOAuth.ts)
- OAuth state cookie and callback: [`src/app/api/auth/reddit/start/route.ts`](./src/app/api/auth/reddit/start/route.ts), [`src/app/api/auth/reddit/callback/route.ts`](./src/app/api/auth/reddit/callback/route.ts)
- local session cookies and logout: [`src/lib/auth-server.ts`](./src/lib/auth-server.ts), [`src/app/api/auth/logout/route.ts`](./src/app/api/auth/logout/route.ts)
- database fields and cascade rules: [`prisma/schema.prisma`](./prisma/schema.prisma)
- administrator authorization: [`src/lib/adminIdentity.ts`](./src/lib/adminIdentity.ts), [`src/lib/auth-server.ts`](./src/lib/auth-server.ts)

If source and this document ever disagree, treat that as a bug and report it privately.
