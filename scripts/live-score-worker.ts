import "dotenv/config";
import { getConfiguredLiveScoreProvider } from "../src/lib/live";
import { importEspnLeaguePhaseFixtures } from "../src/lib/live/fixtureImport";
import { buildProviderUpdateData, providerQualifiedTeamEspnId } from "../src/lib/live/sync";
import { prisma } from "../src/lib/prisma";

const baseIntervalMs = Math.max(10, Number(process.env.LIVE_POLL_INTERVAL_SECONDS ?? 60)) * 1000;
const liveIntervalMs = Math.max(5, Number(process.env.LIVE_POLL_LIVE_INTERVAL_SECONDS ?? 10)) * 1000;
const hotWindowBeforeMs = 30 * 60 * 1000;
const hotWindowAfterMs = 3 * 60 * 60 * 1000;

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function hasHotMatch(providerName: string) {
  const now = new Date();
  return prisma.match.findFirst({
    where: {
      externalProvider: providerName,
      externalId: { not: null },
      providerUpdatesEnabled: true,
      resultFinalizedAt: null,
      kickoffUtc: { gte: new Date(now.getTime() - hotWindowAfterMs), lte: new Date(now.getTime() + hotWindowBeforeMs) },
    },
    select: { id: true },
  });
}

async function pollOnce() {
  const provider = getConfiguredLiveScoreProvider();
  if (provider.name === "manual" || !(await hasHotMatch(provider.name))) return false;
  let live = false;
  for (const providerMatch of await provider.getMatches()) {
    const match = await prisma.match.findFirst({ where: { externalProvider: providerMatch.provider, externalId: providerMatch.externalId } });
    if (!match) continue;
    live ||= ["LIVE", "HALF_TIME"].includes(providerMatch.status);
    const update = buildProviderUpdateData(match, providerMatch);
    await prisma.$transaction(async (tx) => {
      await tx.match.update({ where: { id: match.id }, data: update });
      const qualifiedEspnId = providerQualifiedTeamEspnId(providerMatch);
      if (match.tieId && qualifiedEspnId && providerMatch.status === "FINAL") {
        const team = await tx.team.findFirst({ where: { competitionId: match.competitionId, espnId: qualifiedEspnId } });
        if (team) await tx.knockoutTie.update({ where: { id: match.tieId }, data: { qualifiedTeamId: team.id } });
      }
      if (match.status !== providerMatch.status) {
        await tx.providerSyncLog.create({
          data: {
            matchId: match.id,
            provider: providerMatch.provider,
            externalId: providerMatch.externalId,
            action: "status.transition",
            statusBefore: match.status,
            statusAfter: providerMatch.status,
          },
        });
      }
    });
  }
  return live;
}

async function main() {
  console.log("UCL live-score worker starting");
  if (getConfiguredLiveScoreProvider().name === "espn" && process.env.ESPN_AUTO_IMPORT_FIXTURES !== "false") {
    const result = await importEspnLeaguePhaseFixtures();
    console.log(`ESPN fixtures ready: ${result.teams} teams, ${result.matches} matches.`);
  }
  let failures = 0;
  for (;;) {
    try {
      const live = await pollOnce();
      failures = 0;
      await sleep(live ? liveIntervalMs : baseIntervalMs);
    } catch (error) {
      failures += 1;
      console.error("Live-score poll failed", error);
      await sleep(Math.min(300_000, baseIntervalMs * 2 ** failures));
    }
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
