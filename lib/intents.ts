/** Map legacy / variant intent keys → canonical key */
export const NORMALIZE_INTENT: Record<string, string> = {
  // Legacy short keys → canonical
  study: "study_work",
  date: "romantic",
  date_chill: "romantic",
  quiet: "quiet_cafes",
  laptop: "laptop_friendly",
  group: "group_hangouts",
  budget: "budget_eats",
  desserts: "coffee_catch_up",
  coffee: "coffee_catch_up",
  outdoor: "outdoor_patio",
  chill: "chill_vibes",
  // Display-name strings → canonical
  "Study / Work": "study_work",
  "Date / Chill": "romantic",
  "Romantic": "romantic",
  "Chill Vibes": "chill_vibes",
  "Trending Now": "trending",
  "Quiet Cafes": "quiet_cafes",
  "Quiet Cafés": "quiet_cafes",
  "Laptop-Friendly": "laptop_friendly",
  "Group Hangouts": "group_hangouts",
  "Budget Eats": "budget_eats",
  "Coffee & Catch-Up": "coffee_catch_up",
  "Outdoor / Patio": "outdoor_patio",
  "Friend Recs": "recs_from_friends",
};

/** Canonical key → display name */
export const INTENT_LABELS: Record<string, string> = {
  study_work: "Study / Work",
  romantic: "Romantic",
  chill_vibes: "Chill Vibes",
  trending: "Trending Now",
  quiet_cafes: "Quiet Cafes",
  laptop_friendly: "Laptop-Friendly",
  group_hangouts: "Group Hangouts",
  budget_eats: "Budget Eats",
  coffee_catch_up: "Coffee & Catch-Up",
  outdoor_patio: "Outdoor / Patio",
  recs_from_friends: "Friend Recs",
};

/** Normalize an intent string to its canonical key */
export function normalizeIntent(intent: string): string {
  return NORMALIZE_INTENT[intent] || intent;
}

/** Get the display label for any intent string (normalizes first) */
export function intentLabel(intent: string): string {
  const key = normalizeIntent(intent);
  return INTENT_LABELS[key] || intent;
}
