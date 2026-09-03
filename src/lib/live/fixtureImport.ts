import type { MatchStatus, Prisma, Team } from "@prisma/client";
import { EspnProvider } from "./espnProvider";
import type { NormalizedProviderMatch } from "./types";
import { prisma } from "@/lib/prisma";

const DEFAULT_LEAGUE_PHASE_DATES = "20260801-20270201";

export type LeagueFixture = NormalizedProviderMatch & { matchday: number };

export type EspnFixtureImportResult = {
  teams: number;
  matches: number;
  replacedDemoData: boolean;
};

export function buildLeagueFixturePlan(matches: NormalizedProviderMatch[]): LeagueFixture[] {
  const candidates = matches
    .filter((match) => match.seasonSlug === "league-phase")
    .sort((a, b) => kickoffTime(a) - kickoffTime(b));

  if (candidates.length !== 144) {
    throw new Error(`ESPN fixture validation failed: expected 144 league-phase matches, received ${candidates.length}.`);
  }
  if (candidates.some((match) => !match.externalId || !match.kickoffUtc || !match.homeTeam.externalId || !match.awayTeam.externalId)) {
    throw new Error("ESPN fixture validation failed: one or more fixtures are missing an event, team, or kickoff identifier.");
  }

  const rounds: NormalizedProviderMatch[][] = [];
  for (const match of candidates) {
    const currentRound = rounds.at(-1);
    const previous = currentRound?.at(-1);
    if (!currentRound || !previous || kickoffTime(match) - kickoffTime(previous) > 4 * 86_400_000) {
      rounds.push([match]);
    } else {
      currentRound.push(match);
    }
  }
  if (rounds.length !== 8 || rounds.some((round) => round.length !== 18)) {
    throw new Error(`ESPN fixture validation failed: expected eight matchdays of 18 matches, received ${rounds.map((round) => round.length).join(", ")}.`);
  }

  const plan = rounds.flatMap((round, index) => round.map((match) => ({ ...match, matchday: index + 1 })));
  const teamCounts = new Map<string, { total: number; home: number; away: number }>();
  for (const match of plan) {
    countTeam(teamCounts, match.homeTeam.externalId, "home");
    countTeam(teamCounts, match.awayTeam.externalId, "away");
  }
  if (teamCounts.size !== 36 || [...teamCounts.values()].some((count) => count.total !== 8 || count.home !== 4 || count.away !== 4)) {
    throw new Error("ESPN fixture validation failed: the feed is not a 36-team, eight-match, four-home/four-away league phase.");
  }
  return plan;
}

