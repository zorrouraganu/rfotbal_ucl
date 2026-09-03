import { EspnProvider } from "./espnProvider";
import { ManualProvider } from "./manualProvider";
import type { LiveScoreProvider, LiveScoreProviderName } from "./types";

export function getConfiguredLiveScoreProvider(): LiveScoreProvider {
  const name = (process.env.LIVE_SCORE_PROVIDER ?? "manual") as LiveScoreProviderName;
  return name === "espn" ? new EspnProvider() : new ManualProvider();
}
