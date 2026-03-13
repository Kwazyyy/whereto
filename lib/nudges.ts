// Progressive nudge system — localStorage-based one-time nudge tracking

export const NUDGE_FIRST_VISIT_PHOTO = "first_visit_photo";
export const NUDGE_WELCOME_BACK = "welcome_back";
export const NUDGE_10_SAVES_SHARE = "10_saves_share";

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