export async function importEspnLeaguePhaseFixtures(options: { allowDemoPredictionReset?: boolean } = {}): Promise<EspnFixtureImportResult> {
  const competition = await prisma.competition.findFirst({ where: { isActive: true } });
  if (!competition) throw new Error("No active competition exists.");

  const provider = new EspnProvider();
  const plan = buildLeagueFixturePlan(await provider.getMatchesForDateRange(
    process.env.ESPN_LEAGUE_PHASE_DATES || DEFAULT_LEAGUE_PHASE_DATES,
  ));
  const externalIds = new Set(plan.map((match) => match.externalId));
  const [predictionCount, existingMatches] = await Promise.all([
    prisma.prediction.count({ where: { match: { competitionId: competition.id } } }),
    prisma.match.findMany({
      where: { competitionId: competition.id, stage: "LEAGUE_PHASE" },
      select: { externalProvider: true, externalId: true, manualOverride: true, manuallyLockedAt: true },
    }),
  ]);
  const hasUnmappedOrDifferentFixtures = existingMatches.some(
    (match) => match.externalProvider !== "espn" || !match.externalId || !externalIds.has(match.externalId),
  );
  const existingByExternalId = new Map(existingMatches
    .filter((match) => match.externalProvider === "espn" && match.externalId)
    .map((match) => [match.externalId as string, match]));
  const replaceDemoData = Boolean(competition.simulationScenario) || hasUnmappedOrDifferentFixtures;
  const mayResetDemoPredictions = Boolean(competition.simulationScenario) && options.allowDemoPredictionReset === true;
  if (replaceDemoData && predictionCount > 0 && !mayResetDemoPredictions) {
    throw new Error("Fixture import refused because existing predictions belong to a different schedule.");
  }

  await prisma.$transaction(async (tx) => {
    if (replaceDemoData) {
      if (mayResetDemoPredictions) {
        await tx.prediction.deleteMany({ where: { match: { competitionId: competition.id } } });
      }
      const competitionMatches = await tx.match.findMany({
        where: { competitionId: competition.id },
        select: { id: true },
      });
      await tx.providerSyncLog.deleteMany({ where: { matchId: { in: competitionMatches.map((match) => match.id) } } });
      await tx.match.deleteMany({ where: { competitionId: competition.id } });
      await tx.knockoutTie.deleteMany({ where: { competitionId: competition.id } });
      await tx.team.deleteMany({ where: { competitionId: competition.id } });
    }

    const teams = await upsertTeams(tx, competition.id, plan);
    for (const fixture of plan) {
      const homeTeam = teams.get(fixture.homeTeam.externalId);
      const awayTeam = teams.get(fixture.awayTeam.externalId);
      if (!homeTeam || !awayTeam || !fixture.kickoffUtc) throw new Error("Validated ESPN fixture could not be mapped.");
      const final = fixture.status === "FINAL" && fixture.homeScore90 !== null && fixture.awayScore90 !== null;
      const data = {
        competitionId: competition.id,
        stage: "LEAGUE_PHASE" as const,
        leg: "SINGLE" as const,
        matchday: fixture.matchday,
        label: `Etapa ${fixture.matchday}`,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffUtc: fixture.kickoffUtc,
        venue: fixture.venue,
        status: fixture.status as MatchStatus,
        liveHomeScore: fixture.liveHomeScore,
        liveAwayScore: fixture.liveAwayScore,
        homeScore90: fixture.homeScore90,
        awayScore90: fixture.awayScore90,
        resultFinalizedAt: final ? new Date() : null,
        visibleToPlayers: true,
        externalProvider: "espn",
        externalId: fixture.externalId,
        providerUpdatesEnabled: true,
        manualOverride: false,
        providerLastSyncAt: new Date(),
        providerLastStatus: fixture.status,
        providerRawPayload: fixture.rawPayload as Prisma.InputJsonValue,
      };
      const existing = existingByExternalId.get(fixture.externalId);
      const protectedUpdate = {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        matchday: fixture.matchday,
        label: `Etapa ${fixture.matchday}`,
        kickoffUtc: fixture.kickoffUtc,
        venue: fixture.venue,
        visibleToPlayers: true,
        externalProvider: "espn",
        externalId: fixture.externalId,
        providerUpdatesEnabled: true,
        providerLastSyncAt: new Date(),
        providerLastStatus: fixture.status,
        providerRawPayload: fixture.rawPayload as Prisma.InputJsonValue,
      };
      await tx.match.upsert({
        where: { externalProvider_externalId: { externalProvider: "espn", externalId: fixture.externalId } },
        create: { publicId: `ucl-2026-27-espn-${fixture.externalId}`, ...data },
        update: existing?.manualOverride || existing?.manuallyLockedAt ? protectedUpdate : data,
      });
    }

    await tx.competition.update({
      where: { id: competition.id },
      data: { name: "UEFA Champions League", seasonLabel: "2026–27", simulationScenario: null },
    });
    await tx.providerSyncLog.create({
      data: {
        provider: "espn",
        action: replaceDemoData ? "fixtures.replace_demo" : "fixtures.refresh",
        metadataJson: { teams: teams.size, matches: plan.length },
      },
    });
  }, { timeout: 60_000 });

  return { teams: 36, matches: plan.length, replacedDemoData: replaceDemoData };
}

async function upsertTeams(tx: Prisma.TransactionClient, competitionId: string, fixtures: LeagueFixture[]) {
  const input = new Map<string, NormalizedProviderMatch["homeTeam"]>();
  for (const fixture of fixtures) {
    input.set(fixture.homeTeam.externalId, fixture.homeTeam);
    input.set(fixture.awayTeam.externalId, fixture.awayTeam);
  }
  const teams = new Map<string, Team>();
  for (const providerTeam of input.values()) {
    const name = providerTeam.name || providerTeam.abbreviation || `ESPN ${providerTeam.externalId}`;
    const abbreviation = (providerTeam.abbreviation || name.slice(0, 3)).toUpperCase();
    const data = { name, shortName: name, abbreviation, crestUrl: providerTeam.crestUrl };
    const team = await tx.team.upsert({
      where: { competitionId_espnId: { competitionId, espnId: providerTeam.externalId } },
      create: { competitionId, publicId: `ucl-team-${providerTeam.externalId}`, espnId: providerTeam.externalId, ...data },
      update: data,
    });
    teams.set(providerTeam.externalId, team);
  }
  return teams;
}

function kickoffTime(match: NormalizedProviderMatch) {
  return match.kickoffUtc?.getTime() ?? Number.POSITIVE_INFINITY;
}

function countTeam(counts: Map<string, { total: number; home: number; away: number }>, id: string, side: "home" | "away") {
  const count = counts.get(id) ?? { total: 0, home: 0, away: 0 };
  count.total += 1;
  count[side] += 1;
  counts.set(id, count);
}
