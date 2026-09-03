# UCL Predictions

Romanian-first UEFA Champions League prediction app for the 2026–27 season. Players authenticate exclusively with Reddit, choose one betting-style market per match (`1`, `X`, `2`, `1X`, `X2`, or `12`), and add a qualifying-team pick on knockout second legs.

The source is published under the MIT license. If you are evaluating whether it is safe to sign in with Reddit, start with [Reddit account and privacy](./REDDIT-PRIVACY.md): it lists every requested permission and persisted field, with links to the implementing code.

## Rules

- Correct `1`, `X`, or `2`: 3 points.
- Correct `1X`, `X2`, or `12`: 1 point.
- Correct qualifying team on a second leg: 2 additional points.
- Every market is evaluated from the individual match result after 90 minutes.
- Extra time and penalties do not alter the match-market result.
- There are no predicted scorelines, exact-score bonuses, goal points, or meme props.

## Competition model

The league phase contains 36 clubs, eight matchdays, and 144 matches. Each club plays eight unique opponents—four at home and four away. The live table sends places 1–8 directly to the round of 16, places 9–24 to the knockout playoffs, and eliminates places 25–36.

The standings engine follows UEFA's ordered criteria: points, goal difference, goals scored, away goals, wins, and away wins. Once all clubs have completed eight games, opponent points, opponent goal difference, opponent goals, disciplinary points, and club coefficient are added.

Knockout playoffs through the semi-finals are modeled as two-legged ties. The final is a single match.

## Local setup

Requirements: Node.js 24+, npm, and Docker Desktop.

```powershell
copy .env.example .env
docker compose -p uclpredictions up -d postgres
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000/test-login` for development-only dummy identities. `u/satibagipula` enters the ESPN diagnostics screen; the other users enter the player app. The route returns 404 in production.

For real Reddit OAuth, create a Reddit web application and configure:

```env
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/reddit/callback
REDDIT_USER_AGENT=web:ucl-predictions:0.1 (by /u/satibagipula)
```

The OAuth client requests only the `identity` scope. Any successfully authenticated Reddit account becomes a player automatically. Administration is hardcoded to the normalized Reddit username `satibagipula`.

The player shell keeps its responsive horizontal navigation mounted, prefetches every primary tab, and uses navigation-scoped View Transitions. Visible tabs silently reconcile fresh server-rendered score, status, standings, and prediction data every 15 seconds and immediately after tab changes without reloading the document or displaying a spinner.

## ESPN diagnostics

`/admin/diagnostics` probes the normalized ESPN feed and shows request latency, current event states, database mapping coverage, update flags, manual overrides, and recent provider operations. The two admin actions synchronize the current score window or run the guarded 36-team/144-fixture reconciliation. Manually finalized results remain authoritative.

Deterministic scenario data is still available to local seed/test scripts. There is no production Simulation Center or browser route that resets live competition data.

## ESPN

Production uses the ESPN UEFA Champions League scoreboard:

```env
LIVE_SCORE_PROVIDER=espn
ESPN_SCOREBOARD_URL=https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard
```

Import the complete validated league-phase schedule from the admin dashboard or from the server:

```powershell
npm run sync:espn-fixtures
```

The importer requires exactly 36 clubs, 144 matches and eight 18-match matchdays, maps every ESPN event automatically, and refuses to replace a different schedule once real predictions exist. Manual finalized results remain protected. The worker polls around mapped, unfinished fixtures and records status transitions.

The production worker runs this validated import once on startup by default (`ESPN_AUTO_IMPORT_FIXTURES=true`), so a deployment activates the live schedule without a separate database reset.

When the one-time production conversion still contains predictions against the synthetic demo schedule, first take a verified database backup and run `npm run sync:espn-fixtures -- --replace-demo-predictions`. This explicit switch deletes only predictions attached to that demo competition; player accounts and sessions are retained.

## Verification

```powershell
npm run lint
npm test
npm run build
npm run playwright -- --project=mobile-chrome e2e/ucl-smoke.spec.ts
docker compose -f docker-compose.prod.yml -f docker-compose.vps.yml config
```

## Production

The public service runs at [ucl.rfotbal.ro](https://ucl.rfotbal.ro) in Docker behind an HTTPS reverse proxy. Production uses the validated ESPN 2026–27 league-phase schedule: 36 teams and 144 automatically mapped fixtures across eight matchdays. Real players are created exclusively through Reddit OAuth, `/test-login` is unavailable in production, and simulation reset remains disabled.

## Security and license

Please report vulnerabilities using GitHub's private vulnerability reporting rather than a public issue; see [SECURITY.md](./SECURITY.md). The project is available under the [MIT License](./LICENSE).
