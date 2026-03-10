import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

// ─── Helpers ───

function typeIncludes(placeType: string, keywords: string[]): boolean {
  const t = placeType.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

function nameMatches(name: string, pattern: RegExp): boolean {
  return pattern.test(name);
}

// ─── Tag rule types ───

interface PlaceData {
  name: string;
  placeType: string;
  rating: number | null;
  priceLevel: number | null;
}

// ─── TRENDING ───

function isTrending(p: PlaceData): boolean {
  return p.rating !== null && p.rating >= 4.5;
}

// ─── STUDY ───

const STUDY_TYPES = ["cafe", "coffee shop", "bakery", "tea house"];
const STUDY_EXCLUDE_TYPES = ["restaurant", "bar", "pub", "lounge", "steakhouse", "hookah"];

function isStudy(p: PlaceData): boolean {
  if (typeIncludes(p.placeType, STUDY_EXCLUDE_TYPES)) return false;
  return typeIncludes(p.placeType, STUDY_TYPES);
}

// ─── QUIET ───

const QUIET_TYPES = ["cafe", "coffee shop", "bakery", "tea house"];
const QUIET_EXCLUDE_TYPES = ["bar", "pub", "hookah", "grill", "sports", "bbq"];

function isQuiet(p: PlaceData): boolean {
  if (typeIncludes(p.placeType, QUIET_EXCLUDE_TYPES)) return false;
  return typeIncludes(p.placeType, QUIET_TYPES);
}

// ─── COFFEE ───

const COFFEE_TYPES = [
  "cafe", "coffee shop", "bakery", "dessert", "tea house",
  "ice cream", "juice bar", "bubble tea",
];
const COFFEE_NAME_RE = /\b(coffee|espresso|brew|roast|latte|cafe|café|bakery|pastry|donut|doughnut|tea)\b/i;

function isCoffee(p: PlaceData): boolean {
  return typeIncludes(p.placeType, COFFEE_TYPES) || COFFEE_NAME_RE.test(p.name);
}

// ─── ROMANTIC ───

const ROMANTIC_TYPES = [
  "restaurant", "steakhouse", "steak house", "bistro",
  "french restaurant", "italian restaurant", "japanese restaurant",
  "sushi restaurant", "cocktail bar", "wine bar", "fine dining",
  "seafood restaurant", "mediterranean restaurant",
  "spanish restaurant", "tapas", "thai restaurant",
  "korean restaurant", "indian restaurant", "greek restaurant",
  "middle eastern restaurant", "persian restaurant",
  "vietnamese restaurant", "brazilian restaurant",
];
const ROMANTIC_EXCLUDE_TYPES = [
  "cafe", "coffee shop", "bakery", "pub", "hookah", "pizza", "burger", "bbq",
];
const ROMANTIC_EXCLUDE_NAME = /\b(100%\s*veg|pure\s*veg|express|fast|quick|buffet|all you can|wings|bbq|burger|pizza|shawarma|falafel|pho|ramen|noodle|deli)\b/i;
const ROMANTIC_NAME_UPSCALE = /\b(bistro|wine|cocktail|tapas|fine|elegant|intimate|lounge)\b/i;

function isRomantic(p: PlaceData): boolean {
  // Exclusions first
  if (typeIncludes(p.placeType, ROMANTIC_EXCLUDE_TYPES)) return false;
  if (ROMANTIC_EXCLUDE_NAME.test(p.name)) return false;

  // Must be a sit-down restaurant type
  if (!typeIncludes(p.placeType, ROMANTIC_TYPES)) return false;

  const rating = p.rating ?? 0;
  const price = p.priceLevel;

  // priceLevel 3 or 4 AND rating 4.2+
  if (price !== null && price >= 3 && rating >= 4.2) return true;

  // priceLevel 2 AND name contains upscale keywords AND rating 4.2+
  if (price === 2 && rating >= 4.2 && ROMANTIC_NAME_UPSCALE.test(p.name)) return true;

  // priceLevel null AND rating 4.5+ AND type is restaurant
  if (price === null && rating >= 4.5 && typeIncludes(p.placeType, ["restaurant"])) return true;

  return false;
}

// ─── CHILL ───

const CHILL_TYPES = [
  "cafe", "coffee shop", "bakery", "dessert", "brunch",
  "breakfast", "tea house", "juice bar", "ice cream", "bubble tea",
];
const CHILL_PUB_BAR = ["pub", "bar"];
const CHILL_EXCLUDE_TYPES = ["steakhouse", "fine dining"];
const CHILL_NAME_RE = /\b(chill|cozy|garden|brunch|hangout|vibes)\b/i;

function isChill(p: PlaceData): boolean {
  if (typeIncludes(p.placeType, CHILL_EXCLUDE_TYPES)) return false;
  if (p.priceLevel === 4) return false;

  // Type-based
  if (typeIncludes(p.placeType, CHILL_TYPES)) return true;

  // Pub or bar
  if (typeIncludes(p.placeType, CHILL_PUB_BAR)) return true;

  // Restaurant with priceLevel 1 or 2
  if (typeIncludes(p.placeType, ["restaurant"]) && p.priceLevel !== null && p.priceLevel <= 2) return true;

  // Name-based
  if (CHILL_NAME_RE.test(p.name)) return true;

  return false;
}

// ─── GROUPS ───

const GROUPS_TYPES = [
  "pub", "bar", "hookah", "pizza", "burger",
  "korean bbq", "bbq", "grill", "wings",
];
const GROUPS_EXCLUDE_TYPES = ["cafe", "coffee shop", "bakery"];
const GROUPS_NAME_RE = /\b(grill|sports|pub|bar|patio|garden|bbq|pizza|wings|brewpub|brewery|tavern)\b/i;

function isGroups(p: PlaceData): boolean {
  if (p.priceLevel !== null && p.priceLevel >= 3) return false;
  if (typeIncludes(p.placeType, GROUPS_EXCLUDE_TYPES)) return false;

  // Type-based
  if (typeIncludes(p.placeType, GROUPS_TYPES)) return true;

  // Name-based
  if (GROUPS_NAME_RE.test(p.name)) return true;

  // Restaurant with priceLevel 1
  if (typeIncludes(p.placeType, ["restaurant"]) && p.priceLevel === 1) return true;

  return false;
}

// ─── BUDGET ───

const BUDGET_TYPES = [
  "shawarma", "falafel", "ramen", "noodle", "dumpling",
  "taco", "burrito", "pizza", "pho", "banh mi", "deli",
];
const BUDGET_NAME_RE = /\b(cheap|deal|special|combo|express|quick)\b/i;

function isBudget(p: PlaceData): boolean {
  if (p.priceLevel === 1) return true;
  if (typeIncludes(p.placeType, BUDGET_TYPES)) return true;
  if (BUDGET_NAME_RE.test(p.name)) return true;
  return false;
}

// ─── OUTDOOR ───

const OUTDOOR_NAME_RE = /\b(patio|garden|terrace|rooftop|outdoor|park|courtyard)\b/i;

function isOutdoor(p: PlaceData): boolean {
  return OUTDOOR_NAME_RE.test(p.name);
}

// ─── Tiebreaker: romantic vs chill ───

function applyTiebreaker(
  p: PlaceData,
  romantic: boolean,
  chill: boolean
): { romantic: boolean; chill: boolean } {
  if (!(romantic && chill)) return { romantic, chill };

  const price = p.priceLevel;
  const type = p.placeType.toLowerCase();
  const rating = p.rating ?? 0;
  const isCafeType = ["cafe", "coffee shop", "bakery"].some((t) => type.includes(t));

  // priceLevel 3 or 4 → romantic only
  if (price !== null && price >= 3) return { romantic: true, chill: false };

  // priceLevel 1 → chill only
  if (price === 1) return { romantic: false, chill: true };

  // priceLevel 2 + restaurant → romantic only
  if (price === 2 && type.includes("restaurant")) return { romantic: true, chill: false };

  // priceLevel 2 + cafe/coffee/bakery → chill only
  if (price === 2 && isCafeType) return { romantic: false, chill: true };

  // priceLevel null + restaurant + rating 4.5+ → romantic only
  if (price === null && type.includes("restaurant") && rating >= 4.5) return { romantic: true, chill: false };

  // priceLevel null + restaurant + rating < 4.5 → chill only
  if (price === null && type.includes("restaurant") && rating < 4.5) return { romantic: false, chill: true };

  // priceLevel null + cafe/coffee/bakery → chill only
  if (price === null && isCafeType) return { romantic: false, chill: true };

  // Any remaining → chill
  return { romantic: false, chill: true };
}

// ─── Fallback for 0 tags ───

function fallbackTags(p: PlaceData): string[] {
  const type = p.placeType.toLowerCase();
  if (["cafe", "coffee shop", "bakery"].some((t) => type.includes(t))) return ["coffee", "quiet"];
  if (type.includes("restaurant") && p.rating !== null && p.rating >= 4.5) return ["trending"];
  if (type.includes("restaurant")) return ["chill"];
  if (["bar", "pub"].some((t) => type.includes(t))) return ["groups"];
  return ["chill"];
}

// ─── Main ───

async function main() {
  const places = await prisma.place.findMany();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  RETAG ALL PLACES — full rebuild`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places in DB: ${places.length}\n`);

  let updateCount = 0;
  let zeroTagCount = 0;
  let fallbackCount = 0;
  const tagCounts = new Map<string, number>();
  const romanticSamples: { name: string; type: string; rating: number | null; price: number | null }[] = [];
  const chillSamples: { name: string; type: string; rating: number | null; price: number | null }[] = [];

  const updates: { id: string; vibeTags: string[] }[] = [];

  for (const place of places) {
    const p: PlaceData = {
      name: place.name,
      placeType: place.placeType,
      rating: place.rating,
      priceLevel: place.priceLevel,
    };

    const tags: string[] = [];

    // Apply all tag rules
    if (isTrending(p)) tags.push("trending");
    if (isStudy(p)) tags.push("study");
    if (isQuiet(p)) tags.push("quiet");
    if (isCoffee(p)) tags.push("coffee");

    let romantic = isRomantic(p);
    let chill = isChill(p);

    // Tiebreaker
    const resolved = applyTiebreaker(p, romantic, chill);
    romantic = resolved.romantic;
    chill = resolved.chill;

    if (romantic) tags.push("romantic");
    if (chill) tags.push("chill");

    if (isGroups(p)) tags.push("groups");
    if (isBudget(p)) tags.push("budget");
    if (isOutdoor(p)) tags.push("outdoor");

    // Fallback for 0 tags
    if (tags.length === 0) {
      const fb = fallbackTags(p);
      tags.push(...fb);
      fallbackCount++;
    }

    // Track stats
    for (const t of tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
    if (tags.length === 0) zeroTagCount++;

    // Collect samples
    if (romantic && romanticSamples.length < 10) {
      romanticSamples.push({ name: p.name, type: p.placeType, rating: p.rating, price: p.priceLevel });
    }
    if (chill && chillSamples.length < 10) {
      chillSamples.push({ name: p.name, type: p.placeType, rating: p.rating, price: p.priceLevel });
    }

    updates.push({ id: place.id, vibeTags: tags });
    updateCount++;
  }

  // ─── Write updates ───
  console.log(`--- Writing ${updates.length} updates to database ---\n`);
  for (const u of updates) {
    await prisma.place.update({
      where: { id: u.id },
      data: { vibeTags: u.vibeTags },
    });
  }
  console.log(`  Done.\n`);

  // ─── Summary ───
  console.log(`${"=".repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`  Total places retagged:     ${updateCount}`);

  let totalTags = 0;
  for (const [, count] of tagCounts) totalTags += count;
  console.log(`  Average tags per place:    ${(totalTags / updateCount).toFixed(1)}`);
  console.log(`  Places with 0 tags:        ${zeroTagCount}`);
  console.log(`  Places given fallback:     ${fallbackCount}\n`);

  // Tag distribution
  console.log(`--- Tag distribution ---\n`);
  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    const bar = "#".repeat(Math.min(Math.round(count / 10), 60));
    console.log(`  ${tag.padEnd(12)} ${String(count).padStart(5)}  ${bar}`);
  }

  // Romantic count check
  const romanticCount = tagCounts.get("romantic") ?? 0;
  const groupsCount = tagCounts.get("groups") ?? 0;
  console.log(`\n  Romantic count target 200-400: ${romanticCount} ${romanticCount >= 200 && romanticCount <= 400 ? "OK" : "REVIEW"}`);
  console.log(`  Groups count target 300-500:  ${groupsCount} ${groupsCount >= 300 && groupsCount <= 500 ? "OK" : "REVIEW"}`);

  // Samples
  console.log(`\n--- 10 sample ROMANTIC places ---\n`);
  for (const s of romanticSamples) {
    console.log(`  ${s.name.padEnd(45)} type: ${s.type.padEnd(25)} r: ${s.rating ?? "?"} p: ${s.price ?? "?"}`);
  }

  console.log(`\n--- 10 sample CHILL places ---\n`);
  for (const s of chillSamples) {
    console.log(`  ${s.name.padEnd(45)} type: ${s.type.padEnd(25)} r: ${s.rating ?? "?"} p: ${s.price ?? "?"}`);
  }

  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
