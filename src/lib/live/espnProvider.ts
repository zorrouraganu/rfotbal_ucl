import type { MatchStatus } from "@prisma/client";
import type { LiveScoreProvider, NormalizedProviderMatch, NormalizedProviderTeam } from "./types";

type EspnStatus = { type?: { name?: string; state?: string; completed?: boolean } };
type EspnCompetitor = {
  id?: string | number;
  homeAway?: string;
  score?: string | number;
  advance?: boolean;
  team?: {
    id?: string | number;
    displayName?: string;
    abbreviation?: string;
    logo?: string;
  };
};
type EspnCompetition = {
  id?: string | number;
  date?: string;
  startDate?: string;
  status?: EspnStatus;
  competitors?: EspnCompetitor[];
  venue?: { fullName?: string };
  details?: Array<{
    scoringPlay?: boolean;
    shootout?: boolean;
    scoreValue?: number;
    clock?: { value?: number };
    team?: { id?: string | number };
  }>;
};
type EspnEvent = {
  id?: string | number;
  date?: string;
  status?: EspnStatus;
  season?: { slug?: string };
  competitions?: EspnCompetition[];
};

const API_URL =
  process.env.ESPN_SCOREBOARD_URL ??
  "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard";

export class EspnProvider implements LiveScoreProvider {
  name = "espn" as const;

  async getMatches() {
    return this.getMatchesForDateRange(process.env.ESPN_SCOREBOARD_DATES || rollingRange());
  }

  async getMatchesForDateRange(dates: string) {
    const response = await fetch(buildScoreboardUrl(dates), {
      cache: "no-store",
      headers: { "User-Agent": process.env.ESPN_USER_AGENT ?? "UCLPredictions/0.1" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`ESPN scoreboard returned ${response.status}.`);
    const payload = (await response.json()) as { events?: EspnEvent[] };
    return (payload.events ?? []).map((event) => this.normalizeProviderMatch(event));
  }

  async getLiveMatches() {
    return (await this.getMatches()).filter((match) =>
      ["LIVE", "HALF_TIME"].includes(match.status),
    );
  }

  async getMatchByExternalId(externalId: string) {
    return (await this.getMatches()).find((match) => match.externalId === externalId) ?? null;
  }

  normalizeProviderMatch(providerPayload: unknown): NormalizedProviderMatch {
    const event = providerPayload as EspnEvent;
    const competition = event.competitions?.[0];
    const statusPayload = competition?.status ?? event.status;
    const status = normalizeStatus(statusPayload);
    const home = competition?.competitors?.find((entry) => entry.homeAway === "home");
    const away = competition?.competitors?.find((entry) => entry.homeAway === "away");
    const liveHomeScore = numberOrNull(home?.score);
    const liveAwayScore = numberOrNull(away?.score);
    const needsRegulationRebuild = status === "FINAL" && wentBeyondRegulation(statusPayload);
    const regulation = needsRegulationRebuild
      ? scoreThroughRegulation(competition)
      : { home: liveHomeScore, away: liveAwayScore };

    return {
      provider: "espn",
      externalId: String(event.id ?? competition?.id ?? ""),
      status,
      homeTeam: normalizeTeam(home),
      awayTeam: normalizeTeam(away),
      liveHomeScore,
      liveAwayScore,
      homeScore90: status === "FINAL" ? regulation.home : null,
      awayScore90: status === "FINAL" ? regulation.away : null,
      kickoffUtc: parseDate(competition?.date ?? competition?.startDate ?? event.date),
      venue: competition?.venue?.fullName ?? null,
      seasonSlug: event.season?.slug ?? null,
      rawPayload: providerPayload,
    };
  }
}

function buildScoreboardUrl(dates: string) {
  const url = new URL(API_URL);
  url.searchParams.set("limit", "200");
  url.searchParams.set("dates", dates);
  return url.toString();
}

function rollingRange() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 14);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 14);
  return `${dateKey(start)}-${dateKey(end)}`;
}

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function normalizeStatus(status?: EspnStatus): MatchStatus {
  const name = String(status?.type?.name ?? "").toUpperCase();
  const state = String(status?.type?.state ?? "").toLowerCase();
  if (name.includes("POSTPONED")) return "POSTPONED";
  if (status?.type?.completed || state === "post") return "FINAL";
  if (name.includes("HALFTIME") || name.includes("HALF_TIME")) return "HALF_TIME";
  if (state === "in") return "LIVE";
  return "SCHEDULED";
}

function wentBeyondRegulation(status?: EspnStatus) {
  const name = String(status?.type?.name ?? "").toUpperCase();
  return name.includes("AET") || name.includes("EXTRA") || name.includes("PEN");
}

function normalizeTeam(competitor?: EspnCompetitor): NormalizedProviderTeam {
  return {
    externalId: String(competitor?.team?.id ?? competitor?.id ?? ""),
    name: competitor?.team?.displayName ?? null,
    abbreviation: competitor?.team?.abbreviation ?? null,
    crestUrl: competitor?.team?.logo ?? null,
    advanced: competitor?.advance === true,
  };
}

function scoreThroughRegulation(competition?: EspnCompetition) {
  const home = competition?.competitors?.find((entry) => entry.homeAway === "home");
  const away = competition?.competitors?.find((entry) => entry.homeAway === "away");
  const homeId = String(home?.team?.id ?? home?.id ?? "");
  const awayId = String(away?.team?.id ?? away?.id ?? "");
  let homeGoals = 0;
  let awayGoals = 0;
  let foundGoal = false;
  for (const detail of competition?.details ?? []) {
    if (!detail.scoringPlay || detail.shootout || (detail.clock?.value ?? 0) > 90 * 60) continue;
    foundGoal = true;
    const value = detail.scoreValue ?? 1;
    const teamId = String(detail.team?.id ?? "");
    if (teamId === homeId) homeGoals += value;
    if (teamId === awayId) awayGoals += value;
  }
  return foundGoal ? { home: homeGoals, away: awayGoals } : { home: null, away: null };
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
