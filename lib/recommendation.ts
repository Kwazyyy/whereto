// ─── Haversine distance (km) ───

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Score components ───

function ratingScore(rating: number | null): number {
  if (rating == null) return 50;
  if (rating >= 5.0) return 100;
  if (rating >= 4.5) return 85;
  if (rating >= 4.0) return 70;
  if (rating >= 3.5) return 50;
  return 20;
}

function distanceScore(distKm: number | null): number {
  if (distKm == null) return 50;
  if (distKm <= 1) return 100;
  if (distKm <= 2) return 80;
  if (distKm <= 5) return 60;
  if (distKm <= 10) return 40;
  if (distKm <= 25) return 20;
  return 10;
}

function tagRelevanceScore(tagCount: number): number {
  if (tagCount >= 4) return 100;
  if (tagCount >= 3) return 80;
  if (tagCount >= 2) return 60;
  return 40;
}

function popularityScore(saveCount: number, maxSaves: number): number {
  if (maxSaves === 0) return 50;
  return Math.round((saveCount / maxSaves) * 100);
}

// ─── Composite score (0-100) ───

export interface ScoreInput {
  rating: number | null;
  distKm: number | null;
  tagCount: number;
  saveCount: number;
  maxSaves: number;
}

export function calculateMatchScore(input: ScoreInput): number {
  const r = ratingScore(input.rating) * 0.3;
  const d = distanceScore(input.distKm) * 0.25;
  const t = tagRelevanceScore(input.tagCount) * 0.2;
  const p = popularityScore(input.saveCount, input.maxSaves) * 0.15;
  const jitter = Math.random() * 100 * 0.1;
  return Math.min(100, Math.round(r + d + t + p + jitter));
}

// ─── Intent → vibeTag mapping ───

export const INTENT_TO_TAG: Record<string, string> = {
  // New intent names
  study_work: "study",
  date_chill: "date",
  trending: "trending",
  quiet_cafes: "quiet",
  laptop_friendly: "study",
  group_hangouts: "groups",
  budget_eats: "budget",
  coffee_catch_up: "coffee",
  outdoor_patio: "outdoor",
  // Legacy intent names (backwards compat with current frontend)
  study: "study",
  date: "date",
  quiet: "quiet",
  laptop: "study",
  group: "groups",
  budget: "budget",
  desserts: "coffee", // no dedicated desserts tag; closest match
  coffee: "coffee",
  outdoor: "outdoor",
};

// ─── Display tags ───

const DISPLAY_TAG_MAP: Record<string, string[]> = {
  study: ["Study Spot", "Laptop Friendly"],
  date: ["Date Night", "Romantic"],
  trending: ["Trending", "Popular"],
  quiet: ["Quiet", "Cozy"],
  groups: ["Group Friendly", "Social"],
  budget: ["Budget Friendly", "Good Value"],
  coffee: ["Coffee", "Café Vibes"],
  outdoor: ["Patio", "Outdoor Seating"],
};

export function generateDisplayTags(
  vibeTags: string[],
  intentTag: string
): string[] {
  const result: string[] = [];

  // Primary display tag for the current intent
  const intentDisplay = DISPLAY_TAG_MAP[intentTag];
  if (intentDisplay) {
    result.push(intentDisplay[0]);
  }

  // Display tags from other matching vibeTags
  for (const tag of vibeTags) {
    if (tag === intentTag) continue;
    const display = DISPLAY_TAG_MAP[tag];
    if (display && result.length < 3) {
      result.push(display[0]);
    }
  }

  // Pad to 2 with secondary intent display tag
  if (result.length < 2 && intentDisplay && intentDisplay.length > 1) {
    result.push(intentDisplay[1]);
  }

  return result.slice(0, 3);
}
