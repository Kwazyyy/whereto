import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

// ─── Stale display-tag values to remove ───

const STALE_TAGS = [
  "Trending", "Open Now", "Popular", "New", "Highly Rated",
  "Top Rated", "Group Friendly",
];

// ─── Force overrides ───

const FORCE_OVERRIDES: Record<string, string[]> = {
  "Copacabana Brazilian Steakhouse - Vaughan": ["romantic", "trending", "groups"],
  "El Catrin Destileria": ["romantic", "trending"],
};

// ─── Romantic detection ───

const ROMANTIC_TYPES = [
  "restaurant", "steakhouse", "steak house", "bistro",
  "french restaurant", "italian restaurant", "japanese restaurant",
  "sushi restaurant", "cocktail bar", "wine bar", "lounge",
  "fine dining", "seafood restaurant", "mediterranean restaurant",
  "spanish restaurant", "tapas", "mexican restaurant",
  "thai restaurant", "korean restaurant", "indian restaurant",
  "greek restaurant", "middle eastern restaurant",
  "persian restaurant", "vietnamese restaurant", "brazilian restaurant",
];

const ANTI_ROMANTIC_TYPES = [
  "cafe", "coffee shop", "bakery", "fast", "bbq", "burger",
  "pub", "hookah", "pizza",
];

const ROMANTIC_NAME_KEYWORDS = /\b(bistro|wine|cocktail|tapas|fine|elegant|steakhouse)\b/i;
const ANTI_ROMANTIC_NAME = /\b(100%\s*veg|pure\s*veg|express|fast|quick)\b/i;

function shouldBeRomantic(place: {
  name: string;
  placeType: string;
  rating: number | null;
  priceLevel: number | null;
}): boolean {
  const type = place.placeType.toLowerCase();
  const nameLower = place.name.toLowerCase();

  // Anti-romantic checks
  if (ANTI_ROMANTIC_TYPES.some((t) => type.includes(t))) return false;
  if (ANTI_ROMANTIC_NAME.test(place.name)) return false;

  // Name-based romantic (bypasses type/rating/price requirements)
  if (ROMANTIC_NAME_KEYWORDS.test(nameLower)) return true;

  // Type + rating + price based romantic
  const isRomanticType = ROMANTIC_TYPES.some((t) => type.includes(t));
  const hasGoodRating = place.rating !== null && place.rating >= 4.2;
  // priceLevel 2, 3, 4, or null (include null since 52% missing price data)
  const hasRightPrice = place.priceLevel === null || place.priceLevel >= 2;

  return isRomanticType && hasGoodRating && hasRightPrice;
}

// ─── Chill detection ───

const CHILL_TYPES = [
  "cafe", "coffee shop", "bakery", "dessert", "brunch",
  "breakfast restaurant", "tea house", "tea room", "juice bar",
  "ice cream", "bubble tea", "pub", "bar",
];

const ANTI_CHILL_TYPES = ["steakhouse", "steak house", "fine dining"];

const CHILL_NAME_KEYWORDS = /\b(chill|cozy|garden|brunch|hangout|vibes)\b/i;

function shouldBeChill(place: {
  name: string;
  placeType: string;
  rating: number | null;
  priceLevel: number | null;
}): boolean {
  const type = place.placeType.toLowerCase();

  // Anti-chill checks
  if (ANTI_CHILL_TYPES.some((t) => type.includes(t))) return false;
  if (place.priceLevel === 4) return false;

  // Type-based chill
  if (CHILL_TYPES.some((t) => type.includes(t))) return true;

  // Name-based chill
  if (CHILL_NAME_KEYWORDS.test(place.name)) return true;

  return false;
}

// ─── Tiebreaker: resolve "both" into one ───

function resolveTiebreaker(place: {
  placeType: string;
  priceLevel: number | null;
}, isRomantic: boolean, isChill: boolean): { romantic: boolean; chill: boolean } {
  if (!(isRomantic && isChill)) return { romantic: isRomantic, chill: isChill };

  const type = place.placeType.toLowerCase();
  const price = place.priceLevel;

  // priceLevel 3 or 4 → romantic only
  if (price !== null && price >= 3) return { romantic: true, chill: false };

  // priceLevel 1 → chill only
  if (price === 1) return { romantic: false, chill: true };

  // priceLevel 2 or null → decide by type
  const isCafeType = ["cafe", "coffee shop", "bakery"].some((t) => type.includes(t));
  if (isCafeType) return { romantic: false, chill: true };

  // Restaurant or anything else → romantic
  return { romantic: true, chill: false };
}

