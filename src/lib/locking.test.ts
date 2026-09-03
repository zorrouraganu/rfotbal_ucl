import { describe, expect, it } from "vitest";
import { isPredictionLocked } from "@/lib/locking";

describe("prediction locking", () => {
  it("locks at kickoff and honors a manual lock", () => {
    const now = new Date("2026-09-15T18:00:00Z");
    expect(isPredictionLocked({ kickoffUtc: new Date("2026-09-15T19:00:00Z"), status: "SCHEDULED", manuallyLockedAt: null }, now)).toBe(false);
    expect(isPredictionLocked({ kickoffUtc: now, status: "SCHEDULED", manuallyLockedAt: null }, now)).toBe(true);
    expect(isPredictionLocked({ kickoffUtc: new Date("2026-09-15T19:00:00Z"), status: "SCHEDULED", manuallyLockedAt: now }, now)).toBe(true);
  });
});
