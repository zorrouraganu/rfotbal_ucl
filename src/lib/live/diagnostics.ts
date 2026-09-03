import "server-only";

import { performance } from "node:perf_hooks";
import { EspnProvider } from "./espnProvider";
import type { NormalizedProviderMatch } from "./types";

export type EspnProbe = {
  matches: NormalizedProviderMatch[];
  error: string | null;
  latencyMs: number;
};

export async function probeEspnFeed(): Promise<EspnProbe> {
  const startedAt = performance.now();
  try {
    const matches = await new EspnProvider().getMatches();
    return {
      matches,
      error: null,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : "ESPN request failed",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
