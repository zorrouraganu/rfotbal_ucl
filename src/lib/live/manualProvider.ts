import type { LiveScoreProvider, NormalizedProviderMatch } from "./types";

export class ManualProvider implements LiveScoreProvider {
  name = "manual" as const;
  async getMatches() { return [] as NormalizedProviderMatch[]; }
  async getLiveMatches() { return [] as NormalizedProviderMatch[]; }
  async getMatchByExternalId() { return null; }
  normalizeProviderMatch(): NormalizedProviderMatch {
    throw new Error("Manual mode does not normalize provider payloads.");
  }
}
