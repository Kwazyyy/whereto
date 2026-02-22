// ── Taste Compatibility Score ──────────────────────────────────────────────
// Pure utility – no DB access. Feed it two arrays of saves and get back a
// 0–100 score plus a human-readable breakdown.

export interface SaveRow {
    placeId: string;      // internal DB id (Place.id)
    googlePlaceId: string;
    name: string;
    photoRef: string | null;
    intent: string;
    priceLevel: number | null;  // 1–4
    rating: number | null;
}

export interface SharedPlace {
    placeId: string;
    googlePlaceId: string;
    name: string;
    photoRef: string | null;
    intent: string;
}

export interface CompatibilityResult {
    score: number;             // 0–100 integer
    sharedCount: number;
    sharedIntents: string[];   // ordered by frequency
    sharedPrice: string | null; // e.g. "$$"
    sharedPlaces: SharedPlace[];
    noData: boolean;           // true when both users have 0 saves
}

const INTENT_LABELS: Record<string, string> = {
    study: "Study / Work",
    date: "Date / Chill",
    trending: "Trending Now",
    quiet: "Quiet Cafés",
    laptop: "Laptop-Friendly",
    group: "Group Hangouts",
    budget: "Budget Eats",
    coffee: "Coffee & Catch-Up",
    outdoor: "Outdoor / Patio",
};

function priceLevelToString(level: number | null): string | null {
    if (!level || level < 1) return null;
    return "$".repeat(Math.min(level, 4));
}

function modalValue<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    const freq = new Map<T, number>();
    for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
    let best: T = arr[0];
    let bestCount = 0;
    for (const [val, count] of freq) {
        if (count > bestCount) { bestCount = count; best = val; }
    }
    return best;
}

export function calculateCompatibility(
    mySaves: SaveRow[],
    friendSaves: SaveRow[],
): CompatibilityResult {
    const noData = mySaves.length === 0 && friendSaves.length === 0;

    // ── Shared places ─────────────────────────────────────────────────────────
    const myIds = new Set(mySaves.map((s) => s.googlePlaceId));
    const shared = friendSaves.filter((s) => myIds.has(s.googlePlaceId));
    const sharedCount = shared.length;

    const sharedPlaces: SharedPlace[] = shared.map((s) => ({
        placeId: s.placeId,
        googlePlaceId: s.googlePlaceId,
        name: s.name,
        photoRef: s.photoRef,
        intent: INTENT_LABELS[s.intent] ?? s.intent,
    }));

    // ── Shared intents (Jaccard) ───────────────────────────────────────────────
    const myIntents = new Set(mySaves.map((s) => s.intent));
    const friendIntents = new Set(friendSaves.map((s) => s.intent));
    const intentUnion = new Set([...myIntents, ...friendIntents]);
    const intentIntersection = [...myIntents].filter((i) => friendIntents.has(i));
    const jaccardIntents = intentUnion.size === 0
        ? 0
        : intentIntersection.length / intentUnion.size;

    // Order shared intents by how often they appear combined across both users
    const intentFreq = new Map<string, number>();
    for (const s of [...mySaves, ...friendSaves]) {
        if (intentIntersection.includes(s.intent)) {
            intentFreq.set(s.intent, (intentFreq.get(s.intent) ?? 0) + 1);
        }
    }
    const sharedIntents = [...intentFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([intent]) => INTENT_LABELS[intent] ?? intent);

    // ── Price overlap ──────────────────────────────────────────────────────────
    const myPrices = mySaves.map((s) => s.priceLevel).filter((p): p is number => p !== null);
    const friendPrices = friendSaves.map((s) => s.priceLevel).filter((p): p is number => p !== null);
    const myModalPrice = modalValue(myPrices);
    const friendModalPrice = modalValue(friendPrices);
    const priceMatch = myModalPrice !== null && myModalPrice === friendModalPrice;
    const sharedPrice = priceMatch ? priceLevelToString(myModalPrice) : null;

    // ── Rating similarity ──────────────────────────────────────────────────────
    const myRatings = mySaves.map((s) => s.rating).filter((r): r is number => r !== null);
    const friendRatings = friendSaves.map((s) => s.rating).filter((r): r is number => r !== null);
    const myAvgRating = myRatings.length ? myRatings.reduce((a, b) => a + b, 0) / myRatings.length : null;
    const friendAvgRating = friendRatings.length ? friendRatings.reduce((a, b) => a + b, 0) / friendRatings.length : null;
    const ratingMatch =
        myAvgRating !== null &&
        friendAvgRating !== null &&
        Math.abs(myAvgRating - friendAvgRating) <= 0.5;

    // ── Final score ────────────────────────────────────────────────────────────
    // Shared saves (50): caps at 5 shared places
    const saveScore = Math.min(sharedCount / 5, 1) * 50;
    // Shared intents (30): Jaccard similarity
    const intentScore = jaccardIntents * 30;
    // Price match (10)
    const priceScore = priceMatch ? 10 : 0;
    // Rating similarity (10)
    const ratingScore = ratingMatch ? 10 : 0;

    const rawScore = saveScore + intentScore + priceScore + ratingScore;
    const score = Math.round(Math.min(rawScore, 100));

    return {
        score,
        sharedCount,
        sharedIntents,
        sharedPrice,
        sharedPlaces,
        noData,
    };
}
