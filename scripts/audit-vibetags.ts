import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

// Intent display tags from app/api/places/route.ts
const INTENT_TAGS: Record<string, string[]> = {
  "Study/Work": ["Quiet", "Wifi", "Study Spot"],
  "Date/Chill": ["Romantic", "Cozy", "Aesthetic"],
  "Trending Now": ["Trending", "Popular", "Buzzing"],
  "Quiet Cafes": ["Peaceful", "Quiet", "Calm"],
  "Laptop-Friendly": ["Wifi", "Outlets", "Work-Friendly"],
  "Group Hangouts": ["Spacious", "Group-Friendly", "Lively"],
  "Budget Eats": ["Affordable", "Budget", "Good Value"],
  "Coffee & Catch-Up": ["Good Coffee", "Cozy", "Chill"],
  "Outdoor/Patio": ["Patio", "Fresh Air", "Scenic"],
  "Desserts": ["Sweet Treats", "Bakery", "Instagrammable"],
};

// Community vibe tags from lib/vibeTags.ts
const COMMUNITY_VIBE_LABELS = [
  "Cozy", "Trendy", "Chill", "Lively", "Romantic", "Minimalist", "Rustic", "Artsy",
  "Studying", "Date Night", "Group Hangout", "Solo Visit", "Working Remote", "Catching Up", "People Watching", "Reading",
  "Great Coffee", "Amazing Pastries", "Healthy Options", "Brunch Spot", "Late-Night Eats", "Cocktail Bar", "Budget-Friendly", "Splurge-Worthy",
  "Fast WiFi", "Lots of Outlets", "Quiet", "Loud/Energetic", "Good for Photos", "Pet-Friendly", "Spacious", "Hidden Gem",
];

const SUSPICIOUS_TYPES = [
  "butcher", "grocery", "store", "shop", "gas_station",
  "convenience", "pharmacy", "bank", "laundry", "car_wash", "hardware",
];

const RESTAURANT_TYPES = ["restaurant", "cafe", "bar", "bakery", "lounge", "food"];

