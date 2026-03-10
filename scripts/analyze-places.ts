import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  const places = await prisma.place.findMany();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  PLACE DATA ANALYSIS REPORT`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places: ${places.length}\n`);

  // ─── Section A: placeType distribution ───
  console.log(`\n--- SECTION A: placeType Distribution ---\n`);
  const typeCounts = new Map<string, number>();
  for (const p of places) {
    const t = p.placeType || "(empty)";
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  }
  const sortedTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const bar = "#".repeat(Math.min(count, 60));
    console.log(`  ${type.padEnd(30)} ${String(count).padStart(4)}  ${bar}`);
  }

  // ─── Section B: Price level distribution ───
  console.log(`\n\n--- SECTION B: Price Level Distribution ---\n`);
  const priceCounts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "null": 0 };
  for (const p of places) {
    const key = p.priceLevel != null ? String(p.priceLevel) : "null";
    priceCounts[key] = (priceCounts[key] || 0) + 1;
  }
  const priceLabels: Record<string, string> = { "1": "$ (Inexpensive)", "2": "$$ (Moderate)", "3": "$$$ (Expensive)", "4": "$$$$ (Very Expensive)", "null": "No price data" };
  for (const [level, count] of Object.entries(priceCounts)) {
    const bar = "#".repeat(Math.min(count, 60));
    console.log(`  ${(priceLabels[level] || level).padEnd(25)} ${String(count).padStart(4)}  ${bar}`);
  }

  // ─── Section C: Rating distribution ───
  console.log(`\n\n--- SECTION C: Rating Distribution ---\n`);
  const ratingBuckets = { "4.5+": 0, "4.0-4.4": 0, "3.5-3.9": 0, "3.0-3.4": 0, "Below 3.0": 0, "No rating": 0 };
  for (const p of places) {
    if (p.rating == null) ratingBuckets["No rating"]++;
    else if (p.rating >= 4.5) ratingBuckets["4.5+"]++;
    else if (p.rating >= 4.0) ratingBuckets["4.0-4.4"]++;
    else if (p.rating >= 3.5) ratingBuckets["3.5-3.9"]++;
    else if (p.rating >= 3.0) ratingBuckets["3.0-3.4"]++;
    else ratingBuckets["Below 3.0"]++;
  }
  for (const [bucket, count] of Object.entries(ratingBuckets)) {
    const bar = "#".repeat(Math.min(count, 60));
    console.log(`  ${bucket.padEnd(15)} ${String(count).padStart(4)}  ${bar}`);
  }

  // ─── Section D: Sample places per placeType ───
  console.log(`\n\n--- SECTION D: Sample Places per placeType ---\n`);
  const byType = new Map<string, string[]>();
  for (const p of places) {
    const t = p.placeType || "(empty)";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(p.name);
  }
  for (const [type] of sortedTypes) {
    const samples = (byType.get(type) || []).slice(0, 3);
    console.log(`  ${type}:`);
    for (const name of samples) {
      console.log(`    - ${name}`);
    }
  }

  // ─── Section E: Fields available ───
  console.log(`\n\n--- SECTION E: Field Population ---\n`);
  const fields: { name: string; populated: number }[] = [
    { name: "id", populated: places.filter((p) => p.id).length },
    { name: "googlePlaceId", populated: places.filter((p) => p.googlePlaceId).length },
    { name: "name", populated: places.filter((p) => p.name).length },
    { name: "lat", populated: places.filter((p) => p.lat != null).length },
    { name: "lng", populated: places.filter((p) => p.lng != null).length },
    { name: "address", populated: places.filter((p) => p.address).length },
    { name: "placeType", populated: places.filter((p) => p.placeType).length },
    { name: "priceLevel", populated: places.filter((p) => p.priceLevel != null).length },
    { name: "rating", populated: places.filter((p) => p.rating != null).length },
    { name: "photoUrl", populated: places.filter((p) => p.photoUrl).length },
    { name: "vibeTags", populated: places.filter((p) => p.vibeTags && Array.isArray(p.vibeTags) && (p.vibeTags as string[]).length > 0).length },
    { name: "createdAt", populated: places.filter((p) => p.createdAt).length },
  ];
  for (const f of fields) {
    const pct = ((f.populated / places.length) * 100).toFixed(0);
    const status = f.populated === places.length ? "FULL" : f.populated === 0 ? "EMPTY" : `${pct}%`;
    console.log(`  ${f.name.padEnd(18)} ${String(f.populated).padStart(4)} / ${places.length}  (${status})`);
  }

  // ─── Section F: Intent query mapping ───
  console.log(`\n\n--- SECTION F: Intent Query Mapping ---\n`);
  console.log(`  Source: app/api/places/route.ts\n`);
  console.log(`  Each intent sends a Google Places Text Search API call with these queries:\n`);

  const INTENT_QUERIES: Record<string, { primary: string; fallback: string }> = {
    study: { primary: "cafe wifi", fallback: "cafe" },
    date: { primary: "romantic restaurant bar", fallback: "restaurant" },
    trending: { primary: "popular restaurant cafe", fallback: "restaurant cafe" },
    quiet: { primary: "quiet cafe tea", fallback: "cafe" },
    laptop: { primary: "cafe wifi coworking", fallback: "cafe" },
    group: { primary: "restaurant bar group", fallback: "restaurant" },
    budget: { primary: "cheap restaurant cafe", fallback: "restaurant cafe" },
    desserts: { primary: "dessert cafe bakery ice cream pastry", fallback: "bakery cafe" },
    coffee: { primary: "coffee shop cafe", fallback: "cafe" },
    outdoor: { primary: "patio restaurant outdoor", fallback: "restaurant" },
  };

  const DISPLAY_TAGS: Record<string, string[]> = {
    study: ["Quiet", "Wifi", "Study Spot"],
    date: ["Romantic", "Cozy", "Aesthetic"],
    trending: ["Trending", "Popular", "Buzzing"],
    quiet: ["Peaceful", "Quiet", "Calm"],
    laptop: ["Wifi", "Outlets", "Work-Friendly"],
    group: ["Spacious", "Group-Friendly", "Lively"],
    budget: ["Affordable", "Budget", "Good Value"],
    desserts: ["Sweet Treats", "Bakery", "Instagrammable"],
    coffee: ["Good Coffee", "Cozy", "Chill"],
    outdoor: ["Patio", "Fresh Air", "Scenic"],
  };

  for (const [intent, queries] of Object.entries(INTENT_QUERIES)) {
    const tags = DISPLAY_TAGS[intent] || [];
    console.log(`  ${intent.padEnd(12)} primary: "${queries.primary}"`);
    console.log(`  ${"".padEnd(12)} fallback: "${queries.fallback}"`);
    console.log(`  ${"".padEnd(12)} display tags: ${tags.join(", ")}`);
    console.log(``);
  }

  console.log(`  Note: Places are fetched LIVE from Google Places API per request.`);
  console.log(`  The DB places table stores previously-seen places (from saves/visits).`);
  console.log(`  Display tags are generated at response time, not stored in DB.\n`);

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
