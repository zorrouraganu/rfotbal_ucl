import type { Match, Prisma } from "@prisma/client";
import type { NormalizedProviderMatch } from "./types";

type SyncableMatch = Pick<
  Match,
  | "status"
  | "kickoffUtc"
  | "resultFinalizedAt"
  | "manuallyLockedAt"
  | "manualOverride"
  | "providerUpdatesEnabled"
  | "homeScore90"
  | "awayScore90"
>;

export function buildProviderUpdateData(
  match: SyncableMatch,
  providerMatch: NormalizedProviderMatch,
  options: { allowFinalizedOverwrite?: boolean } = {},
): Prisma.MatchUpdateInput {
  const data: Prisma.MatchUpdateInput = {
    providerLastSyncAt: new Date(),
    providerLastStatus: providerMatch.status,
    providerRawPayload: providerMatch.rawPayload as Prisma.InputJsonValue,
  };
  if (!match.providerUpdatesEnabled) return data;
  if (match.resultFinalizedAt && !options.allowFinalizedOverwrite) return data;

  const liveStatusIsPlausible =
    !["LIVE", "HALF_TIME"].includes(providerMatch.status) || match.kickoffUtc <= new Date();
  const preservesManualLock = Boolean(match.manuallyLockedAt) && providerMatch.status === "SCHEDULED";
  if (liveStatusIsPlausible && !preservesManualLock) data.status = providerMatch.status;
  data.liveHomeScore = providerMatch.liveHomeScore;
  data.liveAwayScore = providerMatch.liveAwayScore;

  if (!match.manualOverride || options.allowFinalizedOverwrite) {
    data.homeScore90 = providerMatch.homeScore90;
    data.awayScore90 = providerMatch.awayScore90;
  } else if (providerMatch.status === "FINAL") {
    if (match.homeScore90 === null) data.homeScore90 = providerMatch.homeScore90;
    if (match.awayScore90 === null) data.awayScore90 = providerMatch.awayScore90;
  }

  const finalHome = providerMatch.homeScore90 ?? match.homeScore90;
  const finalAway = providerMatch.awayScore90 ?? match.awayScore90;
  if (providerMatch.status === "FINAL" && finalHome !== null && finalAway !== null) {
    data.resultFinalizedAt = new Date();
  }
  return data;
}

export function providerQualifiedTeamEspnId(providerMatch: NormalizedProviderMatch) {
  if (providerMatch.homeTeam.advanced) return providerMatch.homeTeam.externalId;
  if (providerMatch.awayTeam.advanced) return providerMatch.awayTeam.externalId;
  return null;
}
