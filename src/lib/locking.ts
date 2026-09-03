export type LockableMatch = {
  kickoffUtc: Date;
  status: string;
  manuallyLockedAt: Date | null;
};

const lockedStatuses = new Set(["LOCKED", "LIVE", "HALF_TIME", "FINAL", "POSTPONED"]);

export function isPredictionLocked(match: LockableMatch, now = new Date()) {
  return (
    match.manuallyLockedAt !== null ||
    match.kickoffUtc <= now ||
    lockedStatuses.has(match.status)
  );
}

export function assertCanSubmitPrediction(match: LockableMatch, now = new Date()) {
  if (isPredictionLocked(match, now)) {
    throw new Error("Predicția este blocată: meciul a început sau a fost închis de administrator.");
  }
}

export function canAdminUnlock(match: LockableMatch) {
  return !["LIVE", "HALF_TIME", "FINAL"].includes(match.status);
}
