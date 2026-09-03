import type { MatchStatus } from "@prisma/client";

export type LiveScoreProviderName = "manual" | "espn";

export type NormalizedProviderTeam = {
  externalId: string;
  name: string | null;
  abbreviation: string | null;
  crestUrl: string | null;
  advanced: boolean;
};

export type NormalizedProviderMatch = {
  provider: LiveScoreProviderName;
  externalId: string;
  status: MatchStatus;
  homeTeam: NormalizedProviderTeam;
  awayTeam: NormalizedProviderTeam;
  liveHomeScore: number | null;
  liveAwayScore: number | null;
  homeScore90: number | null;
  awayScore90: number | null;
  kickoffUtc: Date | null;
  venue: string | null;
  seasonSlug: string | null;
  rawPayload: unknown;
};

export interface LiveScoreProvider {
  name: LiveScoreProviderName;
  getMatches(): Promise<NormalizedProviderMatch[]>;
  getLiveMatches(): Promise<NormalizedProviderMatch[]>;
  getMatchByExternalId(externalId: string): Promise<NormalizedProviderMatch | null>;
  normalizeProviderMatch(providerPayload: unknown): NormalizedProviderMatch;
}
