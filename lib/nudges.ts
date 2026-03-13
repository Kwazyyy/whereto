// Progressive nudge system — localStorage-based one-time nudge tracking

export const NUDGE_FIRST_VISIT_PHOTO = "first_visit_photo";
export const NUDGE_WELCOME_BACK = "welcome_back";
export const NUDGE_10_SAVES_SHARE = "10_saves_share";

const LAST_ACTIVE_KEY = "savrd_last_active";

export function hasSeenNudge(nudgeType: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`nudge_seen_${nudgeType}`) === "true";
}

export function markNudgeSeen(nudgeType: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`nudge_seen_${nudgeType}`, "true");
}

export function shouldShowNudge(nudgeType: string): boolean {
  return !hasSeenNudge(nudgeType);
}

export function recordLastActive(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

export function getDaysSinceLastActive(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!raw) return 0;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return 0;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

export function shouldShowWelcomeBack(): boolean {
  return getDaysSinceLastActive() >= 3 && shouldShowNudge(NUDGE_WELCOME_BACK);
}