async function main() {
  const places = await prisma.place.findMany();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  RETAG: romantic / chill (v2 — tighter rules)`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places in DB: ${places.length}\n`);

  // Build working tag map
  const tagMap = new Map<string, string[]>();
  for (const p of places) {
    const vt = p.vibeTags;
    tagMap.set(p.id, Array.isArray(vt) ? [...(vt as string[])] : []);
  }

  const updates: { id: string; vibeTags: string[] }[] = [];

  function queueUpdate(id: string, tags: string[]) {
    const existing = updates.find((u) => u.id === id);
    if (existing) {
      existing.vibeTags = tags;
    } else {
      updates.push({ id, vibeTags: tags });
    }
  }

  // ─── Step 0: Clean up stale display-tag values from ALL places ───
  console.log(`--- Step 0: Remove stale display-tag values ---\n`);
  let staleCleanup = 0;
  for (const p of places) {
    const tags = tagMap.get(p.id)!;
    const cleaned = tags.filter((t) => !STALE_TAGS.includes(t));
    if (cleaned.length !== tags.length) {
      const removed = tags.filter((t) => STALE_TAGS.includes(t));
      console.log(`  ${p.name.padEnd(45)} removed: [${removed.join(", ")}]`);
      tagMap.set(p.id, cleaned);
      queueUpdate(p.id, cleaned);
      staleCleanup++;
    }
  }
  if (staleCleanup === 0) console.log(`  No stale tags found.`);
  console.log(`  Cleaned: ${staleCleanup}\n`);

  // ─── Step 1: Remove all existing "romantic", "chill", "date" tags ───
  console.log(`--- Step 1: Remove existing romantic/chill/date tags ---\n`);
  let resetCount = 0;
  for (const p of places) {
    const tags = tagMap.get(p.id)!;
    const cleaned = tags.filter((t) => t !== "romantic" && t !== "chill" && t !== "date");
    if (cleaned.length !== tags.length) {
      tagMap.set(p.id, cleaned);
      queueUpdate(p.id, cleaned);
      resetCount++;
    }
  }
  console.log(`  Reset ${resetCount} places (removed romantic/chill/date)\n`);

  // ─── Step 2: Apply force overrides ───
  console.log(`--- Step 2: Force overrides ---\n`);
  for (const p of places) {
    if (FORCE_OVERRIDES[p.name]) {
      const forcedTags = FORCE_OVERRIDES[p.name];
      tagMap.set(p.id, forcedTags);
      queueUpdate(p.id, forcedTags);
      console.log(`  ${p.name} → [${forcedTags.join(", ")}]`);
    }
  }
  console.log();

  // ─── Step 3: Apply romantic/chill rules to ALL places (skip force-overridden) ───
  console.log(`--- Step 3: Apply romantic/chill rules ---\n`);

  const forcedNames = new Set(Object.keys(FORCE_OVERRIDES));
  let romanticOnly = 0;
  let chillOnly = 0;
  let bothCount = 0;
  let neitherCount = 0;
  const romanticPlaces: { name: string; placeType: string; rating: number | null; priceLevel: number | null; tags: string[] }[] = [];
  const chillPlaces: { name: string; placeType: string; rating: number | null; priceLevel: number | null }[] = [];

  for (const p of places) {
    if (forcedNames.has(p.name)) continue;

    const rawRomantic = shouldBeRomantic(p);
    const rawChill = shouldBeChill(p);

    // Skip places that match neither
    if (!rawRomantic && !rawChill) continue;

    // Apply tiebreaker
    const { romantic, chill } = resolveTiebreaker(p, rawRomantic, rawChill);

    const tags = tagMap.get(p.id)!;
    let changed = false;

    if (romantic && !tags.includes("romantic")) {
      tags.push("romantic");
      changed = true;
    }
    if (chill && !tags.includes("chill")) {
      tags.push("chill");
      changed = true;
    }

    if (changed) {
      tagMap.set(p.id, tags);
      queueUpdate(p.id, tags);
    }

    // Track stats (only for places that got a new tag)
    if (romantic && chill) {
      bothCount++;
      console.log(`  BOTH     ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"}`);
    } else if (romantic) {
      romanticOnly++;
      console.log(`  ROMANTIC ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"}`);
    } else if (chill) {
      chillOnly++;
      console.log(`  CHILL    ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"}`);
    }

    if (romantic) {
      romanticPlaces.push({ name: p.name, placeType: p.placeType, rating: p.rating, priceLevel: p.priceLevel, tags });
    }
    if (chill) {
      chillPlaces.push({ name: p.name, placeType: p.placeType, rating: p.rating, priceLevel: p.priceLevel });
    }
  }

  // Count places that previously had romantic/chill (from step 1 reset) but now got neither
  // These are the "warnings"
  const warningPlaces: { name: string; placeType: string; rating: number | null; priceLevel: number | null }[] = [];
  for (const p of places) {
    if (forcedNames.has(p.name)) continue;
    const tags = tagMap.get(p.id)!;
    // Check if this place had romantic or chill before reset but now has neither
    const origTags = Array.isArray(p.vibeTags) ? (p.vibeTags as string[]) : [];
    const hadDateRelated = origTags.includes("romantic") || origTags.includes("chill") || origTags.includes("date");
    const hasNow = tags.includes("romantic") || tags.includes("chill");
    if (hadDateRelated && !hasNow) {
      neitherCount++;
      warningPlaces.push({ name: p.name, placeType: p.placeType, rating: p.rating, priceLevel: p.priceLevel });
    }
  }

  // ─── Step 4: Write updates ───
  console.log(`\n--- Writing ${updates.length} updates to database ---\n`);
  for (const u of updates) {
    await prisma.place.update({
      where: { id: u.id },
      data: { vibeTags: u.vibeTags },
    });
  }
  console.log(`  Done.\n`);

  // ─── Report ───
  console.log(`${"=".repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`  Romantic only:         ${romanticOnly}`);
  console.log(`  Chill only:            ${chillOnly}`);
  console.log(`  Both:                  ${bothCount}`);
  console.log(`  Neither (warnings):    ${neitherCount}`);
  console.log(`  Stale tags removed:    ${staleCleanup}\n`);

  // ─── Warnings ───
  if (warningPlaces.length > 0) {
    console.log(`--- WARNING: ${warningPlaces.length} places had date/romantic/chill but now have neither ---\n`);
    for (const p of warningPlaces) {
      console.log(`  ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"}`);
    }
    console.log();
  }

  // ─── Full romantic list ───
  // Include force-overridden places that have "romantic"
  for (const p of places) {
    if (forcedNames.has(p.name)) {
      const tags = tagMap.get(p.id)!;
      if (tags.includes("romantic")) {
        romanticPlaces.push({ name: p.name, placeType: p.placeType, rating: p.rating, priceLevel: p.priceLevel, tags });
      }
    }
  }

  console.log(`--- All "romantic" tagged places (${romanticPlaces.length}) ---\n`);
  for (const p of romanticPlaces) {
    console.log(`  ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"} tags: [${p.tags.join(", ")}]`);
  }

  // ─── Full chill list ───
  console.log(`\n--- All "chill" tagged places (${chillPlaces.length}) ---\n`);
  for (const p of chillPlaces) {
    console.log(`  ${p.name.padEnd(45)} type: ${p.placeType.padEnd(25)} r: ${p.rating ?? "?"} p: ${p.priceLevel ?? "?"}`);
  }

  // ─── Updated tag distribution ───
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  UPDATED TAG DISTRIBUTION`);
  console.log(`${"=".repeat(60)}\n`);

  const tagCounts = new Map<string, number>();
  let totalTags = 0;
  let zeroTagCount = 0;
  for (const [, tags] of tagMap) {
    if (tags.length === 0) zeroTagCount++;
    totalTags += tags.length;
    for (const t of tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  console.log(`  Places with 0 tags: ${zeroTagCount}`);
  console.log(`  Average tags per place: ${(totalTags / places.length).toFixed(1)}\n`);

  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    const bar = "#".repeat(Math.min(Math.round(count / 2), 60));
    console.log(`  ${tag.padEnd(12)} ${String(count).padStart(4)}  ${bar}`);
  }
  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