async function main() {
  const places = await prisma.place.findMany({
    select: { id: true, name: true, address: true, placeType: true, vibeTags: true, rating: true },
  });

  // Also fetch community vibe votes
  const vibeVotes = await prisma.vibeVote.groupBy({
    by: ["placeId", "vibeTag"],
    _count: { vibeTag: true },
  });

  const votesByPlace = new Map<string, Map<string, number>>();
  for (const v of vibeVotes) {
    if (!votesByPlace.has(v.placeId)) votesByPlace.set(v.placeId, new Map());
    votesByPlace.get(v.placeId)!.set(v.vibeTag, v._count.vibeTag);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  VIBE TAG AUDIT REPORT`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`Total places: ${places.length}`);
  console.log(`Places with community vibe votes: ${votesByPlace.size}\n`);

  // ─── Section A: Intent distribution ───
  console.log(`\n--- SECTION A: Intent Distribution (via display tags) ---\n`);
  console.log(`Note: These are hard-coded display tags per intent, not derived from place data.`);
  console.log(`Counting places whose vibeTags JSON overlap with each intent's tag set.\n`);

  const intentCounts: [string, number][] = [];
  for (const [intent, tags] of Object.entries(INTENT_TAGS)) {
    const tagsLower = tags.map((t) => t.toLowerCase());
    let count = 0;
    for (const place of places) {
      const vt = place.vibeTags;
      if (vt && Array.isArray(vt)) {
        const placeTags = (vt as string[]).map((t) => t.toLowerCase());
        if (tagsLower.some((t) => placeTags.includes(t))) {
          count++;
        }
      }
    }
    intentCounts.push([intent, count]);
  }
  intentCounts.sort((a, b) => a[1] - b[1]);
  for (const [intent, count] of intentCounts) {
    const bar = "#".repeat(Math.min(count, 50));
    console.log(`  ${intent.padEnd(18)} ${String(count).padStart(4)}  ${bar}`);
  }

  // Also count by community vibe votes
  console.log(`\n  Community vibe vote distribution (top tags):\n`);
  const tagTotals = new Map<string, number>();
  for (const [, votes] of votesByPlace) {
    for (const [tag, count] of votes) {
      tagTotals.set(tag, (tagTotals.get(tag) || 0) + count);
    }
  }
  const sortedTags = [...tagTotals.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sortedTags) {
    console.log(`  ${tag.padEnd(20)} ${String(count).padStart(4)} votes`);
  }
  if (sortedTags.length === 0) console.log(`  (no community votes yet)`);

  // ─── Section B: Places with no vibe tags ───
  console.log(`\n\n--- SECTION B: Places With No Vibe Tags ---\n`);
  const noTags = places.filter((p) => {
    const vt = p.vibeTags;
    return !vt || (Array.isArray(vt) && vt.length === 0);
  });
  console.log(`Count: ${noTags.length} of ${places.length}\n`);
  if (noTags.length > 0 && noTags.length <= 50) {
    for (const p of noTags) {
      console.log(`  ${p.name.padEnd(40)} ${p.placeType.padEnd(20)} ${p.address}`);
    }
  } else if (noTags.length > 50) {
    for (const p of noTags.slice(0, 30)) {
      console.log(`  ${p.name.padEnd(40)} ${p.placeType.padEnd(20)} ${p.address}`);
    }
    console.log(`  ... and ${noTags.length - 30} more`);
  }

  // ─── Section C: Suspicious matches ───
  console.log(`\n\n--- SECTION C: Suspicious Places ---\n`);

  console.log(`  C1: Non-food/drink place types:\n`);
  let suspiciousCount = 0;
  for (const p of places) {
    const typeLower = p.placeType.toLowerCase();
    const matchedType = SUSPICIOUS_TYPES.find((t) => typeLower.includes(t));
    if (matchedType) {
      console.log(`  [${matchedType}] ${p.name} — ${p.placeType} — ${p.address}`);
      suspiciousCount++;
    }
  }
  if (suspiciousCount === 0) console.log(`  None found.`);

  console.log(`\n  C2: Romantic/date-tagged non-restaurant places:\n`);
  let dateCount = 0;
  for (const p of places) {
    const vt = p.vibeTags;
    if (vt && Array.isArray(vt)) {
      const tags = (vt as string[]).map((t) => t.toLowerCase());
      if (tags.some((t) => t.includes("romantic") || t.includes("date"))) {
        const typeLower = p.placeType.toLowerCase();
        if (!RESTAURANT_TYPES.some((rt) => typeLower.includes(rt))) {
          console.log(`  ${p.name} — type: ${p.placeType} — tags: ${(vt as string[]).join(", ")}`);
          dateCount++;
        }
      }
    }
  }
  if (dateCount === 0) console.log(`  None found.`);

  // ─── Section D: How vibeTags map to intents ───
  console.log(`\n\n--- SECTION D: Intent-to-Tag Mapping Reference ---\n`);
  console.log(`  Source: app/api/places/route.ts\n`);
  console.log(`  These are DISPLAY tags shown on cards, not filtering tags.\n`);
  for (const [intent, tags] of Object.entries(INTENT_TAGS)) {
    console.log(`  ${intent.padEnd(18)} → ${tags.join(", ")}`);
  }

  console.log(`\n  Source: app/api/places/route.ts (search queries)\n`);
  const INTENT_QUERIES: Record<string, string> = {
    study: "cafe wifi",
    date: "romantic restaurant bar",
    trending: "popular restaurant cafe",
    quiet: "quiet cafe tea",
    laptop: "cafe wifi coworking",
    group: "restaurant bar group",
    budget: "cheap restaurant cafe",
    desserts: "dessert cafe bakery ice cream pastry",
    coffee: "coffee shop cafe",
    outdoor: "patio restaurant outdoor",
  };
  for (const [intent, query] of Object.entries(INTENT_QUERIES)) {
    console.log(`  ${intent.padEnd(18)} → Google query: "${query}"`);
  }

  console.log(`\n  Source: lib/vibeTags.ts (community voteable tags)\n`);
  console.log(`  ${COMMUNITY_VIBE_LABELS.join(", ")}`);

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
